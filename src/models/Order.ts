import mongoose from 'mongoose';
import { IOrderDocument } from '../interfaces';

const orderSchema = new mongoose.Schema<IOrderDocument>(
	{
		orderId: {
			type: String,
			index: true
		},
		vtexUrl: {
			type: String,
			index: true
		},
		userId: {
			type: String,
			index: true
		},
		orderIdOca: {
			type: String,
			index: true
		}, // shipmentNumber
		pickupPointId: {
			type: String,
			index: true
		},

		trackingStatus: String,
		trackingUrl: String,
		descriptionStatus: String,
		orderWithdrawal: String,
		// Este status es de vtex
		status: String,
		trackingId: String,
		invoiceNumber: String,
		errorMessage: String,
		orderData: {
			type: String,
			get: (data: string) => JSON.parse(data),
			set: (data: unknown) => JSON.stringify(data)
		},
		recipient: Object,
		packageSettings: Object,
		receiptSettings: Object,
		shippingAddress: Object,
		origin: Object, // Origen de la compra, Docks!!
		createAtOcaOrder: { type: Date }
	},
	{
		timestamps: true
	}
);

const Order = mongoose.model<IOrderDocument>('Order', orderSchema);

export default Order;
