import { Request, Response } from 'express';

import { Logger, catchAsync } from 'conexa-core-server';
import * as dbService from '../services/db.service';
import * as vtexService from '../services/vtex.service';
import * as formatService from '../services/formatting.service';
import ApiError from '../lib/ApiError';
import { IAssociateDockRequest, IDockDocument } from '../interfaces';

export const getLocations = catchAsync(
	async (req: Request<{}, {}, {}, { userId: string }>, res: Response) => {
		const { userId } = req.query;

		const user = await dbService.getUserByIdOrError(userId);

		const locations = await vtexService.getDocks(user.vtexAuth);

		Logger.debug(`LOCATIONS --> ${JSON.stringify(locations)}`);

		const formattedLocations = formatService.vtexLocationsToFrontend(locations);

		// Clean db of disabled docks
		await dbService.removeDisabledDocksDB(user, formattedLocations);

		res.json({
			success: true,
			code: 'onboarding.get-docks',
			locations: await formatService.getLocationFormated(user, formattedLocations)
		});
	}
);

export const associateLocation = catchAsync(
	async (req: Request<{}, {}, { locations: IAssociateDockRequest[] }, { userId: string }>, res: Response) => {
		const { userId } = req.query;
		const { locations: allDocks } = req.body;

		const user = await dbService.getUserById(userId);
		if (!user) {
			throw new ApiError(
				400,
				'No se encontró el usuario del paso previo del onboarding',
				'panel.user-not-exist'
			);
		}

		const unLinkDocks: Record<string, IDockDocument> = {};

		// eslint-disable-next-line no-restricted-syntax
		for await (const dock of allDocks) {
			const newDock = await dbService.createOrUpdateDock({
				dockId: dock.locationId,
				userId: userId as string,
				isActive: dock.availableForDelivery || false,
				name: dock.name,
				postalCode: dock.postalCode
			});
			if (!newDock.isActive) {
				unLinkDocks[newDock.dockId] = newDock;
			}
		}

		// Unlink operationals from disabled docks
		await vtexService.unlinkOperationalsFromDisabledDocks(user, unLinkDocks);

		res.status(200).json({
			success: true,
			code: 'onboarding.update-docks'
		});
	}
);
