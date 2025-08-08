import mongoose from 'mongoose';
import { Logger } from 'conexa-core-server';

import config from '../../config/config';

export const connect = async (callback?: Function) => {
	mongoose.set('strictQuery', true);
	mongoose.connect(config.mongoose.url).then(async () => {
		Logger.info('Connected to MongoDB');
		await mongoose.syncIndexes();
		Logger.debug('Indexes synchronized successfully.');
		if (callback) callback();
	});
};

export const disconnect = async () => mongoose.disconnect;
