/* eslint-disable import/no-cycle */
/* eslint-disable no-await-in-loop */
import vtexPackage from 'vtex-package-ts';
import {
	IFreight,
	IFreightCreationPayload,
	IShippingPolicy,
	IVtexAuth,
	RequestOptions
} from 'vtex-package-ts/dist/interfaces';
import { CustomError, Logger } from 'conexa-core-server';
import httpStatus from 'http-status';
import { setTimeout } from 'timers/promises';
import {
	IOrderDocument,
	IPickupPoint,
	IUserDocument,
	ICarrier,
	IDock,
	IDockDocument,
	OperativaInterface
} from '../interfaces';
import config from '../config/config';
import ApiError from '../lib/ApiError';
import * as dbService from './db.service';
import * as formatService from './formatting.service';
import * as carrierService from './carrier.service';
import { extractEncryptedEmail } from '../utils/vtex.utils';

const { shipments: vtex } = vtexPackage;

export const {
	getAuthObject,
	getOrderById,
	addTrackingInfo,
	getActiveDocks: getDocks,
	createOrUpdateDock,
	getDockById,
	getOrders,
	getFreightValues,
	createOrUpdateFreightValues,
	deletePickUpPoint,
	getPickUpPoints
} = vtex;

export const tryToAddTrackingInfo = async (vtexAuth: IVtexAuth, dbOrder: IOrderDocument) => {
	Logger.info(`Trying to update tracking info to VTEX for order ${dbOrder.orderId}`);

	if (!dbOrder.invoiceNumber) {
		Logger.info('Invoice number missing');
		return;
	}

	if (!dbOrder.orderIdOca) {
		Logger.info('Tracking info missing');
		return;
	}

	const trackingInfo = {
		trackingNumber: dbOrder.orderIdOca,
		trackingUrl: dbOrder.trackingUrl || '',
		courier: dbOrder.orderData.shippingData.logisticsInfo[0]?.selectedSla || ''
	};
	await addTrackingInfo(vtexAuth, dbOrder.orderId, dbOrder.invoiceNumber, trackingInfo);
};

export const validateCredentials = async (vtexAuth: IVtexAuth) => {
	try {
		const response = await vtex.validateCredentials(vtexAuth);

		if (response.error)
			throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid credentials', 'onboarding.invalid-credentials');
	} catch (error) {
		if (error instanceof ApiError) throw error;

		throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Could not validate credentials');
	}
};

export const subscribeWebhook = async (vtexAuth: IVtexAuth) => {
	const hookUrl = `${config.api.url}/api/v1/webhooks/vtex/orders`;
	Logger.debug(`HOOK URL --> ${hookUrl}`);

	const result = await vtex.createWebhook({ vtexAuth, hookUrl });

	Logger.debug(`AUTH VTEX --> ${result}`);

	return true;
};

export const createCarriers = async (vtexAuth: IVtexAuth, carriers: ICarrier[]) =>
	vtex.createOrUpdateCarriersByName(vtexAuth, carriers);

export const getPickUpPoint = async (vtexAuth: IVtexAuth, pointId: string): Promise<IPickupPoint | null> => {
	try {
		const point = await vtex.getPickUpPoint(vtexAuth, pointId);
		return point;
	} catch (error) {
		return null;
	}
};

export const createPickupPoints = async (
	vtexAuth: IVtexAuth,
	pickUpPoints: IPickupPoint[],
	options?: RequestOptions
) => {
	try {
		const { rejected } = await vtex.createPickUpPoints(vtexAuth, pickUpPoints, {
			numberOfRetries: 5,
			batchSize: 100,
			msDelay: 60000,
			...options
		});
		Logger.info('@@@@ Oca PickUpPoints created successfully in VTEX @@@@');

		if (rejected.length > 0) {
			throw new ApiError(
				httpStatus.INTERNAL_SERVER_ERROR,
				`Some pickupPoints was not created successfully. Example: ${rejected[0]}`
			);
		}

		return true;
	} catch (error) {
		throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, `Error creating pickup points: ${error}`);
	}
};

export const getVtexDockByUser = async (user: IUserDocument) => {
	try {
		const userDock = await dbService.getDockByUserId(user._id);

		if (!userDock) throw new ApiError(httpStatus.NOT_FOUND, `User (${user._id}) dock not found`);

		return await getDockById(user.vtexAuth, userDock.dockId);
	} catch (error) {
		if (error instanceof ApiError) throw error;
		throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, `Error getting dock by userId: ${error}`);
	}
};

function filterTableIds(
	freightTableIds: string[] | undefined | null,
	filter: string,
	include: boolean = false
): string[] {
	return freightTableIds?.filter((id) => include === id.includes(filter)) || [];
}

export const associateShippingPolicyToDockVtex = async (
	user: IUserDocument,
	dockId: string,
	operationals: OperativaInterface[]
) => {
	try {
		const vtexDock = await getDockById(user.vtexAuth, dockId);

		const dockPostalCode = `-${vtexDock.address?.postalCode}`;

		vtexDock.freightTableIds = filterTableIds(vtexDock.freightTableIds, dockPostalCode);
		const operationalIds = operationals.map(({ accountNumber }) => `${accountNumber}${dockPostalCode}`);
		await createOrUpdateDock(user.vtexAuth, {
			...vtexDock,
			freightTableIds: vtexDock.freightTableIds.concat(operationalIds)
		});
	} catch (error) {
		if (error instanceof CustomError) {
			throw error;
		} else {
			Logger.error(error);
			throw new CustomError(
				`Error trying to associateShippingPolicyToDockVtex : ${error}`,
				httpStatus.INTERNAL_SERVER_ERROR
			);
		}
	}
};

export const getFreightValuesByCP = async (
	user: IUserDocument,
	operationalId: string,
	postalCode: string
): Promise<IFreight[]> => {
	try {
		return await getFreightValues(user.vtexAuth, operationalId, postalCode);
	} catch (error) {
		if (error instanceof ApiError) throw error;
		throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, `Error getting shipment quotations: ${error}`);
	}
};

const sendBatchs = async (
	user: IUserDocument,
	operationalId: string,
	batchs: IFreightCreationPayload[][]
) => {
	Logger.info(`Batchs to send: ${batchs.length} - operationalId: ${operationalId}`);
	// eslint-disable-next-line no-restricted-syntax
	for await (const batch of batchs) {
		Logger.info(`Sending batch length: ${batch.length}`);

		try {
			await createOrUpdateFreightValues(user.vtexAuth, operationalId, batch);
			await setTimeout(5000);
		} catch (error) {
			Logger.debug(error);
			if (error instanceof ApiError) throw error;
			Logger.error(`Error creating/updating shipment quotations of operationalId: ${operationalId}`);
			throw new ApiError(
				httpStatus.INTERNAL_SERVER_ERROR,
				`Error creating/updating shipment quotations of operationalId: ${operationalId} => ${error}`
			);
		}
	}

	return true;
};

export const updateFreights = async (user: IUserDocument, docks: IDock[], operativeId: string) => {
	const errors = [];
	// eslint-disable-next-line no-restricted-syntax
	for await (const dock of docks) {
		const { name, postalCode, dockId } = dock;
		Logger.info(`Updating freights dock: ${name}, operative: ${operativeId}, postalCode: ${postalCode}`);

		try {
			const rates = await carrierService.getOcaShippingRates(Number(postalCode), Number(operativeId));
			const groupedRates = formatService.groupRates(rates);
			const ratesFormatted = formatService.formatFreightValues(groupedRates);
			const batchs = formatService.generateBatch(ratesFormatted);

			const vtexOperativeId = `${operativeId}-${postalCode}`;
			await sendBatchs(user, vtexOperativeId, batchs);
		} catch (error) {
			Logger.error(error);
			errors.push({ name, dockId });
		}
	}
	Logger.warn(`Errors updateFreights, operative ${operativeId}: ${errors.length}`);
	Logger.debug(errors);

	return errors.length === 0;
};

export const initialFreightLoad = async (user: IUserDocument, docks: IDockDocument[]) => {
	// eslint-disable-next-line no-restricted-syntax
	for await (const dock of docks) {
		if (dock.isActive) {
			const operativeIds: string[] = [];
			user.operational.forEach((op) => {
				if (op.dockIds?.includes(dock.dockId)) operativeIds.push(op.accountNumber);
			});

			Logger.info(`Uploading Freights: dockId= ${dock.dockId} - operativeIds= ${operativeIds}`);

			const loadsWithError: string[] = [];

			// eslint-disable-next-line no-restricted-syntax
			for await (const id of operativeIds) {
				if (!dock.ratesLoadedOperativeIds?.includes(id)) {
					const allLoaded = await updateFreights(user, [dock], id);
					if (!allLoaded) loadsWithError.push(id);
				} else {
					Logger.warn(`Dock ${dock.dockId} already has updated rates for operational: ${id}.`);
				}
			}

			const ratesLoadedIds = dock.ratesLoadedOperativeIds || [];
			// eslint-disable-next-line no-param-reassign
			dock.ratesLoadedOperativeIds = ratesLoadedIds.concat(
				operativeIds.filter((item) => !ratesLoadedIds.includes(item) && !loadsWithError.includes(item))
			);
			await dock.save();
		}
	}
};

export const initialPointsLoad = async (user: IUserDocument) => {
	// PICKUP POINTS LOAD: This process runs after we send the response to client
	if (!user.pickupPointsLoaded || user.pickupPointsLoaded === 'ERROR') {
		Logger.info(`Creating pickupPoints to: ${user.vtexUrl}`);
		try {
			await dbService.setUserPointsLoadStatus(user._id, 'LOADING');

			const allOCADeliveryStores = await carrierService.getAllDeliveryStores();
			const ocaStoresFormatted = formatService.formatOCAStoresToVTEX(allOCADeliveryStores);

			await createPickupPoints(user.vtexAuth, ocaStoresFormatted);

			await dbService.setUserPointsLoadStatus(user._id, 'LOADED');
		} catch (error) {
			await dbService.setUserPointsLoadStatus(user._id, 'ERROR');

			Logger.error(`Some pickupPoints was not loaded for merchant: ${user.vtexUrl}`);
			Logger.error(error);
		}
	} else {
		Logger.info(`${user.vtexUrl} is already pickupPoints loaded.`);
	}
};

// Shipping policies
export const createOrUpdateShippingPolicies = async (
	user: IUserDocument,
	dock: IDockDocument,
	toStoreOperative: string | null,
	toLockerOperative: string | null
) => {
	try {
		const policies: IShippingPolicy[] = [];
		const policiesToDeactivate: string[] = [];
		const dispatch = await dbService.getDispatchByDockAndUserIds(user._id, dock.dockId);
		if (!dispatch || !dock.postalCode)
			throw new CustomError(
				`Dispatch with userId ${
					user._id
				} or postalCode of Dock not found: dispatch=${!!dispatch} dock.postalCode=${!!dock.postalCode}`,
				httpStatus.NOT_FOUND
			);

		user.operational.forEach((op) => {
			if (op.dockIds?.includes(dock.dockId)) {
				policies.push(
					formatService.formatVtexShippingPolicy(op, dock.postalCode, toStoreOperative, toLockerOperative)
				);
			} else if (!op.dockIds?.length) {
				policiesToDeactivate.push(op.accountNumber);
			}
		});

		if (policies.length === 0) {
			Logger.error('No operationals to update');
			throw new CustomError('No operationals to update', httpStatus.BAD_REQUEST);
		}

		await vtexPackage.shipments.createShippingPoliciesV2(user.vtexAuth, policies, policiesToDeactivate);
	} catch (error) {
		Logger.error(error);
	}
};

/**
 * Unlinks disabled operational accounts from associated docks and updates the dock configurations.
 *
 * This function processes a list of docks, identifying those unavailable for delivery,
 * and removes references to operational accounts marked as disabled (`selected === false`)
 * from their freight tables. The dock configurations are updated in VTEX, and the docks
 * are unlinked from the user's operational records in the database.
 *
 * @param user - The user document containing operational data and VTEX authentication information.
 * @param docks - An array of dock requests, where each dock includes location details and delivery availability.
 *
 * @returns {Promise<void>} - Resolves when the operations are completed for all docks.
 */
export const unlinkOperationalsFromDisabledDocks = async (
	refUser: IUserDocument,
	unLinkDocks: Record<string, IDockDocument>
) => {
	const user = await dbService.deleteDockFromUserOperativesMasive(refUser, unLinkDocks);
	if (!user) throw new Error(`User ${refUser.vtexUrl} does not exist`);

	// eslint-disable-next-line no-restricted-syntax
	for await (const dock of Object.values(unLinkDocks)) {
		const vtexDock = await getDockById(user.vtexAuth, dock.dockId);

		const dockPostalCode = `-${vtexDock.address?.postalCode}`;

		const deactivePolicies = filterTableIds(vtexDock.freightTableIds, dockPostalCode, true);

		const freightTableIds = filterTableIds(vtexDock.freightTableIds, dockPostalCode);

		await createOrUpdateDock(user.vtexAuth, {
			...vtexDock,
			freightTableIds,
			isActive: !!freightTableIds.length
		});
		await vtexPackage.shipments.deactivateShippingPolicy(user.vtexAuth, deactivePolicies);
	}
};

export const getValidEmail = async (vtexAuth: IVtexAuth, encryptedEmail: string) => {
	try {
		const decryptedEmail = await vtex.decryptOrderEmail(vtexAuth, encryptedEmail);
		if (typeof decryptedEmail !== 'object') return extractEncryptedEmail(encryptedEmail);

		Logger.info('@@@@ Email successfully decrypted @@@@');
		return decryptedEmail.email;
	} catch (error) {
		throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, `Error decrypting client email: ${error}`);
	}
};
