import { Joi } from 'conexa-core-server';
import { IValidationSchema } from '../lib/conexa-core/interfaces/validation.interfaces';

const ORDER_ID = { orderId: Joi.string().required() };
const ORDER_IDS = { orderIds: Joi.array().items(Joi.string()).min(1).required() };

export const getOrderDetail: IValidationSchema = {
	params: Joi.object().keys({
		mongoId: Joi.string().hex().length(24).message('Param mongoId should be a valid mongoId')
	})
};
export const getLabels: IValidationSchema = { body: ORDER_IDS };

export const ordersCreation: IValidationSchema = {
	query: {
		userId: Joi.string().required()
	},
	body: ORDER_IDS
};

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

export const getOrders = {
	query: Joi.object().keys({
		userId: Joi.string().required(),
		limit: Joi.string(),
		offset: Joi.string(),
		from: Joi.string(),
		sort: Joi.string(),
		dateFrom: Joi.string(),
		dateTo: Joi.string(),
		status: Joi.string(),
		delivery: Joi.string(),
		tag: Joi.string()
	})
};

export const cancelOrders = {
	query: Joi.object().keys({
		userId: Joi.string().required()
	}),

	body: Joi.object().keys({
		ordersIds: Joi.array().required()
	})
};

export const fulfillOrders = {
	body: Joi.object().keys({
		ordersIds: Joi.array().required()
	})
};

export const downloadLabels = {
	body: Joi.object().keys({
		ordersIds: Joi.array().required()
	})
};
