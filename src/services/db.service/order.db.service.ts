import httpStatus from 'http-status';
import { FilterQuery, SortOrder } from 'mongoose';
import Order from '../../models/Order';

import {
	CreatedAtFilter,
	IGetOrders,
	IMongooseRegex,
	IOrder,
	IOrderDocument,
	IQueryOrders
} from '../../interfaces/order.interfaces';
import ApiError from '../../lib/ApiError';
import { stringIncludesNumber } from '../../utils/misc';
import { DefaultDispatchType } from '../../interfaces/dispatch.interfaces';
import { PrefixTag } from '../../interfaces';

export interface StatusFilter {
	PENDING: string;
	CREATED: string;
	ON_ROUTE: string;
	CANCELED: string;
	DELIVERED: string;
	RETURNED: string;
	COLLECTED: string;
	AT_STORE: string;
	ERROR: string;
}
export interface ItemsCart {
	id: number;
	product_id: number;
	name: string;
	sku: string | null;
	quantity: number;
	free_shipping: boolean;
	price: number;
	grams: number;
	dimensions: Dimensions;
}
interface Dimensions {
	width: number;
	height: number;
	depth: number;
}

export const getOrderById = async (id: string) => Order.findById(id);

export const findOrder = async (orderId: string) => Order.findOne({ orderId });

export const getOrderByParams = async (params: object) => Order.findOne(params);

export const getOrdersByIds = async (orderIds: string[]) => Order.find({ _id: { $in: orderIds } });

export const updateOrderByParamsOrError = async (params: object, dataToUpdate: Partial<IOrder>) => {
	const order = await Order.findOneAndUpdate(params, dataToUpdate, { new: true });
	if (!order) throw new ApiError(httpStatus.NOT_FOUND, 'Order not found', 'order.not-found');

	return order;
};

export const updateOrderByIdOrError = async (id: string, dataToUpdate: Partial<IOrder>) => {
	const order = await Order.findByIdAndUpdate(id, dataToUpdate, { new: true });
	if (!order) throw new ApiError(httpStatus.NOT_FOUND, 'Order not found', 'order.not-found');

	return order;
};

export const createOrder = async (order: any) => Order.create(order);

export const getOrdersCount = async () => Order.countDocuments();

export const getOrdersPaginated = async (params: IGetOrders) => {
	const { limit = 10, sort = -1, dateFrom, dateTo, from = 0, tag, delivery, ...inputFilters } = params;

	const filters: FilterQuery<IOrderDocument> = sanitizeFilters(inputFilters);

	if (dateFrom || dateTo) {
		filters.createdAt = getCreatedAtFromDates(dateFrom, dateTo);
	}

	if (tag) {
		const trimmedTag = tag.trim();
		const isAnOrderId = stringIncludesNumber(trimmedTag);

		if (isAnOrderId) filters.orderId = trimmedTag;
		else filters.$or = handleSearchByName(trimmedTag);
	}

	if (delivery && delivery !== 'all') {
		const searchByDeliveryType = handleSearchByDeliveryType(delivery);

		if (filters.$or) filters.$or.push(searchByDeliveryType[0]!);
		else filters.$or = searchByDeliveryType;
	}

	const sortOrder = +sort as SortOrder;

	const orders = await Order.find(filters).sort({ orderId: sortOrder });

	return {
		orders: orders.slice(Number(from), Number(from) + Number(limit)),
		totalOrders: orders.length
	};
};

export const getOrdersByUsers = async (vtexUrls: string[]): Promise<IOrder[] | []> => {
	return Order.find({ vtexUrl: { $in: vtexUrls } });
};

const sanitizeFilters = (inputFilter: IQueryOrders) => {
	const sanitizedFilter: Partial<IQueryOrders> = {};
	// eslint-disable-next-line guard-for-in, no-restricted-syntax
	for (const key in inputFilter) {
		const coarcedKey = key as keyof IQueryOrders;
		const value = inputFilter[coarcedKey];
		if (value !== 'all' && value !== '') {
			sanitizedFilter[coarcedKey] = value as any;
		}
	}

	return sanitizedFilter;
};

const getCreatedAtFromDates = (dateFrom?: string, dateTo?: string): CreatedAtFilter => {
	const createdAt: CreatedAtFilter = {};
	if (dateFrom) {
		createdAt.$gte = new Date(dateFrom);
	}
	if (dateTo) {
		createdAt.$lt = new Date(dateTo);
	}
	return createdAt;
};

const getMongooseRegex = (pattern: string, options: string = 'i') => {
	const mongooseRegex: IMongooseRegex = {
		$regex: pattern
	};
	if (options) {
		mongooseRegex.$options = options;
	}
	return mongooseRegex;
};

const handleSearchByName = (name: string) => {
	const nameAndLastName = name.split(' ');
	const clearSpecialChars = nameAndLastName.map((x) => x.normalize('NFD').replace(/[\u0300-\u036f]/g, ''));

	const { firstName, lastName } = {
		firstName: 'recipient.firstName',
		lastName: 'recipient.lastName'
	} as const;

	if (clearSpecialChars.length === 1)
		return [
			{ [firstName]: getMongooseRegex(clearSpecialChars[0] as string) },
			{ [lastName]: getMongooseRegex(clearSpecialChars[0] as string) }
		];

	return [
		{ [firstName]: getMongooseRegex(clearSpecialChars[0] as string) },
		{
			[lastName]: getMongooseRegex(clearSpecialChars[clearSpecialChars.length - 1] as string)
		}
	];
};

const deliveryTypes = {
	[DefaultDispatchType.HOME]: { $exists: false },
	// eslint-disable-next-line security/detect-non-literal-regexp
	[DefaultDispatchType.STORE]: { $exists: true, $not: new RegExp(PrefixTag.LOCKER) },
	// eslint-disable-next-line security/detect-non-literal-regexp
	[DefaultDispatchType.LOCKER]: { $exists: true, $regex: new RegExp(PrefixTag.LOCKER) }
};
const handleSearchByDeliveryType = (deliveryType: DefaultDispatchType) => {
	return [{ pickupPointId: deliveryTypes[deliveryType] }];
};
