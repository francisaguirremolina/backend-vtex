import mongoose from 'mongoose';
import { IDockDocument, IDockModel } from '../interfaces';

const dockSchema = new mongoose.Schema<IDockDocument>(
	{
		isActive: {
			type: Boolean,
			default: false
		},
		userId: {
			type: String,
			index: true
		},
		dockId: {
			type: String,
			index: true
		},
		name: String,
		postalCode: String,
		ratesLoadedOperativeIds: [String]
	},
	{
		timestamps: true
	}
);

const Dock = mongoose.model<IDockDocument, IDockModel>('Dock', dockSchema);

export default Dock;
