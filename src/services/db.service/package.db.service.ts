import { IPackage, IPackageDocument } from '../../interfaces/package.interfaces';
import Package from '../../models/Package';

export const createPackage = async (pack: IPackage) =>
	Package.findOneAndUpdate({ userId: pack.userId }, pack, {
		new: true,
		upsert: true
	});

export const updateDimensionPackage = async (userId: string, dimensions: Array<number>) =>
	Package.findOneAndUpdate({ userId }, { dimensions }, { new: true, upsert: true });

export const getPackageByUserId = async (userId: string): Promise<IPackageDocument | null> =>
	Package.findOne({ userId });
