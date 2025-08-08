/* eslint-disable import/no-cycle */
import { DefaultDispatchType } from '../../interfaces/dispatch.interfaces';
import { IFrontendOrder, IOrderDocument, IUserDocument, ShippingAddress } from '../../interfaces';
import { PanelErrorCodes, ResponseOrder } from '../../interfaces/panel.interfaces';
import * as carrierService from '../carrier.service';
import * as vtexService from '../vtex.service';
import * as dbService from '../db.service';

export const dbOrdersToFront = async (orders: IOrderDocument[]): Promise<IFrontendOrder[]> => {
	// eslint-disable-next-line prefer-const
	let ordersData: IFrontendOrder[] = [];

	// eslint-disable-next-line no-restricted-syntax
	for (const order of orders) {
		// eslint-disable-next-line no-await-in-loop
		ordersData.push(await dbOrderToFront(order));
	}

	return ordersData;
};

const dbOrderToFront = async (order: IOrderDocument): Promise<IFrontendOrder> => {
	const { pickupPointId } = order;

	let defaultDispatchType: DefaultDispatchType = DefaultDispatchType.HOME;
	if (pickupPointId)
		defaultDispatchType = pickupPointId.toLowerCase().includes(DefaultDispatchType.LOCKER)
			? DefaultDispatchType.LOCKER
			: DefaultDispatchType.STORE;

	return {
		orderId: order._id,
		orderNumber: order.orderId,
		creationDate: order.orderData.creationDate,
		defaultDispatchType,
		origin: {
			apartment: order.orderData.shippingData.address.reference || '',
			province: order.orderData.shippingData.address.state,
			locality: order.orderData.shippingData.address.city,
			number: parseInt(order.orderData.shippingData.address.number, 10),
			street: order.orderData.shippingData.address.street,
			floor: order.orderData.shippingData.address.complement || '',
			postalCode: order.orderData.shippingData.address.postalCode
		},
		recipient: {
			firstName: order.recipient?.firstName || order.orderData.clientProfileData.firstName,
			lastName: order.recipient?.lastName || order.orderData.clientProfileData.lastName,
			cuil: order.recipient?.cuil || order.orderData.clientProfileData.document
		},
		packageSettings: {
			width: order.packageSettings?.width || 0,
			height: order.packageSettings?.height || 0,
			length: order.packageSettings?.length || 0,
			bulks: order.packageSettings?.bulks || 0
		},
		trackingStatus: order.status,
		statusLabel: order.descriptionStatus,
		trackingUrl: String(order?.trackingUrl),
		error: order.errorMessage || '',
		shippingAddress: {
			apartment: order.orderData.shippingData.address.reference || '',
			province: order.orderData.shippingData.address.state,
			locality: order.orderData.shippingData.address.city,
			number: order.orderData.shippingData.address.number,
			street: order.orderData.shippingData.address.street,
			floor: order.orderData.shippingData.address.complement || '',
			postalCode: order.orderData.shippingData.address.postalCode
		}
	};
};

export const getOrderFormatted = async (
	user: IUserDocument,
	order: IOrderDocument
): Promise<ResponseOrder> => {
	const auxItems = order.orderData.items.map((r) => {
		return { name: r.name, price: (r.price / 100).toString(), quantity: r.quantity };
	});

	const { deliveryIds } = order.orderData.shippingData.logisticsInfo[0]!;
	const { dockId } = deliveryIds[0]!;

	const { address } = await vtexService.getDockById(user.vtexAuth, dockId);

	// If is a store dispatch we use the selected imposition center address to shipping origin
	const dispatch = await dbService.getDispatchByDockAndUserIds(user._id, dockId);
	if (!dispatch) {
		throw new Error(PanelErrorCodes['DISPATCH-NOT-FOUND']);
	}
	const { defaultStoreId: impositionCenterId } = dispatch;

	const isFromHome = dispatch?.defaultDispatchType === DefaultDispatchType.HOME;

	let selectedCenter;
	if (!isFromHome) {
		const impositionCenters = await carrierService.getNearbyStoresByPostalCode(
			Number(address?.postalCode),
			'admission'
		);
		selectedCenter = impositionCenters.find((center) => center.impositionCenterId === impositionCenterId);
	}

	return {
		orderId: order.orderId,
		orderNumber: 1,
		items: auxItems,
		totalSpent: (order.orderData.value / 100).toString() || '',
		subTotal: ((order.orderData.totals[0]?.value || 0) / 100).toString() || '',
		shippingCost: ((order.orderData.totals[2]?.value || 0) / 100).toString() || '',
		taxCost: ((order.orderData.totals[3]?.value || 0) / 100).toString() || '',
		discount: ((order.orderData.totals[1]?.value || 0) / 100).toString() || '',
		origin: {
			apartment: isFromHome ? address?.complement! : '',
			floor: isFromHome ? address?.complement! : '',
			locality: isFromHome ? address?.city! : selectedCenter?.address.locality!,
			// eslint-disable-next-line radix
			number: isFromHome ? parseInt(address?.number!) : selectedCenter?.address.number!,
			postalCode: isFromHome ? address?.postalCode! : String(selectedCenter?.address.postalCode!),
			province: isFromHome ? address?.state! : selectedCenter?.address.province!,
			street: isFromHome ? address?.street! : selectedCenter?.address.street!
		},
		recipient: {
			firstName: order.recipient?.firstName || '',
			lastName: order.recipient?.lastName || '',
			cuil: order.recipient?.cuil || ''
		},
		shippingAddress: {
			apartment: order.orderData.shippingData.selectedAddresses[0]?.complement!,
			floor: order.orderData.shippingData.selectedAddresses[0]?.complement!,
			locality: order.orderData.shippingData.selectedAddresses[0]?.city!,
			// eslint-disable-next-line radix
			number: order.orderData.shippingData.selectedAddresses[0]?.number!,
			postalCode: order.orderData.shippingData.selectedAddresses[0]?.postalCode!,
			province: order.orderData.shippingData.selectedAddresses[0]?.state!,
			street: order.orderData.shippingData.selectedAddresses[0]?.street!
		},
		packageSettings: order.packageSettings!,
		receiptSettings: order.receiptSettings!
	};
};

export const handleAddressForDeepUpdate = (
	order: IOrderDocument,
	newShippingAddress: ShippingAddress,
	newPup: string
) => {
	const { postalCode, number, locality, province, street } = newShippingAddress;

	const logisticInfo = order.orderData.shippingData.logisticsInfo[0]!;

	const updateShippingDataVtex = {
		addressId: newPup,
		postalCode,
		city: locality,
		state: province,
		street,
		number,
		neighborhood: ''
	};

	const newLogisticInfo = [{ ...logisticInfo, addressId: newPup, pickupPointId: newPup }];
	const newAddress = { ...order.orderData.shippingData.address, ...updateShippingDataVtex };
	const newSelectedAddress = [
		{
			...order.orderData.shippingData.selectedAddresses[0]!,
			...updateShippingDataVtex
		}
	];

	return {
		orderData: {
			...order.orderData,
			shippingData: {
				...order.orderData.shippingData,
				address: newAddress,
				logisticsInfo: newLogisticInfo,
				selectedAddresses: newSelectedAddress
			}
		},
		shippingAddress: newShippingAddress
	};
};
