import { Logger } from 'conexa-core-server';
import { RequestHandler } from 'express';

import * as dbService from '../services/db.service';

export const getVitals: RequestHandler = async (_, res) => {
	Logger.info('Hit vitals endpoint');
	res.send('message');
};

export const getDbStatus: RequestHandler = async (_, res) => {
	Logger.info('Hit db check endpoint');

	try {
		const ordersCount = await await dbService.getOrdersCount();
		Logger.info(`Orders count: ${ordersCount}`);
		res.send('DB is up and running');
	} catch (error) {
		Logger.error(error);
		res.send('There is a problem with the DB');
	}
};
