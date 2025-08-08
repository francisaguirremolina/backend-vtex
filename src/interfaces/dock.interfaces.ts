import { Document, Model } from 'mongoose';

export interface IDock {
	userId: string;
	dockId: string;
	isActive: boolean;
	name: string;
	postalCode: string;
	ratesLoadedOperativeIds?: string[];
}

export interface IAssociateDockRequest {
	locationId: string;
	availableForDelivery: boolean;
	postalCode: string;
	name: string;
}

export interface IDockDocument extends IDock, Document {}

export interface IDockModel extends Model<IDockDocument> {
	Dock(arg0: { dockId: string }): IDock | PromiseLike<IDock | null> | null;
}
