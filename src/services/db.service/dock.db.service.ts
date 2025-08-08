import { IDock, IDockDocument, IFrontendLocation, IUserDocument } from '../../interfaces';
import Dock from '../../models/Dock';
import { deleteDispatchByUserAndDockId } from './dispatch.db.service';
import { deleteDockFromUserOperatives } from './user.db.service';

export const getDockById = async (dockId: string, userId: string) => Dock.findOne({ dockId, userId });

export const getDockByUserId = async (userId: string) => Dock.findOne({ userId });

export const getDocksByUserId = async (userId: string) => Dock.find({ userId });

export const getActiveDocks = async (userId: string) => Dock.find({ userId, isActive: true });

export const createDock = async (dock: IDock) => {
	return Dock.create(dock);
};

export const getDockByLocation = async (dockId: string, userId: string): Promise<IDockDocument | null> =>
	Dock.findOne({ dockId, userId });

export const updateDock = async (condition: { dockId: string; userId: string }, dock: Partial<IDock>) => {
	const updatedDock = await Dock.findOneAndUpdate(condition, dock, { new: true });
	if (!updatedDock) throw new Error(`Dock not found for ${condition}`);
	return updatedDock;
};

export const createOrUpdateDock = async (dock: IDock): Promise<IDockDocument> =>
	Dock.findOneAndUpdate({ dockId: dock.dockId, userId: dock.userId }, dock, { upsert: true, new: true });

export const removeDisabledDocksDB = async (user: IUserDocument, vtexDocks: IFrontendLocation[]) => {
	const dbDocks = await getDocksByUserId(user._id);

	await Promise.all(
		dbDocks.map(async (dbDock) => {
			const exists = vtexDocks.find((vtexDock) => vtexDock.locationId === dbDock.dockId);

			if (!exists) {
				// remove dock from operatives
				await deleteDockFromUserOperatives(user, dbDock.dockId);
				// remove dispatch
				await deleteDispatchByUserAndDockId(user._id, dbDock.dockId);
				// delete dock
				await dbDock.deleteOne(dbDock._id);
			}
		})
	);
};
