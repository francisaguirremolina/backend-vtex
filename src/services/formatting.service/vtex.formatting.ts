import { IFreightCreationPayload } from 'vtex-package-ts/dist/interfaces';
import { IRate } from '../../interfaces';

export const generateBatch = (bulk: IFreightCreationPayload[], limitBatch: number = 3000) => {
	const batch: IFreightCreationPayload[][] = [];
	for (let i = 0; i < bulk.length; i += limitBatch) {
		batch.push(bulk.slice(i, i + limitBatch));
	}
	return batch;
};

export const formatFreightValues = (rates: IRate[]): IFreightCreationPayload[] => {
	const formattedRates = rates.map((rate) => ({
		...rate,
		absoluteMoneyCost: String(rate.absoluteMoneyCost),
		pricePercent: rate.pricePercent || 0
	}));

	return formattedRates;
};

const groupByPostalCode = (rates: IRate[]): any => {
	rates.sort((a, b) => Number(a.zipCodeStart) - Number(b.zipCodeStart));

	const groups: IRate[][] = [];
	let actualGroup: IRate[] = [rates[0]!];

	for (let i = 1; i < rates.length; i++) {
		if (Number(rates[i]!.zipCodeStart) === Number(rates[i - 1]!.zipCodeStart) + 1) {
			actualGroup.push(rates[i]!);
		} else {
			groups.push(actualGroup);
			actualGroup = [rates[i]!];
		}
	}

	groups.push(actualGroup);

	return groups.map((group) => {
		return {
			...group[0],
			zipCodeEnd: group[group.length - 1]!.zipCodeEnd
		};
	});
};

const groupByCost = (rates: IRate[]) => {
	return rates.reduce((result, currentValue) => {
		const key = currentValue.absoluteMoneyCost;
		// eslint-disable-next-line no-param-reassign
		if (!result[key]) result[key] = [];
		result[key]!.push(currentValue);

		return result;
	}, {} as Record<number, IRate[]>);
};

export const groupRates = (rates: IRate[]): IRate[] => {
	// Group by absoluteMoneyCost
	const groupedRates = groupByCost(rates);

	const resultRates = Object.values(groupedRates);
	return resultRates.map((value) => groupByPostalCode(value)).flat();
};
