import { Document, Model } from 'mongoose';

export enum DefaultDispatchType {
	HOME = 'home',
	STORE = 'store',
	LOCKER = 'locker'
}

export interface IActiveDay {
	day: number;
	active: boolean;
}

export interface IDispatchSettings {
	defaultStoreId: string;
	defaultDispatchType: DefaultDispatchType;
	activeDays: IActiveDay[];
	defaultTimeRange: string;
	dockIds?: string[];
}

export interface IDispatch extends IDispatchSettings {
	userId: string;
}

export interface IDispatchDocument extends IDispatch, Document {}

export interface IDispatchModel extends Model<IDispatchDocument> {}
