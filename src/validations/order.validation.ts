import { Joi } from 'conexa-core-server';
import { IValidationSchema } from '../lib/conexa-core/interfaces/validation.interfaces';

const ORDER_ID = { orderId: Joi.string() };
const ORDER_IDS = { orderIds: Joi.array().items(Joi.string()).min(1) };

export const getOrderDetail: IValidationSchema = {
	params: Joi.object().keys({
		mongoId: Joi.string().hex().length(24).message('Param mongoId should be a valid mongoId')
	})
};
export const getLabels: IValidationSchema = { body: ORDER_IDS };
export const createOrder: IValidationSchema = { body: ORDER_ID };
export const createOrders: IValidationSchema = { body: ORDER_IDS };
export const editOrder: IValidationSchema = {
	query: { ...ORDER_ID, userId: Joi.string() },
	body: {
		recipient: Joi.object().optional(),
		shippingAddress: Joi.object().optional(),
		packageSettings: Joi.object().optional(),
		receiptSettings: Joi.object().optional(),
		packageData: Joi.object().optional()
	}
};
