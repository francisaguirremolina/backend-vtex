import { IDock } from 'vtex-package-ts/dist/interfaces';

import { Logger } from 'conexa-core-server';
import { IFrontendLocation, IUserDocument, ResponseDock } from '../../interfaces';
import * as dbService from '../db.service';

export const vtexLocationsToFrontend = (docks: IDock[]) => docks.map(locationVtexToFrontend);

export const frontendLocationToVtex = (location: IFrontendLocation): IDock => {
	const dockId = location.name.replaceAll(' ', '-');
	const dock: IDock = {
		id: dockId,
		name: location.name,
		priority: 0,
		dockTimeFake: '00:00:00',
		timeFakeOverhead: '00:00:00',
		salesChannels: ['1'],
		// salesChannel: 'null',
		freightTableIds: [],
		wmsEndPoint: '',
		pickupStoreInfo: {
			isPickupStore: false,
			storeId: 'null',
			friendlyName: 'null',
			address: {
				postalCode: location.postalCode,
				country: {
					acronym: location.countryCode,
					name: location.country
				},
				city: location.city,
				state: location.province,
				street: location.street,
				number: location.number,
				neighborhood: '',
				complement: ''
			},
			additionalInfo: 'null',
			dockId: 'null'
		},
		address: {
			postalCode: location.postalCode,
			country: {
				acronym: location.countryCode,
				name: location.country
			},
			city: location.city,
			state: location.province,
			street: location.street,
			number: location.number,
			neighborhood: '',
			complement: ''
		},
		pickupInStoreInfo: {
			isActice: false,
			additionalInfo: null
		},
		deliveryFromStoreInfo: {
			isActice: false,
			deliveryRadius: 0.0,
			deliveryFee: 0.0,
			deliveryTime: '00:00:00',
			maximumWeight: 0.0
		},
		shippingRatesProviders: [],
		isActive: true
	};

	return dock;
};

const locationVtexToFrontend = (dock: IDock): IFrontendLocation => {
	Logger.debug(`IS ACTIVE --> ${dock.isActive}`);
	return {
		name: dock.name,
		locationId: dock.id!,
		country: dock.address?.country?.name || '',
		countryCode: dock.address?.country?.acronym || '',
		province: dock.address?.state || '',
		city: dock.address?.city || '',
		street: dock.address?.street!,
		number: dock.address?.number!,
		// address: fromStreetAndNumberToAddress(dock.address?.street, dock.address?.number),
		postalCode: dock.address?.postalCode || '',
		availableForDelivery: dock.isActive
	};
};

export const getLocationFormated = async (
	user: IUserDocument,
	locations: IFrontendLocation[]
): Promise<ResponseDock[]> => {
	// eslint-disable-next-line prefer-const
	let locationFormated: ResponseDock[] = [];

	// eslint-disable-next-line no-restricted-syntax
	for await (const location of locations) {
		// eslint-disable-next-line no-await-in-loop
		const dockData = await dbService.getDockByLocation(location.locationId, user._id);

		// check if dock is configured
		const operationals = user.operational.find((operational) =>
			operational.dockIds?.includes(location.locationId)
		);
		const dispatches = await dbService.getDispatchByDockId(location.locationId, user._id);
		const availableForDelivery = dockData?.isActive! || false;
		const configured = !!(operationals && dispatches) && availableForDelivery;

		Logger.debug(`LOCATION ACTIVE --> ${location.availableForDelivery}`);
		locationFormated.push({
			availableForDelivery,
			companyName: '',
			cuit: '',
			firstName: '',
			lastName: '',
			locationId: location.locationId,
			name: location.name,
			countryCode: 'ARG',
			country: location.country,
			province: location.province,
			city: location.city,
			address: location.street,
			postalCode: location.postalCode,
			inCoverage: true,
			configured
		});
	}

	return locationFormated;
};
