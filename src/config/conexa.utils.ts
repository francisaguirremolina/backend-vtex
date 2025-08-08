import { AxiosRequestConfig } from 'axios';
import config from './config';

const { apiVersion, api } = config;

export const ConfigPDFDownload: AxiosRequestConfig = {
	method: 'POST',
	url: `${api.url}/api/${apiVersion}/pdf/service/print`,
	headers: { 'Content-Type': 'application/json' },
	data: {}
};
