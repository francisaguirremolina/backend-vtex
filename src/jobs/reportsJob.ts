import { Logger } from 'conexa-core-server';
import {
	CallbackFunction,
	IColumnsConfig,
	IMailOptionsNodemailer,
	IOthersModels
} from 'oca-package/dist/interface/oca.interface';
import config from '../config/config';
import { getAndSendReports } from '../services/carrier.service';
import { getOrdersByUsers, getUsers } from '../services/db.service';

const dateFormaterDDMMAA = (): string => {
	const today = new Date();

	const day = today.getDate();
	const month = today.getMonth() + 1;
	const year = today.getFullYear();

	const dayFormated = day < 10 ? `0${day}` : day;
	const monthFormated = month < 10 ? `0${month}` : month;
	const yearFormated = year.toString().slice(-2);
	return `${dayFormated}.${monthFormated}.${yearFormated}`;
};
const orderCountCallback: CallbackFunction = (data: any, othersModel?: IOthersModels[]): number | string => {
	if (!othersModel) return 'Error: Sin modelo de ordenes';

	const orders: any[] = othersModel.find((model) => model.name === 'orders')?.data;
	if (!orders) return 'Error: Sin modelo de ordenes';
	return orders.filter((order) => order.vtexUrl === data.vtexUrl).length;
};

const columnsConfig: IColumnsConfig[] = [
	{
		columnName: 'Tienda',
		dbPropertyName: 'vtexUrl',
		defaultValue: 'Sin Url de tienda'
	},
	{
		columnName: 'Numero de cuenta OCA',
		dbPropertyName: 'accountNumber',
		defaultValue: 'Sin numero de cuenta OCA'
	},
	{
		columnName: 'Email',
		dbPropertyName: 'email',
		defaultValue: 'Sin nombre de usuario'
	},
	{
		columnName: 'Flujo completo',
		dbPropertyName: 'finishedFlow',
		defaultValue: 'false'
	},
	{
		columnName: 'Cant. de ordenes',
		dbPropertyName: '',
		defaultValue: '0',
		callbackValues: orderCountCallback
	}
];

const toSendMail =
	config.env === 'production' ? ['juan.sancho@conexa.ai', 'franco@conexa.ai'] : ['franco@conexa.ai'];

const mailOptions: IMailOptionsNodemailer = {
	to: toSendMail,
	subject: `Reporte de usuarios ${dateFormaterDDMMAA()}`,
	text: `Reporte de usuarios ${dateFormaterDDMMAA()}`,
	attachments: [
		{
			filename: `reporte_de_usuarios_${dateFormaterDDMMAA()}.csv`
		}
	]
};

export default async () => {
	const users = await getUsers();

	const vtexUrls: string[] = users.map((user) => user.vtexUrl);

	const orders = await getOrdersByUsers(vtexUrls);

	const othersModels: IOthersModels[] = [
		{
			name: 'orders',
			data: orders
		}
	];

	await getAndSendReports(columnsConfig, users, othersModels, mailOptions);
	Logger.info(`Se encontraron ${users.length} usuarios`);
};
