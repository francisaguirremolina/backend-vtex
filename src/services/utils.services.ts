/* eslint-disable import/no-extraneous-dependencies */
import axios from 'axios';
import { Logger } from 'conexa-core-server';
import config from '../config/config';
import { URL_SUBSCRIBE_WEBHOOK_OCA_PROD, URL_SUBSCRIBE_WEBHOOK_OCA_TEST } from '../config/oca';

const APIURL = `${config.api.url}/api/v1/webhooks/webhooksoca`;

const WEBHOOKSOCAURLSUBSCRIBE =
	config.env === 'development' || config.env === 'staging'
		? URL_SUBSCRIBE_WEBHOOK_OCA_TEST
		: URL_SUBSCRIBE_WEBHOOK_OCA_PROD;

export const creationWebhookOCA = async (accountNumber: string) => {
	try {
		const webhooksOCA = {
			nrocuenta: accountNumber,
			urlapi: APIURL,
			origen: 'VTEX',
			headers: [{ clave: 'token', valor: 'F39BBBA524A552C73A311C6D0EC26F33267C4252A29A370354F6945BE33FD9FC' }]
		};

		Logger.debug(`WEBHOOK URL --> ${WEBHOOKSOCAURLSUBSCRIBE}`);

		const result = await axios(WEBHOOKSOCAURLSUBSCRIBE, {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			data: webhooksOCA
		});
		Logger.info(`subsribe webhooks OK ${JSON.stringify(result?.data)}`);
		return result?.data;
	} catch (error: any) {
		Logger.error(`creation webhook OCA --> ${error}`);
		Logger.error(`subscribe webhooks ${error?.response?.data?.error}`);
		Logger.error(`subscribe webhooks ${error}`);
		return error;
	}
};
