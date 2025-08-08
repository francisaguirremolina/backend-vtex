import { Logger } from 'conexa-core-server';
import httpStatus from 'http-status';
import { IVtexAuth } from 'vtex-package-ts/dist/interfaces';
import { IDockDocument, IUserDocument, OperativaInterface, PickupPointsLoadStatus } from '../../interfaces';
import ApiError from '../../lib/ApiError';

import User from '../../models/User';
import { getSignature } from '../../utils/signature';

export const createUser = async (vtexAuth: IVtexAuth): Promise<string> => {
	try {
		const { vtexUrl, vtexKey } = vtexAuth;
		const vtexWebhook = getSignature(vtexKey);
		const newUser = await User.create({
			vtexUrl,
			vtexWebhook,
			vtexAuth,
			email: '',
			password: '',
			accountNumber: '',
			finishedFlow: false,
			isClientIdIncluded: false
		});

		return newUser._id;
	} catch (error) {
		Logger.error('Problem when creating user');
		throw error;
	}
};

export const getUserById = async (userId: string): Promise<IUserDocument | null> => User.findById(userId);

export const getUserByVtexUrl = async (vtexUrl: string) => User.findOne({ vtexUrl });

export const getUserByVtexWebhook = async (vtexKey: string) => {
	const vtexWebhook = getSignature(vtexKey);

	return User.findOne({ vtexWebhook });
};

export const getUserByIdOrError = async (userId: string) => {
	const user = await User.findById(userId);
	if (!user) {
		throw new ApiError(httpStatus.NOT_FOUND, 'Usuario no encontrado');
	}
	return user;
};

export const getUserByParams = async (params: object) => User.findOne(params);

export const updateUserOca = async (id: string, accountNumber: string, email: string, pass: string) =>
	User.findByIdAndUpdate(id, { $set: { email, accountNumber, password: pass } }, { new: true });

export const setUserPointsLoadStatus = async (id: string, status: PickupPointsLoadStatus) =>
	User.findByIdAndUpdate(id, { $set: { pickupPointsLoaded: status } }, { new: true });

export const saveOcaOperational = async (id: string, operativa: OperativaInterface) =>
	User.findByIdAndUpdate(id, { $set: { operational: operativa } }, { new: true });

export const getUsers = async (from?: Date): Promise<IUserDocument[] | []> => {
	const filter = from ? { createdAt: { $gte: from } } : {};
	return User.find(filter);
};

export const getUsersByOperationalActive = async (operationalId: string): Promise<IUserDocument[] | []> => {
	return User.find({
		'operational.selected': true,
		'operational.accountNumber': operationalId
	});
};

export const deleteDockFromUserOperatives = async (user: IUserDocument, dockId: string): Promise<void> => {
	const newOperationals = user.operational.map((op) => {
		if (op.dockIds?.includes(dockId)) {
			const newDockIds = op.dockIds.filter((id) => id !== dockId);
			return { ...op, dockIds: newDockIds, selected: !!newDockIds.length };
		}
		return op;
	});

	await User.updateOne({ _id: user._id }, { $set: { operational: newOperationals } });
};

export const deleteDockFromUserOperativesMasive = async (
	user: IUserDocument,
	docks: Record<string, IDockDocument>
): Promise<IUserDocument | null> => {
	const newOperationals = user.operational.map((op) => {
		const remainingDockIds = op?.dockIds?.filter((id) => !docks[id]) || [];
		return { ...op, dockIds: remainingDockIds, selected: !!remainingDockIds.length };
	});
	Logger.debug(newOperationals);
	return User.findByIdAndUpdate(user._id, { $set: { operational: newOperationals } }, { new: true });
};
