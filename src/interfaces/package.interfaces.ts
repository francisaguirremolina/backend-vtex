import { Document, Model } from 'mongoose';

export interface IPackage {
	userId: string;
	dimensions: Array<number>;
}

export interface IPackageDocument extends IPackage, Document {}

export interface IPackageModel extends Model<IPackageDocument> {}
