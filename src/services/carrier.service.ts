/* eslint-disable import/no-cycle */
import { ocaControllers } from 'oca-package';
import { IDock } from 'vtex-package-ts/dist/interfaces';
import httpStatus from 'http-status';
import { Logger } from 'conexa-core-server';
import {
	BranchOCA,
	IColumnsConfig,
	IMailOptionsNodemailer,
	IOthersModels
} from 'oca-package/dist/interface/oca.interface';
import { IOrderDocument, IUserDocument, OperativaInterface, ShippingAddress } from '../interfaces';
import { getOrderById, updateOrderByParamsOrError, updateOrderByIdOrError } from './db.service';
import ApiError from '../lib/ApiError';
import * as typeGuards from '../utils/typeGuards';
// eslint-disable-next-line import/no-cycle
import * as vtexService from './vtex.service';
import * as dbService from './db.service/index';
import {
	AdmissionPackageBranch,
	DeliveryPackageBranch,
	IOperativeDetail,
	IRate,
	PrefixTag,
	ServicesAvailable
} from '../interfaces/oca.interfaces';
import {
	filterBranchsFromOCA,
	filterHours,
	formatOrderDataReceipt
} from './formatting.service/carrier.formatting';
import { DefaultDispatchType, IDispatch } from '../interfaces/dispatch.interfaces';
// eslint-disable-next-line import/no-cycle
import pdf from '../lib/pdf';
import { handleAddressForDeepUpdate } from './formatting.service/order.formatting';
import { IOrderCreationResponse, PanelErrorCodes } from '../interfaces/panel.interfaces';
import { formatShipmentInformation } from './formatting.service';
import config from '../config/config';
import { getCanceledInfo, getCreatedInfo } from '../utils/statusOca.utils';
import { Environments } from '../interfaces/app.interfaces';

const getOCADeliveryTickets = async (
	data: { deliveryId: string; deliveryNumber: string } | Array<{ deliveryId: string; deliveryNumber: string }>
): Promise<string> => {
	try {
		const { getDeliveryTicket, getDeliveryTickets } = ocaControllers.deliveryController;
		const checkIfDataIsArray = Array.isArray(data);
		return await (checkIfDataIsArray
			? getDeliveryTickets(data, 'PDF')
			: getDeliveryTicket(data.deliveryId, data.deliveryNumber));
	} catch (error) {
		throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, `Error trying to get delivery tickets: ${error}`);
	}
};

export const createOrder = async (orderId: string, user: IUserDocument): Promise<IOrderCreationResponse> => {
	try {
		// Find order
		const order = await dbService.findOrder(orderId);
		if (!order) {
			Logger.error(`===> Order: ${orderId}, ERROR: order not found.`);
			throw new Error('ORDER-NOT-FOUND');
		}

		// Find docks and check if are available
		const { deliveryIds } = order.orderData.shippingData.logisticsInfo[0]!;
		const { dockId } = deliveryIds[0]!;
		let vtexDockData;
		try {
			vtexDockData = await vtexService.getDockById(user.vtexAuth, dockId);
		} catch (error) {
			Logger.error(`===> Order: ${orderId}, ERROR: Dock whith id: ${dockId} could not be found in VTEX.`);
			throw new Error('DOCK-NOT-FOUND');
		}

		const dockData = await dbService.getDockById(dockId, user._id);
		if (!vtexDockData.isActive || !dockData || !dockData.isActive) {
			Logger.error(
				`===> Order: ${orderId}, ERROR: Dock whith id: ${dockId} disabled. vtexDock=${vtexDockData.isActive} dbDock=${dockData?.isActive}`
			);
			throw new Error('DOCK-DISABLED');
		}

		// Shipment creation
		const shipmentData = await formatShipmentInformation(order, vtexDockData, user);
		const { shipment, error: shipmentError } = await ocaControllers.deliveryController.newCreateShipment(
			user.email,
			user.password,
			shipmentData
		);

		if (shipmentError && !shipment) {
			Logger.error(`===> Order: ${orderId}, ERROR: ${shipmentError.message}.`);
			return {
				success: false,
				error: shipmentError.codeMessage,
				orderNumber: orderId
			};
		}

		const createAtOcaOrder = new Date();
		Logger.debug({
			orderId,
			nroremito: shipmentData.destination.nroremito,
			shipmentNumber: shipment?.shipmentNumber,
			orderWithdrawal: shipment?.orderWithdrawal,
			date: createAtOcaOrder
		});

		// Receipt creation
		const isReceiptActive = order.receiptSettings?.isReceiptActive || false;

		// Verify the dispatch settings
		const dispatch = await dbService.getDispatchByDockId(dockId, user._id);
		if (!dispatch) {
			Logger.error(`===> Order: ${orderId}, ERROR: user has no dispatch configured.`);
			throw new Error('DISPATCH-NOT-FOUND');
		}

		// Update order data
		try {
			const receiptSettings: IOrderDocument['receiptSettings'] = {
				...order.receiptSettings!,
				receiptConfig: user.receiptSettings.receiptConfig
			};
			const { id, code, description } = getCreatedInfo();

			const orderUpdate: Partial<IOrderDocument> = {
				orderWithdrawal: String(shipment?.orderWithdrawal),
				trackingStatus: id,
				descriptionStatus: description,
				trackingUrl: `https://www.oca.com.ar/Seguimiento/Paquetes/${String(shipment?.shipmentNumber)}`,
				orderIdOca: String(shipment?.shipmentNumber),
				status: code,
				createAtOcaOrder,
				...(isReceiptActive && { receiptSettings })
			};

			const updatedOrder = await dbService.updateOrderByIdOrError(order._id, orderUpdate);

			// If order has a invoice number, we try to update the tracking url
			if (order.invoiceNumber) await vtexService.tryToAddTrackingInfo(user.vtexAuth, updatedOrder);
		} catch (error) {
			Logger.error(`===> Order: ${orderId}, ERROR: the order could not be updated.`);
			Logger.error(error);
			throw new Error(PanelErrorCodes.UNKNOWN_ERROR);
		}

		Logger.debug(`===> Order: ${orderId}, MESSAGE: order created successfully.`);
		return {
			success: true,
			orderNumber: orderId
		};
	} catch (error: any) {
		if (error.message in PanelErrorCodes) {
			return {
				success: false,
				error: PanelErrorCodes[error.message as keyof typeof PanelErrorCodes],
				orderNumber: orderId
			};
		}

		Logger.error(`===> Order: ${orderId}, ERROR: unknown error.`);
		Logger.error(error);
		return {
			success: false,
			error: PanelErrorCodes.UNKNOWN_ERROR,
			orderNumber: orderId
		};
	}
};

export const createOrders = async (
	orderIds: string[],
	user: IUserDocument
): Promise<IOrderCreationResponse[]> => {
	// eslint-disable-next-line no-restricted-syntax
	for await (const orderId of orderIds) {
		const result = await createOrder(orderId, user);
		if (!result.success && result.error) return [result];
	}
	return [];
};

export const cancelShipment = async (user: IUserDocument, order: IOrderDocument) => {
	try {
		const { email, password } = user;
		const { orderWithdrawal, orderId } = order;
		const { cancelShipment: cancelShipmentOCA } = ocaControllers.deliveryController;

		await cancelShipmentOCA(email, password, orderWithdrawal);

		const { code, description, id } = getCanceledInfo();

		/**
		 * @note This is a temporal fix
		 * Here we send ERROR code and description because the front
		 * is waiting this specific message.
		 * We will be modify this in all projects
		 */
		const update: Partial<IOrderDocument> = {
			descriptionStatus: description,
			trackingStatus: id,
			status: code
		};

		const updateOrder = await updateOrderByParamsOrError({ orderId }, update);

		Logger.info('@@@@ Shipment canceled successfully @@@@');

		return updateOrder;
	} catch (error) {
		if (error instanceof ApiError) throw error;

		throw new ApiError(
			httpStatus.INTERNAL_SERVER_ERROR,
			`Error cancelling order (${order.orderId})`,
			'panel.order-not-canceled'
		);
	}
};

const mixDocksIds = (op: OperativaInterface, dockId: string, isFilter: boolean) => {
	let mix: string[] = [];
	if (op.dockIds?.length) {
		mix = mix.concat(op.dockIds);
	}
	if (!isFilter) {
		mix.push(dockId);
	} else {
		mix = mix.filter((m) => m !== dockId);
	}
	const result = mix.reduce((unique, item) => {
		if (!unique.includes(item)) unique.push(item);
		return unique;
	}, [] as string[]);
	Logger.debug({ NEW_DOCKSIDS: result });
	return result;
};

export const saveOperationals = async (
	userRef: IUserDocument,
	newOperationals: OperativaInterface[],
	dockId: string
): Promise<OperativaInterface[]> => {
	try {
		const userOca = userRef;
		const { operational: operationalsDB } = userOca;

		const notSavedOp = newOperationals.reduce((acc, op) => {
			const existOP = operationalsDB?.find(({ accountNumber }) => accountNumber === op.accountNumber);
			if (!existOP) {
				acc.push({ ...op, dockIds: [dockId] });
			}
			return acc;
		}, [] as OperativaInterface[]);

		const updatedOperationals = operationalsDB.reduce((operationals, op) => {
			const existDocksIds = newOperationals?.find(({ accountNumber }) => accountNumber === op.accountNumber);

			const dockIds = mixDocksIds(op, dockId, !existDocksIds);
			operationals.push({ ...op, dockIds, selected: !!dockIds.length });

			return operationals;
		}, [] as OperativaInterface[]);

		return updatedOperationals.concat(notSavedOp);
	} catch (error: any) {
		throw new ApiError(
			httpStatus.INTERNAL_SERVER_ERROR,
			`Error trying to save operationals: ${error.message || error}`,
			'panel.error-saving-operationals'
		);
	}
};

export const getNearbyStoresByPostalCode = async (postalCode: number, service: ServicesAvailable) => {
	try {
		const { getBranchOffices } = ocaControllers.deliveryController;
		const postalCodes: Array<Promise<BranchOCA[]>> = [];

		for (let index = postalCode - 5; index < postalCode + 5; index += 1)
			postalCodes.push(getBranchOffices(index));

		let offices: BranchOCA[] = [];
		const result = await Promise.allSettled(postalCodes);

		result.forEach((r) => {
			if (r.status === 'fulfilled' && r.value.length > 0) offices = offices.concat(r.value);
		});

		return filterBranchsFromOCA(offices, service);
	} catch (error) {
		throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, `Error in get nearby Stores: ${error}`);
	}
};

export const getAllDeliveryStores = async () => {
	try {
		const { getAllBranchOffices } = ocaControllers.deliveryController;
		const branchs = await getAllBranchOffices(true, config.api.oca.forceProd);
		return filterBranchsFromOCA(branchs, 'delivery') as DeliveryPackageBranch[];
	} catch (error) {
		throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, `Error in get all delivery stores: ${error}`);
	}
};

export const handleDispatchInfo = async (dispatchData: IDispatch) => {
	let { defaultStoreId } = dispatchData;
	const dispatchIsHome = dispatchData.defaultDispatchType === DefaultDispatchType.HOME;
	const merchantHomeId = '0';

	defaultStoreId = dispatchIsHome ? merchantHomeId : defaultStoreId;

	try {
		await dbService.createOrUpdateDispatch({ ...dispatchData, defaultStoreId });
	} catch (error) {
		throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, `Error trying to save dispatch info: ${error}`);
	}
};

export const getAndSendReports = async (
	columnsConfig: IColumnsConfig[],
	mainModel: any,
	othersModels?: IOthersModels[],
	emailOptions?: IMailOptionsNodemailer
): Promise<any> => {
	try {
		const { generateReport } = ocaControllers.reportsController;
		return await generateReport(columnsConfig, mainModel, othersModels, emailOptions);
	} catch (error) {
		Logger.error(JSON.stringify(error));
		throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, `Error trying to get reports: ${error}`);
	}
};

export const setNewShippingAddress = async (orderId: string, newShippingAddress: ShippingAddress) => {
	const { postalCode, number } = newShippingAddress;

	try {
		const { getBranchOffices } = ocaControllers.deliveryController;
		const branchs = await getBranchOffices(Number(postalCode));
		const findOCABranch = branchs.find((branch) => Number(branch.address.number) === Number(number));

		if (!findOCABranch)
			throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Could not get all OCA store data');

		const order = await getOrderById(orderId);

		if (!order)
			throw new ApiError(httpStatus.NOT_FOUND, `Order (${orderId}) not found`, 'panel.order-not-found');

		// TODO: ONLY OCA ??
		const newPup = `${PrefixTag.OCA}-${findOCABranch.impositionCenterId}`;
		const update = handleAddressForDeepUpdate(order, newShippingAddress, newPup);
		const result = await updateOrderByIdOrError(order._id, update);

		return result;
	} catch (error) {
		if (error instanceof ApiError) throw error;

		throw new ApiError(
			httpStatus.INTERNAL_SERVER_ERROR,
			`Could not update delivery store from order with id: ${orderId}`
		);
	}
};

export const getLabels = async (orderIds: string[], dock: IDock) => {
	const data: Buffer[] = [];

	try {
		const orders = await Promise.all(orderIds.map((id) => dbService.findOrder(id)));
		const ordersCreated = orders.filter(typeGuards.isNotNull).filter((o) => {
			const isCreated = 'CREATED';
			return o.status === isCreated;
		});

		if (ordersCreated.length === 0)
			throw new ApiError(httpStatus.NOT_FOUND, 'Not orders found', 'panel.orders-not-found');

		const handleOrders = ordersCreated.map(async (order) => {
			const { orderWithdrawal: deliveryId, orderIdOca: deliveryNumber } = order;

			if (order.receiptSettings?.isReceiptActive) {
				Logger.info('@@@@ Getting data receipt @@@@');

				const dataReceipt = formatOrderDataReceipt(order, dock);
				const receipt = await pdf.generateReceipt(dataReceipt);

				data.push(Buffer.from(receipt, 'base64'));
			}

			return { deliveryId, deliveryNumber };
		});

		const dataToGenerateTicket = await Promise.all(handleOrders);
		const tickets = await getOCADeliveryTickets(dataToGenerateTicket);

		return await pdf.mergeReceiptAndTicketData(tickets, data);
	} catch (error) {
		if (error instanceof ApiError) throw error;

		throw new ApiError(httpStatus.NOT_FOUND, `Error trying to print labels: ${error}`);
	}
};

// Shipping Rates
export const getOcaShippingRates = async (postalCode: number, operativeId: number): Promise<IRate[]> => {
	try {
		const { getDeliveryRates } = ocaControllers.ratesController;

		return await getDeliveryRates(postalCode, operativeId);
	} catch (error) {
		if (error instanceof ApiError) throw error;
		throw new ApiError(httpStatus.NOT_FOUND, `Error trying get shipping rates: ${error}`);
	}
};

export const suscribeOperativesNotification = async (
	accountNumber: string,
	operatives: IOperativeDetail[]
): Promise<void> => {
	try {
		const { suscribeOperatives } = ocaControllers.ratesController;
		await suscribeOperatives(accountNumber, operatives);
	} catch (error) {
		if (error instanceof ApiError) throw error;
		throw new ApiError(httpStatus.NOT_FOUND, `Error trying to suscribe to rates notifications: ${error}`);
	}
};

// Imposition centers
export const getPointData = async (id: number): Promise<AdmissionPackageBranch> => {
	try {
		const { getBranchOfficeById } = ocaControllers.deliveryController;
		const pointData = await getBranchOfficeById(id);

		const officeHours = filterHours(pointData.officeHours);

		return {
			name: pointData.branchOffice,
			impositionCenterId: pointData.impositionCenterId,
			phone: pointData.phone || '',
			officeHours,
			address: {
				province: pointData.address.province,
				locality: pointData.address.locality,
				city: pointData.address.locality,
				number: pointData.address.number,
				street: pointData.address.street,
				postalCode: pointData.address.postalCode,
				latitude: pointData.lat || '',
				longitude: pointData.long || ''
			}
		} as AdmissionPackageBranch;
	} catch (error) {
		if (error instanceof ApiError) throw error;
		throw new ApiError(httpStatus.NOT_FOUND, `Error trying to get the imposition center data: ${error}`);
	}
};

export const getOperationalByUser = async (email: string, password: string) => {
	const { env, api } = config;
	const { getOperationalsByUserTN } = ocaControllers.userController;

	try {
		const forceProd = env === Environments.PRODUCTION ? true : api.oca.forceProd;
		return await getOperationalsByUserTN(email, password, forceProd);
	} catch (error) {
		throw Error('Error in get operational by user.');
	}
};

export const getAccountNumberOca = async (username: string, password: string) => {
	try {
		const dataAccount = await ocaControllers.authController.getAccountData(username, password);
		return dataAccount.nrocuenta;
	} catch (error) {
		Logger.error(JSON.stringify(error));
		throw new Error('Invalid credentials');
	}
};
