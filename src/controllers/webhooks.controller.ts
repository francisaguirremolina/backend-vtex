import { FlowLogger, Logger, catchAsync } from 'conexa-core-server';
import { Request, RequestHandler, Response } from 'express';

import { IOrder, IVtexAuth, OrderState } from 'vtex-package-ts/dist/interfaces';
import httpStatus from 'http-status';
import * as dbService from '../services/db.service';
import * as vtexService from '../services/vtex.service';
import * as formatService from '../services/formatting.service';
import * as ocaService from '../services/carrier.service';

import {
	AdmissionPackageBranch,
	IShippingRatesWebhook,
	IUserDocument,
	PointsWebhookOCA,
	PrefixTag,
	WebhookOCA
} from '../interfaces';
import ApiError from '../lib/ApiError';
import { getInfoStatus, getPendingInfo } from '../utils/statusOca.utils';

export const vtex: RequestHandler = async (req, res) => {
	try {
		const { body } = req;
		if (body.hookConfig === 'ping') return handlePingResponse(res);

		const vtexKey: string = body?.Origin?.Key;
		const orderState: OrderState = body?.State;
		const orderId: string = body?.OrderId;

		const logger = new FlowLogger(vtexKey);
		logger.info(`Process order ${orderId}`);

		const user = await dbService.getUserByVtexWebhook(vtexKey);

		if (!user) {
			logger.info(`USER NOT FOUND`);
			return res.send(`No user found with apiKey: ${vtexKey}`);
		}

		const { vtexAuth } = user;
		const vtexOrder = await vtexService.getOrderById(vtexAuth, orderId);
		if (!vtexOrder) {
			return res.send(`Order ${orderId} not found`);
		}

		logger.debug(`DELIVERY COMPANY --> ${vtexOrder.shippingData?.logisticsInfo[0]?.deliveryCompany}`);
		const deliveryCompany = vtexOrder.shippingData?.logisticsInfo[0]?.deliveryCompany || '';

		if (!deliveryCompany.includes(PrefixTag.OCA)) {
			logger.info('ORDER DOESNT BELONG TO CARRIER');
			return res.send(`Order ${orderId} doesn't belong to carrier`);
		}

		switch (orderState) {
			case 'ready-for-handling':
				logger.info('HANDLING ORDER');
				await readyForHandlingProcess(user, vtexOrder);
				break;
			case 'invoiced':
				await invoicedProcess(vtexAuth, vtexOrder);
				break;
			case 'canceled':
				await canceledProcess();
				break;
			default:
				break;
		}

		return res.send('ok');
	} catch (error) {
		Logger.error('There was a problem processing the webhook');
		Logger.error(error);
		res.send('There was a problem processing the webhook');
	}
};

const handlePingResponse = (res: Response) => {
	Logger.info('Received PING');
	res.status(200).send('ping ok');
};

async function readyForHandlingProcess(user: IUserDocument, vtexOrder: IOrder) {
	const { orderId, shippingData, items, packageAttachment, clientProfileData } = vtexOrder;
	const { vtexUrl } = user;

	const previousOrder = await dbService.getOrderByParams({ orderId });

	if (previousOrder) return;

	if (!user) {
		throw new ApiError(400, 'No se encontró el usuario');
	}

	const docks = await vtexService.getDocks(user.vtexAuth);

	const auxDocks = docks.find((r) => r.id === shippingData.logisticsInfo[0]?.deliveryIds[0]?.courierId);

	const packageSettings = formatService.getTotalDimensions(items);

	const pickupPointId = shippingData?.logisticsInfo?.[0]?.pickupPointId;

	const { id, code, description } = getPendingInfo();

	const invoiceNumber = packageAttachment?.packages?.[0]?.invoiceNumber;

	const orderContent = {
		...(invoiceNumber && { invoiceNumber }),
		recipient: {
			firstName: clientProfileData.firstName,
			lastName: clientProfileData.lastName,
			cuil: clientProfileData.document
		},
		packageSettings: { ...packageSettings, bulks: 1 },
		shippingAddress: {
			province: shippingData.address.city || '',
			locality: shippingData.address.neighborhood || '',
			number: shippingData.address.number || '',
			street: shippingData.address.street || '',
			floor: '',
			apartment: '',
			postalCode: shippingData.address.postalCode
		},
		origin: {
			province: auxDocks?.address?.city || '',
			locality: auxDocks?.address?.neighborhood || '',
			number: auxDocks?.address?.number,
			street: auxDocks?.address?.street,
			floor: '',
			apartment: '',
			postalCode: auxDocks?.address?.postalCode
		},
		orderId,
		userId: user._id,
		vtexUrl,
		...(pickupPointId && { pickupPointId }),
		orderData: vtexOrder,
		status: code,
		trackingStatus: id,
		descriptionStatus: description,
		receiptSettings: { ...user.receiptSettings }
	};

	await dbService.createOrder(orderContent);
	Logger.info(`==== Order ${orderId} was created ====`);
}

async function invoicedProcess(vtexAuth: IVtexAuth, vtexOrder: IOrder) {
	const { orderId } = vtexOrder;
	const invoiceNumber = vtexOrder.packageAttachment.packages[0]?.invoiceNumber || 'something';
	if (!invoiceNumber) {
		Logger.error(`Couldn't parse invoice number`);
		return;
	}

	const dbOrder = await dbService.updateOrderByParamsOrError({ orderId }, { invoiceNumber });

	await vtexService.tryToAddTrackingInfo(vtexAuth, dbOrder);
}

async function canceledProcess() {
	return 'ok';
}

// OCA
export const carrier = catchAsync(async (req: Request<{}, {}, WebhookOCA, {}>, res: Response) => {
	try {
		Logger.info(`@@@ create shipment @@@`);

		const data = req.body;
		const { nroEnvio: orderIdOca, estado: descriptionStatus, idEstado: idStatus } = data;

		const order = await dbService.getOrderByParams({ orderIdOca });
		if (!order) {
			const message = `Order ${orderIdOca} not found`;
			Logger.warn(message);
			return res.status(httpStatus.NOT_FOUND).json({ message });
		}

		const { code: dbStatus } = getInfoStatus(idStatus);
		await dbService.updateOrderByIdOrError(order._id, {
			status: dbStatus,
			trackingStatus: idStatus,
			descriptionStatus
		});

		return res.status(httpStatus.OK).json({
			message: `Status ${orderIdOca} successfully updated`
		});
	} catch (error) {
		Logger.error('There was a problem processing the webhook');
		Logger.error(error);
		return res.status(httpStatus.INTERNAL_SERVER_ERROR).send('There was a problem processing the webhook');
	}
});

// OCA
export const updateShippingRates = catchAsync(
	async (req: Request<{}, {}, IShippingRatesWebhook, {}>, res: Response) => {
		const { idProducto } = req.body;

		Logger.info(`@@@ Update shipping rates @@@`);
		Logger.debug(`Request body: ${JSON.stringify(req.body)}`);

		setTimeout(async () => {
			try {
				const operativeIds = idProducto.split(',');
				if (!operativeIds) return;

				// eslint-disable-next-line no-restricted-syntax
				for await (const operativeId of operativeIds) {
					Logger.info(`@@@ Updating shipping rates for operationalId: ${operativeId} @@@`);

					const users = await dbService.getUsersByOperationalActive(operativeId);
					if (!users || !users.length) {
						Logger.error(`No users for operativeId ${operativeId}.`);
					} else {
						// eslint-disable-next-line no-restricted-syntax
						for await (const user of users) {
							const docks = await dbService.getActiveDocks(user._id);
							if (!docks) {
								Logger.error('No active docks.');
							} else {
								await vtexService.updateFreights(user, docks, operativeId);
								Logger.info(`Shipping rates for operativeId: ${operativeId} was updated.`);
							}
						}
					}
				}
			} catch (error) {
				Logger.error('There was a problem processing the webhook');
				Logger.error(error);
			}
		}, 0);

		return res.sendStatus(httpStatus.OK);
	}
);

export const updatePickUpPoint = catchAsync(
	async (req: Request<{}, {}, PointsWebhookOCA, {}>, res: Response) => {
		const { CentrosDeImposicion } = req.body;
		Logger.debug(CentrosDeImposicion);
		const { IdCentroImposicion: pointId, StatusABM: action } = CentrosDeImposicion.Centro;

		Logger.info(`@@@ Updating pickup point: ${pointId} @@@`);

		const users = await dbService.getUsers();

		const failures = [];

		// eslint-disable-next-line no-restricted-syntax, no-unreachable-loop
		for await (const user of users) {
			Logger.info(`@@@ Updating pickup point: ${pointId} for user: ${user.vtexUrl} @@@`);

			try {
				// Actions - 1: create; 2: delete; 3: update
				// 2 - delete point
				if (action === 2) {
					const prefixValues = Object.values(PrefixTag);
					// eslint-disable-next-line no-restricted-syntax
					for await (const tag of prefixValues) {
						const prefixId = `${tag}-${pointId}`;
						const point = await vtexService.getPickUpPoint(user.vtexAuth, prefixId);
						if (point) {
							await vtexService.deletePickUpPoint(user.vtexAuth, prefixId);
						}
					}
					return true;
				}

				// 1, 3 - create or update point
				// get point information from oca
				const ocaPoint = await ocaService.getPointData(pointId);

				// Format point data for vtex
				const formattedPoint = formatService.formatOCAStoresToVTEX([
					{ ...ocaPoint, phone: ocaPoint.phone || '' } as Required<AdmissionPackageBranch>
				]);

				// Create or update pickup point in vtex
				await vtexService.createPickupPoints(user.vtexAuth, formattedPoint, { msDelay: 1 });
			} catch (error) {
				failures.push({ user, error });
			}
		}

		if (failures.length > 0) {
			Logger.error(`Failed: ${JSON.stringify(failures)}`);
			return res.sendStatus(httpStatus.NO_CONTENT);
		}

		Logger.info(`Pickup point was updated.`);
		return res.sendStatus(httpStatus.OK);
	}
);

export const deleteAllPickUpPoints = catchAsync(async (req: Request, res: Response) => {
	const user = await dbService.getUserById(req.query.userId as string);

	Logger.info(`@@@ Deleting all points for: ${user?.vtexUrl} @@@`);

	const pickUpPoints = await vtexService.getPickUpPoints(user?.vtexAuth!);

	// eslint-disable-next-line array-callback-return
	const pickUpPointIds = pickUpPoints
		.filter((point) => point.id.includes(PrefixTag.OCA) || point.id.includes(PrefixTag.LOCKER))
		.map((point) => point.id);

	// eslint-disable-next-line no-console
	console.log('pickUpPointIds.length: ', pickUpPointIds.length);

	// eslint-disable-next-line no-restricted-syntax
	for await (const id of pickUpPointIds) {
		// eslint-disable-next-line no-console
		console.log(`@ Deleting  point: ${id}`);
		await vtexService.deletePickUpPoint(user?.vtexAuth!, id);
	}

	Logger.info(`Pickup point was deleted.`);
	return res.sendStatus(httpStatus.OK);
});
