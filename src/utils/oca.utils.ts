import { IOrder, IOrderTotalizer } from 'vtex-package-ts/dist/interfaces';
import { centsToMoneyUnit } from './currencyUnits.utils';

export const formatPackageSettingsForOrderOCA = (vtexOrder: IOrder) => {
	const initial = { width: 0, height: 0, length: 0 };

	const dimensions = vtexOrder.items.map((item) => {
		const { quantity, additionalInfo } = item;
		let { width, height, length } = additionalInfo.dimension;

		if (quantity > 1) {
			width *= quantity;
			height *= quantity;
			length *= quantity;
		}

		return { width, height, length };
	});

	const dimension = dimensions.reduce(
		(result, item) => ({
			width: result.width + item.width,
			height: result.height + item.height,
			length: result.length + item.length
		}),
		initial
	);

	return { ...dimension, bulks: 1 };
};

export type AmountItems = {
	subtotal: string;
	discounts: string;
	shippingCost: string;
	tax: string;
};

export const getOrderAmounts = (totals: IOrderTotalizer[]): AmountItems => {
	// Crear un objeto con valores por defecto
	const result: AmountItems = {
		subtotal: '0',
		discounts: '0',
		shippingCost: '0',
		tax: '0'
	};

	totals.forEach((item) => {
		switch (item.id) {
			case 'Items':
				result.subtotal = centsToMoneyUnit(item.value);
				break;
			case 'Discounts':
				result.discounts = centsToMoneyUnit(item.value);
				break;
			case 'Shipping':
				result.shippingCost = centsToMoneyUnit(item.value);
				break;
			case 'Tax':
				result.tax = centsToMoneyUnit(item.value);
				break;
			default:
				break;
		}
	});

	return result;
};
