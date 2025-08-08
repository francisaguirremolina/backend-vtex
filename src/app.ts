import express, { Request, Response } from 'express';
import helmet from 'helmet';
import xss from 'xss-clean';
import ExpressMongoSanitize from 'express-mongo-sanitize';
import cors from 'cors';
import * as conexaCore from 'conexa-core-server';

import { configureEcommerce, OcaTypes, setConfigPdfDownload } from 'oca-package';
import { errorHandler } from './middlewares/error.middleware';
import config from './config/config';
import routes from './routes/index.routes';

import { ConfigPDFDownload } from './config/conexa.utils';

conexaCore.Logger.debug(
	`Starting APP: Environment: ${config.env} - OCA FORCE PROD: ${config.api.oca.forceProd}`
);

// Initialize Conexa Core Server
conexaCore.configure({
	secretKey: config.cryptojsKey as string,
	privateKey: config.cryptojsKey as string,
	securityBypass: config.env !== 'production',
	debug: config.env !== 'production',
	env: config.env as 'development' | 'production' | 'test'
});

// OCA
configureEcommerce(OcaTypes.Ecommerce.VTEX);
setConfigPdfDownload(ConfigPDFDownload, conexaCore.internalInterceptor);

const app = express();
const basePath = new URL(config.api.url).pathname.replace(/\/$/, '');

// Set security HTTP headers
app.use(helmet());

// Enable cors
app.use(cors());
app.options('*', cors());

// Parse json request body
app.use(express.json({ limit: '10mb' }));

// Parse urlencoded request body
app.use(express.urlencoded({ extended: true }));

// Sanitize request data
app.use(xss());
app.use(ExpressMongoSanitize());

// Health Check
['/', '/health', '/health-check', '/healthcheck'].forEach((route) => {
	const handler = (_req: Request, res: Response) => {
		res.status(200).json({
			status: 'UP',
			timestamp: new Date().toISOString(),
			uptime: process.uptime(),
			message: 'The Service Oca Vtex is healthy'
		});
	};
	app.get(route, handler);
	if (basePath !== '') app.get(`${basePath}${route}`, handler);
});

if (config.env !== 'test') {
	app.use(conexaCore.HttpLogger.successHandler);
	app.use(conexaCore.HttpLogger.errorHandler);
}

// routes
app.use(basePath || '/', routes);

// handle error
app.use(errorHandler);

export default app;
