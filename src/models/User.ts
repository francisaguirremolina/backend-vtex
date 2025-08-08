import mongoose from 'mongoose';
import { IUserDocument, IUserModel } from '../interfaces';

import { protectedObject, protectedString } from '../utils/db.protection';

const userSchema = new mongoose.Schema<IUserDocument>(
	{
		vtexUrl: {
			type: String,
			index: true,
			unique: true
		},
		vtexWebhook: {
			type: String,
			index: true,
			unique: true
		},
		vtexAuth: protectedObject,
		// OCA
		email: String,
		password: protectedString,
		accountNumber: String,
		operational: Array<Object>,
		finishedFlow: Boolean,
		printReceipt: Boolean,
		receiptSettings: {
			isReceiptActive: {
				type: Boolean,
				default: false
			},
			receiptConfig: {
				isOrderInfoIncluded: {
					type: Boolean,
					default: false
				},
				isRemitterIncluded: {
					type: Boolean,
					default: false
				},
				isNotesIncluded: {
					type: Boolean,
					default: false
				},
				isClientIdIncluded: {
					type: Boolean,
					default: false
				}
			}
		},
		pickupPointsLoaded: String
	},
	{
		timestamps: true
	}
);

const User = mongoose.model<IUserDocument, IUserModel>('User', userSchema);

export default User;
