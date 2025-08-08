/* eslint-disable @typescript-eslint/no-unused-expressions */
import { catchAsync, Logger } from 'conexa-core-server';
import { Request, Response } from 'express';
import httpStatus from 'http-status';

import { IOrderUpdate, PanelErrorCodes, SetOperational } from '../interfaces/panel.interfaces';
import ApiError from '../lib/ApiError';
import * as carrierService from '../services/carrier.service';
import * as dbService from '../services/db.service';
import * as vtexService from '../services/vtex.service';
import * as formatService from '../services/formatting.service';
import { IDock, IOperativeDetail, OperativaInterface } from '../interfaces';
import { creationWebhookOCA } from '../services/utils.services';

export const getOrders = catchAsync(async (req: Request<{}, {}, {}, { userId: string }>, res: Response) => {
	const { query } = req;

	const user = await dbService.getUserById(query.userId);

	if (!user) throw new ApiError(httpStatus.FORBIDDEN, 'panel.user-not-found');

	const { vtexUrl } = user;
	const { orders, totalOrders } = await dbService.getOrdersPaginated({ ...query, vtexUrl });

	const formattedOrders = totalOrders > 0 ? await formatService.dbOrdersToFront(orders) : [];
	res.json({
		success: true,
		data: formattedOrders,
		totalOrders
	});
});

export const getOrder = catchAsync(
	async (req: Request<{}, {}, {}, { orderId: string; userId: string }>, res: Response) => {
		const { orderId, userId } = req.query;
		const user = await dbService.getUserById(userId as string);
		if (!user) {
			throw new ApiError(httpStatus.NOT_FOUND, 'The user does not exist', `panel.user-not-found`);
		}
		const order = await dbService.getOrderById(orderId as string);

		if (!order || !user._id.equals(order.userId))
			throw new ApiError(
				httpStatus.NOT_FOUND,
				`The order does not exists ${order ? 'for this user' : ''}`,
				`panel.order-not-found`
			);

		try {
			const response = await formatService.getOrderFormatted(user, order);

			return res.json({
				success: true,
				data: response
			});
		} catch (error: any) {
			return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
				success: false,
				error:
					PanelErrorCodes[error?.message as keyof typeof PanelErrorCodes] || PanelErrorCodes.UNKNOWN_ERROR
			});
		}
	}
);

export const editOrder = catchAsync(
	async (req: Request<{}, {}, IOrderUpdate, { userId: string; orderId: string }>, res: Response) => {
		Logger.info('@@@@ Edit order endpoint @@@@');

		let { body: dataToUpdate } = req;

		const { orderId } = req.query;

		if (dataToUpdate.packageData) {
			// @note Tiendanube needs package data but VTEX has the order with packageSetting
			dataToUpdate = { ...dataToUpdate, packageSettings: dataToUpdate.packageData };
		}

		const order = dataToUpdate.shippingAddress
			? await carrierService.setNewShippingAddress(orderId, dataToUpdate.shippingAddress)
			: await dbService.updateOrderByIdOrError(orderId, dataToUpdate);

		Logger.info(`@@@@ Order ${orderId} edited successful @@@@`);

		res.json({
			success: true,
			code: 'panel.order-edited',
			message: 'Order edited successfully',
			data: order.orderData
		});
	}
);

export const cancelOrders = catchAsync(
	async (req: Request<{}, {}, { orderId: string }, { userId: string }>, res: Response) => {
		const { userId } = req.query;
		const { orderId } = req.body;

		const user = await dbService.getUserById(userId);
		const order = await dbService.getOrderById(orderId);

		if (!user)
			throw new ApiError(
				httpStatus.NOT_FOUND,
				'No se encontró el usuario del paso previo del onboarding',
				'panel.user-not-exist'
			);

		if (!order) throw new ApiError(httpStatus.NOT_FOUND, 'The order does not exist', 'panel.order-not-found');

		const data = await carrierService.cancelShipment(user, order);

		res.json({
			success: true,
			code: 'panel.order-canceled',
			message: 'Order canceled successfully',
			data
		});
	}
);

export const ordersCreation = catchAsync(
	async (req: Request<{}, {}, { orderIds: string[] }, { userId: string }>, res: Response) => {
		Logger.info('@@@@ Creating orders @@@@');
		Logger.info(`Order ids: ${req.body.orderIds}`);

		const userId = String(req.query.userId);
		const { orderIds } = req.body;

		const user = await dbService.getUserById(userId);
		if (!user) throw new ApiError(httpStatus.BAD_REQUEST, 'User not found', 'panel.user-not-found');

		const ordersData = await carrierService.createOrders(orderIds, user);

		const allOrdersCreated = !ordersData.find((orderData) => orderData.error);

		res.status(allOrdersCreated ? httpStatus.OK : httpStatus.BAD_REQUEST).json({
			success: !!allOrdersCreated,
			code: allOrdersCreated ? 'panel.order-shipment-success' : 'panel.order-shipment-failed',
			data: ordersData
		});
	}
);

export const editReceiptSettings = catchAsync(async (req: Request, res: Response) => {
	const { userId } = req.query;
	const { receiptSettings } = req.body;
	const user = await dbService.getUserById(userId as string);

	if (!user) throw new ApiError(httpStatus.NOT_FOUND, `error.user-not-found`);

	user.receiptSettings = receiptSettings;

	user.save();

	res.status(httpStatus.OK).json({
		success: true,
		code: 'panel.edit-receipt-settings'
	});
});

export const getReceiptSettings = catchAsync(async (req: Request, res: Response) => {
	const { userId } = req;
	const user = await dbService.getUserById(userId as string);

	if (!user) throw new ApiError(httpStatus.NOT_FOUND, `error.user-not-found`);

	res.status(httpStatus.OK).json({
		success: true,
		code: 'panel.get-receipt-settings',
		receiptSettings: user.receiptSettings
	});
});

export const getAccountOca = catchAsync(async (req: Request, res: Response) => {
	const { userId } = req.query;

	const user = await dbService.getUserById(userId as string);
	if (!user) throw new ApiError(httpStatus.NOT_FOUND, 'User not found', 'error.user-not-found');

	const logInSettings = {
		email: user.email,
		accountNumber: user.accountNumber,
		password: user.password
	};

	res.status(httpStatus.OK).json({
		success: true,
		code: 'panel.get-account',
		logInSettings
	});
});

export const editAccount = catchAsync(async (req: Request, res: Response) => {
	const { userId } = req;
	const { logInSettings } = req.body;
	const { accountNumber, email, password } = logInSettings;

	const user = await dbService.getUserById(userId as string);
	if (!user) throw new ApiError(httpStatus.NOT_FOUND, `error.user-not-found`);

	user.password = password;
	user.email = email;
	user.accountNumber = accountNumber;

	const resultOperational = await carrierService.getOperationalByUser(email, password);

	const hasShippingSettings = !!resultOperational;

	user.save();

	res.status(httpStatus.OK).json({
		success: true,
		code: 'panel.edit-account',
		hasShippingSettings
	});
});

export const getOperationalData = catchAsync(
	async (req: Request<{}, {}, {}, { userId: string; locationId: string }>, res: Response) => {
		Logger.info('@@@@ Get operational endpoint @@@@');

		const { userId, locationId: dockId } = req.query;

		const user = await dbService.getUserById(userId);
		if (!user) {
			throw new ApiError(
				httpStatus.NOT_FOUND,
				'No se encontró el usuario del paso previo del onboarding',
				'panel.user-not-exist'
			);
		}

		const dispatch = await dbService.getDispatchByDockId(dockId, userId);
		if (!dispatch) {
			throw new ApiError(
				httpStatus.NOT_FOUND,
				'No se encontró el despacho configurado para el muelle.',
				'panel.dock-dispatch-not-exist'
			);
		}

		// Use the same response format that TN
		const allOperational = await carrierService.getOperationalByUser(user.email, user.password);

		if (!allOperational) {
			throw new ApiError(
				httpStatus.NOT_FOUND,
				'No se encontraron operacionales asociadas al usuario.',
				'panel.user-operational-not-found'
			);
		}

		res.status(httpStatus.OK).json({
			success: true,
			data: {
				doorToDoor: formatService.formatOperationalsToFront(user, allOperational.doorToDoor),
				doorToStore: formatService.formatOperationalsToFront(user, allOperational.doorToStore),
				storeToDoor: formatService.formatOperationalsToFront(user, allOperational.storeToDoor),
				storeToStore: formatService.formatOperationalsToFront(user, allOperational.storeToStore),
				doorToLocker: formatService.formatOperationalsToFront(user, allOperational.doorToLocker),
				storeToLocker: formatService.formatOperationalsToFront(user, allOperational.storeToLocker)
			}
		});
	}
);

export const creationOperationalData = catchAsync(
	async (
		req: Request<{}, {}, { shippingSettings: SetOperational }, { userId: string; locationId: string }>,
		res: Response
	) => {
		Logger.info('@@@@ Create operationals endpoint @@@@');

		const { body, query } = req;
		const { shippingSettings } = body;
		const { userId, locationId: dockId } = query;

		const user = await dbService.getUserById(userId);
		if (!user)
			throw new ApiError(
				httpStatus.NOT_FOUND,
				`No se encontró el usuario del paso previo del onboarding`,
				'panel.user-not-exist'
			);

		// if dock is not already saved, we create it
		let dbDock = await dbService.getDockById(dockId, user._id);
		if (!dbDock) {
			const vtexDock = await vtexService.getDockById(user.vtexAuth, dockId);
			if (!vtexDock.address?.postalCode)
				throw new ApiError(
					httpStatus.NOT_FOUND,
					`El muelle seleccionado no posee código postal.`,
					'dock.postal-code-not-exists'
				);

			dbDock = await dbService.createDock({
				dockId: vtexDock.id!,
				name: vtexDock.name,
				userId,
				postalCode: vtexDock.address.postalCode
			} as IDock);
		}

		const dataArray = [];
		shippingSettings.doorToDoor && dataArray.push(shippingSettings.doorToDoor);
		shippingSettings.doorToStore && dataArray.push(shippingSettings.doorToStore);
		shippingSettings.doorToLocker && dataArray.push(shippingSettings.doorToLocker);
		shippingSettings.storeToDoor && dataArray.push(shippingSettings.storeToDoor);
		shippingSettings.storeToStore && dataArray.push(shippingSettings.storeToStore);
		shippingSettings.storeToLocker && dataArray.push(shippingSettings.storeToLocker);

		const toStoreOperative = shippingSettings.doorToStore || shippingSettings.storeToStore || null;
		const toLockerOperative = shippingSettings.doorToLocker || shippingSettings.storeToLocker || null;

		const newOperationals: OperativaInterface[] = dataArray.map((elem) => {
			const operativeId = elem.split('-')[0]?.trim();
			return {
				accountNumber: operativeId!,
				accountType: elem,
				selected: true
			};
		});

		user.operational = await carrierService.saveOperationals(user, newOperationals, dockId);
		await user.save();

		// Create/update the shipping policy in Vtex
		await vtexService.createOrUpdateShippingPolicies(user, dbDock, toStoreOperative, toLockerOperative);

		// Associate shipping policy to dock in Vtex
		await vtexService.associateShippingPolicyToDockVtex(user, dockId, newOperationals);

		await creationWebhookOCA(user.accountNumber);

		// OCA freights webhook subscription
		const operatives: IOperativeDetail[] = newOperationals.map((op) => ({
			operativeId: Number(op.accountNumber),
			active: op.selected
		}));

		await carrierService.suscribeOperativesNotification(user.accountNumber, operatives);

		// save updated user
		await user.save();

		// Mark dock as available for delivery (if not exists in db, create one)
		dbDock = await dbService.updateDock({ dockId, userId: user._id }, { isActive: true });

		setTimeout(async () => {
			try {
				// Initial freight load
				await vtexService.initialFreightLoad(user, [dbDock!]);
			} catch (error) {
				Logger.debug(error);
				Logger.error(`Error loading freights for shop: ${user.vtexUrl}`);
			}

			try {
				// pickup points load
				await vtexService.initialPointsLoad(user);
			} catch (error) {
				Logger.debug(error);
				Logger.error(`Error loading Pickup points for shop: ${user.vtexUrl}`);
			}
		}, 0);

		Logger.info('Operationals saved successfully');
		res.status(httpStatus.OK).json({
			success: true,
			code: 'onboarding.config-dock'
		});
	}
);

export const updatePackage = catchAsync(
	async (req: Request<{}, {}, any, { userId: string }>, res: Response) => {
		const { userId } = req.query;
		const { packageSettings } = req.body;

		if (!userId) {
			throw new ApiError(
				400,
				'No se encontró el usuario del paso previo del onboarding',
				'panel.user-not-exist'
			);
		}

		const dimensions: Array<number> = [];

		dimensions.push(packageSettings.height);
		dimensions.push(packageSettings.length);
		dimensions.push(packageSettings.width);

		await dbService.updateDimensionPackage(userId as string, dimensions);

		res.status(200).json({
			success: true
		});
	}
);

export const printLabels = catchAsync(
	async (req: Request<{}, {}, { orderIds: string[] }, { userId: string }>, res: Response) => {
		Logger.info(`@@@@ Get labels endpoint @@@@`);

		const { orderIds } = req.body;
		const { userId } = req.query;

		const user = await dbService.getUserById(userId);

		if (!user) throw new ApiError(httpStatus.NOT_FOUND, 'User not found', `error.user-not-found`);
		if (orderIds.length === 0) throw new ApiError(httpStatus.BAD_REQUEST, 'Orders ids must be at least one');

		const userDock = await vtexService.getVtexDockByUser(user);
		const data = await carrierService.getLabels(orderIds, userDock);

		Logger.info('@@@@ Labels successfully created @@@@');

		res.status(httpStatus.CREATED).json({ success: true, data, code: 'panel.downloads-labels' });
	}
);

export const getNearbyDeliveryStores = catchAsync(
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
		const data = await carrierService.getNearbyStoresByPostalCode(code, 'delivery');

		res.status(httpStatus.OK).json({
			success: true,
			code: 'onboarding.nearby-stores',
			data
		});
	}
);

export const getDispatch = catchAsync(
	async (req: Request<{}, {}, {}, { userId: string; locationId: string }>, res: Response) => {
		const { userId, locationId: dockId } = req.query;

		const user = await dbService.getUserByIdOrError(userId);

		const dispatch = await dbService.getDispatchByDockAndUserIds(user._id, dockId);

		res.json({
			success: true,
			code: 'panel.get-dispatch',
			dispatch
		});
	}
);
