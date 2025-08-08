import { Document, Model } from 'mongoose';
import { IVtexAuth } from 'vtex-package-ts/dist/interfaces';

export type PickupPointsLoadStatus = 'LOADED' | 'ERROR' | 'LOADING';

export interface IUser {
	vtexUrl: string;

	vtexAuth: IVtexAuth;
	vtexWebhook: String;
	// OCA
	email: string;
	password: string;
	accountNumber: string;

	operational: OperativaInterface[];
	finishedFlow: boolean;
	printReceipt: boolean;
	receiptSettings: ReceiptSettings;
	pickupPointsLoaded: PickupPointsLoadStatus;
}

export interface OperativaInterface {
	selected: boolean;
	accountNumber: string;
	accountType: string; // "doorToStore" "StoreToDoor" "StoreToStore",
	dockIds?: string[];
}

export interface ReceiptSettings {
	isReceiptActive: boolean;
	receiptConfig: ReceiptConfig;
}

export interface ReceiptConfig {
	isOrderInfoIncluded: boolean;
	isRemitterIncluded: boolean;
	isNotesIncluded: boolean;
	isClientIdIncluded: boolean;
}
export interface IUserDocument extends IUser, Document {}

export interface IUserModel extends Model<IUserDocument> {}
