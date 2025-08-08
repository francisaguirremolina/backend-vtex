import { Response, Request } from 'express';

import httpStatus from 'http-status';
import { catchAsync, Logger } from 'conexa-core-server';
import * as vtexService from '../services/vtex.service';
import * as dbService from '../services/db.service';
import { getBusinessHours } from '../config/vtexCarriers';
import { ICarrier, PrefixTag } from '../interfaces';
import { InitialState } from '../interfaces/initialState.interfaces';
import ApiError from '../lib/ApiError';
import { getDispatchByUserId } from '../services/db.service/dispatch.db.service';
import { createPackage } from '../services/db.service/package.db.service';
import { formDataEmail } from '../services/emailing.service';
import { creationWebhookOCA } from '../services/utils.services';
import {
	getNearbyStoresByPostalCode,
	handleDispatchInfo,
	getOperationalByUser,
	getAccountNumberOca
} from '../services/carrier.service';
import { DefaultDispatchType } from '../interfaces/dispatch.interfaces';

// PUT INITIAL STATE
export const initialState = catchAsync(
	async (req: Request<{}, {}, InitialState, { userId: string; locationId: string }>, res: Response) => {
		const { userId, locationId: dockId } = req.query;
		const data = req.body;
		const user = await dbService.getUserById(userId as string);
		if (!user) {
			throw new ApiError(
				400,
				'No se encontró el usuario del paso previo del onboarding',
				'panel.user-not-exist'
			);
		}

		if (data.packageSettings) {
			const aux = [data.packageSettings.height, data.packageSettings.length, data.packageSettings.width];
			await createPackage({ userId: userId as string, dimensions: aux });
		}

		// Dispatch
		if (data.dispatchSettings)
			await handleDispatchInfo({ ...data.dispatchSettings, dockIds: [dockId], userId });

		// Operational
		if (data.shippingSettings) {
			// eslint-disable-next-line prefer-const
			let carriers: ICarrier[] = [];
			data.shippingSettings.forEach(async (element) => {
				carriers.push({
					id: element.accountNumber,
					slaType: element.accountType,
					name: PrefixTag.OCA,
					shippingMethod: element.accountType,
					isActive: true,
					scheduledDelivery: false,
					maxRangeDelivery: 0,
					dayOfWeekForDelivery: true,
					dayOfWeekBlockeds: [],
					freightValue: [],
					freightTableProcessStatus: 1,
					modals: [],
					onlyItemsWithDefinedModal: false,
					deliveryOnWeekends: true,
					weekendAndHolidays: {
						saturday: true,
						sunday: true,
						holiday: true
					},
					carrierSchedule: [],
					carrierBusinessHours: getBusinessHours(),
					maxDimension: {
						weight: 1000000,
						height: 1000,
						width: 1000,
						length: 1000,
						maxSumDimension: 3000
					},
					exclusiveToDeliveryPoints: false,
					minimunCubicWeight: 0,
					isPolygon: false
				});
				await dbService.saveOcaOperational(user._id, {
					accountNumber: element.accountNumber,
					accountType: element.accountType,
					selected: true,
					dockIds: []
				});
			});
			const { vtexKey, vtexToken, vtexUrl } = user.vtexAuth;
			vtexService.createCarriers(
				{
					vtexKey,
					vtexToken,
					vtexUrl
				},
				carriers
			);
			await creationWebhookOCA(user.accountNumber);
		}

		res.json({
			success: true,
			message: 'onboarding.authenticated',
			userId: data.userId
		});
	}
);

export const getInitialState = catchAsync(
	async (req: Request<{}, {}, {}, { userId: string }>, res: Response) => {
		const { userId } = req.query;
		const response: Omit<InitialState, 'packageSettings'> = {
			dispatchSettings: {
				activeDays: [
					{
						day: 1,
						active: true
					},
					{
						day: 2,
						active: true
					},
					{
						day: 3,
						active: true
					},
					{
						day: 4,
						active: true
					},
					{
						day: 5,
						active: true
					}
				],
				defaultDispatchType: DefaultDispatchType.STORE,
				defaultStoreId: '',
				defaultTimeRange: '1'
			},
			shippingSettings: [],
			storeUrl: '',
			userId: userId as string
		};

		const user = await dbService.getUserById(userId as string);

		if (!user) {
			throw new ApiError(
				400,
				'No se encontró el usuario del paso previo del onboarding',
				'panel.user-not-exist'
			);
		}
		if (user.operational) {
			response.shippingSettings = user.operational;
		}

		response.storeUrl = user.vtexUrl;

		const dispatch = await getDispatchByUserId(userId as string);

		if (dispatch) {
			response.dispatchSettings.activeDays = dispatch.activeDays;
			response.dispatchSettings.defaultDispatchType = dispatch.defaultDispatchType;
			response.dispatchSettings.defaultStoreId = dispatch.defaultStoreId;
			response.dispatchSettings.defaultTimeRange = dispatch.defaultTimeRange;
		}

		res.json({
			success: true,
			message: 'onboarding.authenticated',
			data: response
		});
	}
);

export const vtex = catchAsync(
	async (req: Request<{}, {}, { vtexUrl: string; vtexKey: string; vtexToken: string }>, res: Response) => {
		const { vtexUrl, vtexKey, vtexToken } = req.body;

		const vtexAuth = vtexService.getAuthObject(vtexKey, vtexToken, vtexUrl);
		await vtexService.validateCredentials(vtexAuth);

		const userExists = await dbService.getUserByVtexUrl(vtexUrl);
		const userId = userExists ? userExists._id : await dbService.createUser(vtexAuth);

		await vtexService.subscribeWebhook(vtexAuth);

		res.json({
			success: true,
			message: 'onboarding.authenticated',
			userId
		});
	}
);

export const carrier = catchAsync(
	async (
		req: Request<{}, {}, { email: string; accountNumber: string; password: string }, { userId: string }>,
		res: Response
	) => {
		const { userId } = req.query;
		const { email, accountNumber, password } = req.body;

		const user = await dbService.getUserById(userId as string);
		if (!user) {
			throw new ApiError(httpStatus.FORBIDDEN, 'onboarding.user-not-found');
		}

		let operationals;
		try {
			const validAccountNumberOca = await getAccountNumberOca(email, password);
			if (!validAccountNumberOca || validAccountNumberOca !== accountNumber) {
				Logger.error('Invalid account number');
				throw new Error('Invalid account number');
			}

			operationals = await getOperationalByUser(email, password);
		} catch (error) {
			throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid Credentials', 'onboarding.invalid-credentials');
		}

		if (!operationals)
			throw new ApiError(
				httpStatus.FORBIDDEN,
				'User has not operationals',
				'onboarding.operationals-not-found'
			);

		await dbService.updateUserOca(userId as string, accountNumber, email, password);

		res.status(200).json({
			success: true,
			message: 'Credenciales del OCA validadas correctamente.',
			userId
		});
	}
);

export const getNearbyStores = catchAsync(
	async (req: Request<{}, {}, {}, { postalCode: string; userId: string }>, res: Response) => {
		Logger.info('@@@@ Getting Nearby Stores @@@@');

		const { postalCode, userId } = req.query;
		const user = await dbService.getUserById(userId);

		if (!user) {
			throw new ApiError(
				httpStatus.BAD_REQUEST,
				'No se encontró el usuario del paso previo del onboarding',
				'panel.user-not-exist'
			);
		}

		const code = Number(postalCode);
		const nearbyStores = await getNearbyStoresByPostalCode(code, 'admission');

		res.status(httpStatus.OK).json({
			success: true,
			code: 'onboarding.nearby-stores',
			data: nearbyStores
		});
	}
);

export const register = catchAsync(async (req: any, res: Response) => {
	const { userId } = req.query;
	const { personalData, store } = req.body;
	const { inscriptionAFIP, inscriptionIB } = req.files;

	const user = await dbService.getUserById(userId as string);

	if (!user) {
		throw new ApiError(
			400,
			'No se encontró el usuario del paso previo del onboarding',
			'panel.user-not-exist'
		);
	}

	if (!inscriptionAFIP) {
		Logger.error(JSON.stringify(inscriptionAFIP));
		throw new ApiError(httpStatus.BAD_REQUEST, `onboarding.register-invalid-format-AFIP`);
	}
	if (!inscriptionIB) {
		Logger.error(JSON.stringify(inscriptionIB));
		throw new ApiError(httpStatus.BAD_REQUEST, `onboarding.register-invalid-format-IB`);
	}

	const merchant = JSON.parse(store);
	const files = [...inscriptionAFIP, ...inscriptionIB];

	merchant.storeUrl = user.vtexUrl;

	await formDataEmail({ files, personalData, store: JSON.stringify(merchant) });

	return res.status(httpStatus.OK).json({
		success: true,
		code: 'onboarding.register'
	});
});
