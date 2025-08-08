import { HttpService, internalInterceptor, TypeInterceptor } from 'conexa-core-server';
import config from '../config/config';

let instance: HttpService;

export function getHttpService() {
	if (!instance) {
		const { url } = config.api;

		instance = new HttpService(`${url}/api/v1`, {
			headers: {
				'Content-Type': 'application/json'
			}
		});
		instance.configureInterceptors(TypeInterceptor.REQUEST, internalInterceptor);
	}
	return instance;
}
