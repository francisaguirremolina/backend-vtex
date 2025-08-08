import express, { Router, RequestHandler } from 'express';
import { decryptRequestMiddleware, internalMiddleware } from 'conexa-core-server';
import { verifyToken } from '../middlewares/verifyToken.middleware';

import config from '../config/config';

import authRoute from './auth.routes';
import onboardingRoute from './onboarding.routes';
import webhooksRoute from './webhooks.routes';
import panelRoute from './panel.routes';
import pdfRoute from './pdf.route';

import { passNotFound } from '../controllers/notFound.controllers';
import { routerCatchWrapper } from '../lib';

const router = express.Router();

interface IRoute {
	path: string;
	route: Router;
	comingFromFrontend?: boolean;
	needMiddlemanToken?: boolean;
	internalMiddleware?: boolean;
}

const apiPrefix = `/api/${config.apiVersion}`;

const routesMapping: IRoute[] = [
	{
		path: `${apiPrefix}/auth`,
		route: authRoute,
		comingFromFrontend: false
	},
	{
		path: `${apiPrefix}/onboarding`,
		route: onboardingRoute,
		comingFromFrontend: false
	},
	{
		path: `${apiPrefix}/webhooks`,
		route: webhooksRoute
	},
	{
		path: `${apiPrefix}/panel`,
		route: panelRoute,
		comingFromFrontend: false,
		needMiddlemanToken: true
	},
	{
		path: `${apiPrefix}/pdf/service`,
		route: pdfRoute,
		internalMiddleware: true
	}
];

routesMapping.forEach((route) => {
	const middlewaresToApply: RequestHandler[] = [];

	if (route.comingFromFrontend) middlewaresToApply.push(decryptRequestMiddleware);
	if (route.needMiddlemanToken) middlewaresToApply.push(verifyToken);
	if (route.internalMiddleware) middlewaresToApply.push(internalMiddleware);

	router.use(route.path, middlewaresToApply, route.route);
});

// Send back a 404 error for any unhandled api request
router.use(passNotFound);

routerCatchWrapper(router);

export default router;
