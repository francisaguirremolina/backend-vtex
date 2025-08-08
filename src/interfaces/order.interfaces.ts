/* eslint-disable @typescript-eslint/naming-convention */
import { IOrder as IVtexOrder } from 'vtex-package-ts/dist/interfaces';

import { Document } from 'mongoose';
import { PackageSettings, ReceiptSettings } from './panel.interfaces';
import { DefaultDispatchType } from './dispatch.interfaces';

export interface IShipment {
	errorMessage?: string;
	trackingId?: string;
	trackingUrl?: string;
	trackingStatus?: string;
}

export interface IOrder extends IShipment {
	orderId: string;
	userId: string;
	vtexUrl: string;
	status: string;
	// OCA
	orderWithdrawal: string;
	trackingStatus: string;
	descriptionStatus: string;
	orderIdOca: string;
	invoiceNumber?: string;
	pickupPointId?: string;
	orderData: IVtexOrder;
	origin?: Origin;
	recipient?: Recipient;
	packageSettings?: PackageSettings;
	receiptSettings?: ReceiptSettings;
	shippingAddress?: ShippingAddress;
	shipmentNumber: string;
	createAtOcaOrder?: Date;
}

export interface IOrderDocument extends IOrder, Document {
	createdAt: string;
	updatedAt: string;
}

export interface IResponseOrder {
	orderId?: string;
	orderNumber?: number;
	shippingAddress?: ShippingAddress;
	packageSettings?: PackageSettings;
	trackingStatus?: string;
	dispatchType?: string;
}

export interface ShippingAddress {
	province: string;
	locality: string;
	number: string;
	street: string;
	floor: string;
	apartment: string;
	postalCode: string;
}

export interface ResponseDock {
	availableForDelivery: boolean;
	locationId: string;
	name: string;
	countryCode: string;
	country: string;
	province: string;
	city: string;
	address: string;
	phoneNumber?: string;
	zip?: string;
	postalCode: string;
	firstName?: string;
	lastName?: string;
	companyName?: string;
	cuit?: string;
	inCoverage: boolean;
	configured?: boolean;
}
export interface Origin {
	province: string;
	locality: string;
	number: number;
	street: string;
	floor: string;
	apartment: string;
	postalCode: string;
}

export interface Recipient {
	firstName: string;
	lastName: string;
	cuil: string;
}

export interface CreatedAtFilter {
	$gte?: Date;
	$lt?: Date;
}

export interface IGetOrders {
	vtexUrl: string;
	limit?: string;
	offset?: string;
	trackingStatus?: string;
	sort?: string;
	dateFrom?: string;
	dateTo?: string;
	tag?: string;
	createdAt?: CreatedAtFilter;
	status?: string;
	from?: string;
	delivery?: 'all' | DefaultDispatchType;
}

export interface IMongooseRegex {
	$regex: string;
	$options?: string;
}

export interface IQueryOrders {
	vtexUrl: string;
	trackingStatus?: string;
	orderId?: IMongooseRegex;
	createdAt?: CreatedAtFilter;
}
