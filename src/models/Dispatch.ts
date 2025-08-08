import mongoose from 'mongoose';
import { IDispatchDocument, IDispatchModel } from '../interfaces/dispatch.interfaces';

const dockSchema = new mongoose.Schema<IDispatchDocument>(
	{
		userId: {
			type: String,
			index: true
		},
		defaultStoreId: String,
		defaultDispatchType: String,
		activeDays: [Object],
		defaultTimeRange: String,
		dockIds: {
			type: [String],
			index: true
		}
	},
	{
		timestamps: true
	}
);

const Dispatch = mongoose.model<IDispatchDocument, IDispatchModel>('Dispatch', dockSchema);

export default Dispatch;
