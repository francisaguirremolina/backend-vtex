import { IDock, IShippingPolicy, IOrder as IVtexOrder } from 'vtex-package-ts/dist/interfaces';
import { BranchOCA } from 'oca-package/dist/interface/oca.interface';
import { getBusinessHours } from '../../config/vtexCarriers';
import {
	AdmissionPackageBranch,
	DeliveryPackageBranch,
	OperativaInterface,
	ServicesAvailable,
	IOrderDocument,
	ReceiptSettings,
	OcaDays,
	PrefixTag
} from '../../interfaces';
import { deleteRepeatedObjectsFromArrays } from '../../utils/misc';
import { IDispatchDocument } from '../../interfaces/dispatch.interfaces';
import { centsToMoneyUnit } from '../../utils/currencyUnits.utils';
import { getOrderAmounts } from '../../utils/oca.utils';

export function formatVtexShippingPolicy(
	operational: OperativaInterface,
	postalCode: string,
	toStoreOperative: string | null,
	toLockerOperative: string | null
): IShippingPolicy {
	const { accountNumber, accountType, selected: isActive } = operational;

	const isToStore = toStoreOperative?.includes(operational.accountNumber);
	const isToLocker = toLockerOperative?.includes(operational.accountNumber);

	const pickupPointTags = [];
	if (isToStore) pickupPointTags.push(PrefixTag.OCA);
	if (isToLocker) pickupPointTags.push(PrefixTag.LOCKER);

	const deliveryChannel = isToStore || isToLocker ? 'pickup-in-point' : 'delivery';

	const accountName = 'conexapartnermx';

	const id = `${accountNumber.trim()}-${postalCode}`;

	// TODO: ONLY OCA ??
	const shippingMethod = `${PrefixTag.OCA} - ${accountType}`;
	const name = `${shippingMethod} - CP:${postalCode}`;
	const weekendAndHolidays = { saturday: true, sunday: true, holiday: true };
	const carrierBusinessHours = getBusinessHours();

	return {
		id,
		name,
		shippingMethod,
		weekendAndHolidays,
		maxDimension: {
			largestMeasure: 1000000,
			maxMeasureSum: 3000
		},
		numberOfItemsPerShipment: 1,
		minimumValueAceptable: 0.0,
		maximumValueAceptable: 0.0,
		additionalTime: '00:00:00',
		additionalPrice: {
			method: 0,
			value: 0.0
		},
		deliveryScheduleSettings: {
			useDeliverySchedule: false,
			dayOfWeekForDelivery: [],
			maxRangeDelivery: 0,
			dayOfWeekBlockeds: []
		},
		carrierSchedule: [],
		cubicWeightSettings: {
			volumetricFactor: 0.25,
			minimunAcceptableVolumetricWeight: 0.0
		},
		modalSettings: {
			modals: [],
			useOnlyItemsWithDefinedModal: false
		},
		businessHourSettings: {
			carrierBusinessHours,
			isOpenOutsideBusinessHours: true
		},
		pickupPointsSettings: {
			pickupPointIds: [],
			pickupPointTags,
			sellers: []
		},
		deliveryChannel,
		calculationType: 0,
		isActive,
		lastIndexedAt: null,
		shippingHoursSettings: {
			shippingHours: carrierBusinessHours,
			acceptOrdersOutsideShippingHours: true
		},
		carrierInfo: {
			carrierAccountName: accountName,
			deliveryAgreementId: null,
			linkedDocks: [],
			readyToUse: true
		}
	};
}

/**
 * This function is to filter office hours from OCA
 * @param {string} officeHours - For example: 'LUN A VIE 9 A 17 HS.'
 * @returns Array<{ day: number; start: string; end: string }>
 */
export function filterHours(officeHours: string): Array<{ day: number; start: string; end: string }> {
	const needConfirmation = 'A Confirmar';
	const defaultResult = [
		{ day: 1, start: '8:30', end: '17' },
		{ day: 2, start: '8:30', end: '17' },
		{ day: 3, start: '8:30', end: '17' },
		{ day: 4, start: '8:30', end: '17' },
		{ day: 5, start: '8:30', end: '17' }
	];
	const weeklyHours = defaultResult; // []

	try {
		if (!officeHours || officeHours === needConfirmation) return defaultResult;

		const weekly = { LUN: 1, MAR: 2, MIE: 3, JUE: 4, VIE: 5, VIER: 5, SAB: 6 } as const;
		const result = officeHours.split(' ') as [OcaDays, string, OcaDays, string, string, string];

		const indexTo = result.includes('SAB') ? weekly.SAB : weekly[result[2]];
		for (let index = weekly[result[0]]; index <= indexTo; index++) {
			weeklyHours.push({
				day: index,
				start: result[3].replaceAll('.', ':'),
				end: result[5].replaceAll('.', ':')
			});
		}
	} catch (error) {
		return defaultResult;
	}
	return weeklyHours;
}

export function filterBranchsFromOCA(
	branches: BranchOCA[],
	service: ServicesAvailable
): AdmissionPackageBranch[] | DeliveryPackageBranch[] {
	const services = { delivery: 'Entrega de paquetes', admission: 'Admisión de paquetes' } as const;

	const deliveryBranchs: DeliveryPackageBranch[] = [];
	const admissionBranchs: AdmissionPackageBranch[] = [];

	// eslint-disable-next-line no-restricted-syntax
	for (const branch of branches) {
		const branchIsAdmission = branch.services.includes(services.admission);
		const branchIsDelivery = branch.services.includes(services.delivery);
		const branchIsBoth = branchIsAdmission && branchIsDelivery;

		const auxBranch = {
			name: branch.branchOffice,
			type: branch.agencyType,
			impositionCenterId: branch.impositionCenterId,
			phone: branch.phone,
			address: {
				address: branch.address.street,
				province: branch.address.province,
				locality: branch.address.locality,
				city: branch.address.locality,
				number: branch.address.number || 0,
				street: branch.address.street || '',
				postalCode: branch.address.postalCode || 0,
				latitude: branch.lat,
				longitude: branch.long
			}
		};

		if (service === 'admission' && branchIsAdmission) admissionBranchs.push(auxBranch);

		if (service === 'delivery' && (branchIsDelivery || branchIsBoth)) {
			const formattedAddress = `Province: ${branch.address.province} - Postal code: ${branch.address.postalCode} - Number: ${branch.address.number}`;

			const data = {
				...auxBranch,
				phone: branch.phone,
				officeHours: filterHours(branch.officeHours),
				address: {
					...auxBranch.address,
					latitude: branch.lat,
					longitude: branch.long,
					city: branch.address.locality,
					address: formattedAddress
				}
			};

			deliveryBranchs.push(data);
		}
	}

	if (service === 'delivery') return deleteRepeatedObjectsFromArrays(deliveryBranchs, 'impositionCenterId');

	const result = deleteRepeatedObjectsFromArrays(
		[...admissionBranchs, ...deliveryBranchs],
		'impositionCenterId'
	);

	return result.length > 10 ? result.slice(0, 10) : result;
}

/**
 * This function is to return center imposition ids to create an order at OCA
 * @description Center imposition Origin (ciOrigin): where the order is pickup by merchant
 * @description Center Imposition Destination (ciDestionation): where the order is pickup by buyer
 * @param merchantDispatch - Data configured by Merchant
 * @param orderVtex - Vtex Order
 * @returns Returns two ids (ciOrigin and ciDestination) to create an order
 */
export function handleOCACenterImpIds(merchantDispatch: IDispatchDocument | null, orderVtex: IVtexOrder) {
	const home = '0';
	const ciOrigin = merchantDispatch?.defaultStoreId || home;

	// NOTE: This type is wrong in package -> possibly null
	const { pickupPointId }: { pickupPointId: string | null } = orderVtex.shippingData.logisticsInfo[0]!;

	const pupId = pickupPointId ? pickupPointId.split('-').at(-1) : null;

	const ciDestination = pupId || home;

	return { ciOrigin, ciDestination };
}

export function formatOrderDataReceipt(
	order: IOrderDocument,
	dock: IDock,
	userReceiptConfig?: ReceiptSettings['receiptConfig']
) {
	const { orderData: vtexOrder, receiptSettings: orderReceiptSettings } = order;
	const {
		hostname: storeName,
		orderId: orderNumber,
		creationDate,
		shippingData,
		clientProfileData,
		items: orderItems,
		totals,
		paymentData
	} = vtexOrder;
	const { logisticsInfo, address } = shippingData;
	const { deliveryCompany: shippingName } = logisticsInfo[0]!;

	const purchaseDate = creationDate.split('T')[0] as string; // @note: format date is this: 'YYYY-MM-DDT00:00:00.0000000+00:00'
	const notes = address.reference || 'Sin información';

	const receiptSettings: ReceiptSettings = {
		...orderReceiptSettings!,
		receiptConfig: userReceiptConfig || orderReceiptSettings!.receiptConfig
	};

	const generalData = {
		storeName,
		orderNumber,
		purchaseDate,
		shippingName,
		notes,
		receiptSettings
	};

	const firstName = order.recipient?.firstName || clientProfileData.firstName;
	const lastName = order.recipient?.lastName || clientProfileData.lastName;
	const dni = order.recipient?.cuil || clientProfileData.document;
	const nameSurname = `${firstName} ${lastName}`;
	const { street, postalCode, city, state: province } = address;

	const recipient = {
		nameSurname,
		dni,
		postalCode,
		street,
		city,
		province
	};

	const products = orderItems.map(({ name, price }) => ({ name, price: centsToMoneyUnit(price) }));
	const amounts = getOrderAmounts(totals);
	const { paymentSystemName: paymentMethod }: { paymentSystemName: string } =
		paymentData.transactions[0].payments[0];

	const items = {
		products,
		amounts,
		total: centsToMoneyUnit(vtexOrder.value),
		paymentMethod
	};

	const remitter = {
		nameSurname: vtexOrder.paymentData.transactions[0].merchantName,
		postalCode: dock.address?.postalCode,
		province: dock.address?.state,
		country: 'Argentina'
	};

	return {
		...generalData,
		recipient,
		items,
		remitter
	};
}
