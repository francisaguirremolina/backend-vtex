import { IDock, IOrderItem } from 'vtex-package-ts/dist/interfaces';
import { getDispatchByDockId } from '../db.service/dispatch.db.service';
import { handleOCACenterImpIds } from './carrier.formatting';
import {
	Ecommerce,
	ICreateShipmentXML,
	IDestinationToXML,
	IOrder,
	IOriginToXML,
	IUserDocument
} from '../../interfaces';

// eslint-disable-next-line import/no-cycle
import { getValidEmail } from '../vtex.service';
import { getNearbyStoresByPostalCode } from '../carrier.service';
import { normalizeString } from '../../utils/string.normalize';

export const getTotalDimensions = (items: IOrderItem[]) => {
	let weight = 0;
	let height = 0;
	let width = 0;
	let length = 0;

	items.forEach((item) => {
		const { quantity } = item;

		const {
			width: itemWidth = 0,
			length: itemLength = 0,
			weight: itemWeight = 0,
			height: itemHeight = 0
		} = item.additionalInfo.dimension;

		weight += itemWeight * quantity;
		height += itemHeight * quantity;
		width = Math.max(itemWidth, width);
		length = Math.max(itemLength, length);
	});

	return { weight, height, width, length };
};

export const formatShipmentInformation = async (
	order: IOrder,
	dock: IDock,
	user: IUserDocument
): Promise<ICreateShipmentXML> => {
	const { orderData } = order;

	const date = new Date();
	const orderDate = date.toLocaleDateString('en-GB').split('/').reverse().join('');
	let packages: string = '';
	const dispatch = await getDispatchByDockId(dock.id!, user._id);
	const subTotalInCents = orderData.totals.find((amount) => amount.id === 'Items')?.value || 0;
	const subTotal = (subTotalInCents / 100).toFixed(2);

	const { courierId } = orderData.shippingData.logisticsInfo[0]!.deliveryIds[0]!;
	const destinationData = orderData.shippingData.address!;
	const operational = user.operational.find((x) => courierId.includes(x.accountNumber));

	if (!operational) {
		throw new Error(
			`No operational account found for courierId: ${courierId}. Please verify that the account number is correctly registered.`
		);
	}

	const { ciOrigin, ciDestination } = handleOCACenterImpIds(dispatch, orderData);

	// If is a store dispatch we use the selected imposition center address to shipping origin
	let selectedCenter;
	if (ciOrigin !== '0') {
		const impositionCenters = await getNearbyStoresByPostalCode(
			Number(dock.address?.postalCode),
			'admission'
		);
		selectedCenter = impositionCenters.find((center) => center.impositionCenterId === ciOrigin);
		if (!selectedCenter) throw new Error(`ImpositionCenterId Not found ${ciOrigin}`);
	}

	const { packageSettings } = order;
	const { bulks } = packageSettings!;
	const { weight, height, width, length } = getTotalDimensions(orderData.items);
	for (let i = 0; i < (bulks || 1); i++) {
		const kilogramsWeight = (weight / bulks / 1000).toFixed(2);

		packages += `<paquete alto="${(height / bulks).toFixed(2)}" ancho="${(width / bulks).toFixed(
			2
		)}" largo="${(length / bulks).toFixed(2)}" peso="${kilogramsWeight}" valor="${(+subTotal / bulks).toFixed(
			2
		)}" cant="1" /> \n`;
	}

	const dockProvince =
		String(dock.address?.state) === 'Ciudad Autónoma de Buenos Aires'
			? 'Buenos Aires'
			: String(dock.address?.state);

	const nro = ciOrigin === '0' ? Number(dock.address?.number) : selectedCenter?.address.number!;
	const cp = ciOrigin === '0' ? Number(dock.address?.postalCode) : selectedCenter?.address.postalCode!;
	const nroremito = Number(orderData.orderId.replace(/\D/g, ''));

	if ([nro, cp, nroremito].some((e) => Number.isNaN(e)))
		throw new Error(`Some params are invalid: nro=${nro}, cp=${cp}, nroremito=${nroremito}`);

	const origin: IOriginToXML = {
		calle: ciOrigin === '0' ? String(dock.address?.street) : selectedCenter?.address.street!,
		nro,
		piso: '',
		cp,
		localidad: ciOrigin === '0' ? String(dock.address?.city) : selectedCenter?.address.locality!,
		provincia: ciOrigin === '0' ? dockProvince : selectedCenter?.address.province!,
		email: user.email,
		solicitante: orderData.hostname,
		observaciones: `${orderData.clientProfileData.firstName} ${orderData.clientProfileData.lastName}`,
		idFranjaHoraria: '0',
		idCenterImpositionOrigen: ciOrigin,
		fecha: orderDate,
		centrocosto: '2'
	};

	const validEmail = await getValidEmail(user.vtexAuth, orderData.clientProfileData.email);

	const destination: IDestinationToXML = {
		nombre: order.recipient?.firstName || orderData.clientProfileData.firstName,
		apellido: order.recipient?.lastName || orderData.clientProfileData.lastName,
		calle: normalizeString(destinationData.street),
		nro: normalizeString(destinationData.number),
		piso: '',
		localidad: destinationData.city,
		provincia: destinationData.state,
		cp: destinationData.postalCode,
		telefono: orderData.clientProfileData.phone,
		celular: orderData.clientProfileData.phone,
		email: validEmail,
		idci: ciDestination,
		observaciones: destinationData.complement ? normalizeString(destinationData.complement) : 'No especifica',
		idoperativa: String(operational?.accountNumber),
		nroremito
	};

	return {
		accountNumber: user.accountNumber,
		origin,
		destination,
		packages,
		ecommerce: Ecommerce.VTEX
	};
};
