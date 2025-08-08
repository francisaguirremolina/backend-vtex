import Dispatch from '../../models/Dispatch';
import { IDispatch, IDispatchDocument } from '../../interfaces/dispatch.interfaces';

export const createOrUpdateDispatch = async (dispatch: IDispatch) =>
	Dispatch.findOneAndUpdate(
		{
			userId: dispatch.userId,
			dockIds: dispatch.dockIds
		},
		dispatch,
		{
			new: true,
			upsert: true
		}
	);

export const getDispatchByUserId = async (userId: string): Promise<IDispatchDocument | null> =>
	Dispatch.findOne({ userId });

export const getDispatchByDockId = async (
	dockId: string,
	userId: string
): Promise<IDispatchDocument | null> => Dispatch.findOne({ dockIds: dockId, userId });

export const getDispatchByUserAndDockIds = async (
	userId: string,
	dockId: string
): Promise<IDispatchDocument | null> => Dispatch.findOne({ userId, dockIds: dockId });

export const getDispatchByDockAndUserIds = async (
	userId: string,
	dockId: string
): Promise<IDispatchDocument | null> => Dispatch.findOne({ userId, dockIds: dockId });

export const deleteDispatchByUserAndDockId = async (userId: string, dockId: string) =>
	Dispatch.deleteOne({ userId, dockIds: dockId });
