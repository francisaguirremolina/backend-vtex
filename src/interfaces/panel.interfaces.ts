export interface IOrderUpdate {
	recipient?: Recipient;
	shippingAddress?: ShippingAddress;
	packageSettings?: PackageSettings;
	// @note for `tiendanube` front send packageData instead of packageSettings
	packageData?: PackageSettings;
	receiptSettings?: ReceiptSettings;
}

export interface PackageSettings {
	width: number;
	height: number;
	length: number;
	bulks: number;
}

export interface ReceiptConfig {
	isOrderInfoIncluded: boolean;
	isRemitterIncluded: boolean;
	isNotesIncluded: boolean;
	isClientIdIncluded: boolean;
}

export interface ReceiptSettings {
	isReceiptActive: boolean;
	receiptConfig: ReceiptConfig;
}

export interface Recipient {
	firstName: string;
	lastName: string;
	cuil: string;
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

export interface ResponseOrder {
	orderId: string;
	orderNumber: number;
	items: Item[];
	totalSpent: string;
	subTotal: string;
	shippingCost: string;
	taxCost: string;
	discount: string;
	origin: Origin;
	recipient: Recipient;
	shippingAddress: ShippingAddress;
	packageSettings: PackageSettings;
	receiptSettings: ReceiptSettings;
}

export interface Item {
	name: string;
	price: string;
	quantity: number;
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

/* Shipment creation Interfaces */

export interface IOrderCreationResponse {
	success: boolean;
	orderNumber: string;
	error?: string;
}

// Error mapping
export type ErrorCodes =
	| 'ORDER-NOT-FOUND'
	| 'UNKNOWN_ERROR'
	| 'DOCK-DISABLED'
	| 'DOCK-NOT-FOUND'
	| 'LABEL-NOT-FOUND'
	| 'LABEL-CREATION-FAILED'
	| 'DISPATCH-NOT-FOUND';

export enum PanelErrorCodes {
	'ORDER-NOT-FOUND' = 'panel.order-not-found',
	'UNKNOWN_ERROR' = 'panel.create-shipment-uknown-error',
	'DOCK-DISABLED' = 'panel.disabled-dock',
	'DOCK-NOT-FOUND' = 'panel.dock-not-found',
	'LABEL-NOT-FOUND' = 'panel.label-not-found',
	'LABEL-CREATION-FAILED' = 'panel.label-creation-error',
	'DISPATCH-NOT-FOUND' = 'panel.user-dispatch-not-found'
}

// Operational
export interface SetOperational {
	doorToDoor: string;
	doorToStore: string;
	storeToDoor: string;
	storeToStore: string;
	doorToLocker: string;
	storeToLocker: string;
}
