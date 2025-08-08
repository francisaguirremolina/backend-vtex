import { CronJob } from 'cron';
import { Logger } from 'conexa-core-server';
import syncReports from './reportsJob';
import config from '../config/config';

// Job to sync products every day at 13:00hs
const syncReportsJob = new CronJob(
	'0 13 * * *',
	() => {
		if (config.env === 'production') {
			syncReports();
		}
	},
	null,
	true,
	'America/Argentina/Buenos_Aires'
);

const initCrons = () => {
	try {
		Logger.info('Starting crons');
		syncReportsJob.start();
	} catch (error) {
		Logger.error(`Error trying to init crons: ${error}`);
	}
};

export const stopCrons = () => {
	syncReportsJob.stop();
};

export default initCrons;
