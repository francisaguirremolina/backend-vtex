import mongoose from 'mongoose';
import { IPackageDocument, IPackageModel } from '../interfaces/package.interfaces';

const packageSchema = new mongoose.Schema<IPackageDocument>(
	{
		userId: {
			type: String,
			index: true
		},

		dimensions: [Number]
	},
	{
		timestamps: true
	}
);

const Package = mongoose.model<IPackageDocument, IPackageModel>('Package', packageSchema);

export default Package;
