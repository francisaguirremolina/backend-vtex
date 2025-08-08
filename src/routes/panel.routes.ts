import express from 'express';

import { validateMiddleware } from 'conexa-core-server';
import {
	cancelOrders,
	editAccount,
	editOrder,
	editReceiptSettings,
	getAccountOca,
	getOrder,
	getOrders,
	getReceiptSettings,
	getOperationalData,
	creationOperationalData,
	updatePackage,
	printLabels,
	ordersCreation,
	getDispatch
} from '../controllers/panel.controller';
import { getNearbyStores } from '../controllers/onboarding.controller';
import { getLocations, associateLocation } from '../controllers/locations.controller';
import * as validations from '../validations/index';

const router = express.Router();

router.get('/orders', getOrders);
router.get('/order', getOrder);
router.put('/order', validateMiddleware(validations.editOrder), editOrder);
router.post('/newOrders', validateMiddleware(validations.ordersCreation), ordersCreation);
router.post('/orders/cancel', cancelOrders);
router.post('/orders/labels', validateMiddleware(validations.getLabels), printLabels);
router.delete('order/cancel', cancelOrders);

router.get('/receipt', getReceiptSettings);
router.put('/receipt', editReceiptSettings);

router.get('/account', getAccountOca);
router.put('/account', editAccount);

router.get('/docks', getLocations);
router.post('/docks', associateLocation);

router.get('/dispatch', getDispatch);

router.get('/nearby-stores', validateMiddleware(validations.nearbyStores), getNearbyStores);

router.get('/operational', getOperationalData);
router.post('/operational', creationOperationalData);

router.put('/package', updatePackage);

export default router;
