// eslint-disable-next-line import/extensions
import { Origin } from '@/interfaces';
import { Recipient, ShippingAddress, PackageSettings } from './panel.interfaces';
import { DefaultDispatchType } from './dispatch.interfaces';

export interface IFrontendLocation {
	name: string;
	country: string;
	countryCode: string;
	province: string;
	city: string;
	street: string;
	number: string;
	postalCode: string;
	inCoverage?: boolean;
	vtexLocationId?: string;
	locationId: string;
	availableForDelivery: boolean;
}

export interface IFrontendOrder {
	orderId: string;
	orderNumber: string;
	creationDate: string;
	defaultDispatchType: DefaultDispatchType;
	origin?: Origin;
	recipient: Recipient;
	shippingAddress: ShippingAddress;
	packageSettings?: PackageSettings;
	trackingStatus?: string;
	statusLabel?: string;
	trackingUrl: string;
	error?: string;
}

export interface IFrontendOrderDetail {
	email: string;
	firstName: string;
	lastName: string;
	phoneNumber: string;
	address: string;
	postalCode: string;
	country: string;
	province: string;
	city: string;
	notes?: string;
}
