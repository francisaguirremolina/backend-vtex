import { Logger } from 'conexa-core-server';
import { DeliveryPackageBranch, PrefixTag } from '../../interfaces/oca.interfaces';
import { IPickupPoint } from '../../interfaces';
import { DefaultDispatchType } from '../../interfaces/dispatch.interfaces';

/**
 * This function is responsible for handle the format business hours
 * @param {string} hour can have this format: '830' | '8:30' | '8' | '18' | '1830' | '18:30' | '15A20'
 * @returns {string} Hour formatted in this way: 00:00:00
 */
export function handleOfficeHours(hour: string) {
	const doblePoint = ':';
	const letter = 'A';
	const separator = hour.includes(doblePoint) ? doblePoint : letter;

	const [hourPart, minutePart] = hour.split(separator).map((part) => part.padStart(2, '0'));

	if (!hourPart) throw new Error(`Could not handle this hour '${hour}'`);

	if (hourPart.length === 1) return `0${hourPart}:00:00`;
	if (hourPart.length === 2 && !minutePart) return `${hourPart}:00:00`;
	if (hourPart.length === 2 && minutePart) return `${hourPart}:${minutePart}:00`;
	if (hourPart.length === 3) return `0${hourPart[0]}:${hourPart.slice(1)}:00`;
	if (hourPart.length === 4) return `${hourPart.slice(0, 2)}:${hourPart.slice(2)}:00`;

	throw new Error(`Could not handle this hour '${hour}'`);
}

/**
 * Formatter to transform Oca Data into Vtex format
 * @param {DeliveryPackageBranch[]} nearbyStores - Stores nearby that delivery is available
 * @returns {IPickupPoint[]}
 */
export function formatOCAStoresToVTEX(nearbyStores: DeliveryPackageBranch[]): IPickupPoint[] {
	const result: IPickupPoint[] = [];

	// eslint-disable-next-line no-restricted-syntax
	for (const nearbyStore of nearbyStores) {
		const { address: addressNearbyStore, officeHours, impositionCenterId } = nearbyStore;
		const { city, province, locality, postalCode, number, street, latitude, longitude } = addressNearbyStore;

		const isLocker = nearbyStore?.type?.toLowerCase()?.includes(DefaultDispatchType.LOCKER);
		if (isLocker) {
			Logger.debug({ isLocker, nearbyType: nearbyStore.type.toLowerCase(), impositionCenterId });
		}

		const tag = isLocker ? PrefixTag.LOCKER : PrefixTag.OCA;

		const id = `${tag}-${impositionCenterId}`;
		const name = `${PrefixTag.OCA} - ${nearbyStore.name}`;
		const description = `${PrefixTag.OCA} - ${nearbyStore.name} - ${nearbyStore.impositionCenterId}`;
		const formattedAddress = `Province: ${province} - City: ${city} - Locality: ${locality} - Postal code: ${postalCode} - Number: ${number}`;
		const NO_INFORMATION = '';
		const country = { acronym: 'ARG', name: 'Argentina' };
		const capitalizedProvince = province
			.toLowerCase()
			.replace(/\w\S*/g, (w) => w.replace(/^\w/, (c) => c.toUpperCase()));

		const address = {
			postalCode: String(postalCode),
			country,
			city: city as string,
			state: capitalizedProvince,
			province: capitalizedProvince,
			neighborhood: locality,
			street,
			number: String(number),
			complement: NO_INFORMATION,
			reference: NO_INFORMATION,
			location: {
				latitude: Number(latitude as string),
				longitude: Number(longitude as string)
			}
		};

		const businessHours = officeHours.map(({ day, start, end }) => ({
			dayOfWeek: day,
			openingTime: handleOfficeHours(start),
			closingTime: handleOfficeHours(end)
		}));

		const tagsLabel = [tag];

		result.push({
			id,
			name,
			description,
			instructions: NO_INFORMATION,
			formatted_address: formattedAddress,
			address,
			isActive: true,
			businessHours,
			tagsLabel
		});
	}

	return result;
}
