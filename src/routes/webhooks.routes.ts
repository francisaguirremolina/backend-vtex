import express from 'express';

import { validateMiddleware } from 'conexa-core-server';
import * as webhooksController from '../controllers/webhooks.controller';
import * as validations from '../validations/index';
import config from '../config/config';

const router = express.Router();

// Vtex
router.post('/vtex/orders', webhooksController.vtex);

// OCA
router.post('/webhooksoca', webhooksController.carrier);
router.post(
	'/oca/pickup-point',
	validateMiddleware(validations.updatePickUpPoint),
	webhooksController.updatePickUpPoint
);
router.post(
	'/shipping-rates',
	validateMiddleware(validations.updateShippingRates),
	webhooksController.updateShippingRates
);

if (config.env !== 'production') {
	router.get(
		'/delete-points',
		validateMiddleware(validations.deletePoints),
		webhooksController.deleteAllPickUpPoints
	);
}

export default router;
