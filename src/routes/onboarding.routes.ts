import express from 'express';
import { validateMiddleware as validate } from 'conexa-core-server';
import { login } from '../controllers/auth.controller';

import * as onboardingController from '../controllers/onboarding.controller';
import * as panelController from '../controllers/panel.controller';
import { getLocations, associateLocation } from '../controllers/locations.controller';
import * as schemas from '../validations';
import { deleteSpaces } from '../middlewares/deleteSpaces.middleware';

const router = express.Router();

router.post('/register', onboardingController.register);

router.post('/auth-vtex', [validate(schemas.vtex), deleteSpaces], onboardingController.vtex);
router.post('/auth-oca', onboardingController.carrier);

router.put('/user', onboardingController.initialState);
router.get('/initial-state', onboardingController.getInitialState);

router.get('/docks', getLocations);
router.post('/docks', associateLocation);

router.get('/operational', panelController.getOperationalData);
router.post('/operational', panelController.creationOperationalData);

router.get('/dispatch', panelController.getDispatch);

router.get('/nearby-stores', validate(schemas.nearbyStores), onboardingController.getNearbyStores);
router.get(
	'/nearby-stores-delivery',
	validate(schemas.nearbyStores),
	panelController.getNearbyDeliveryStores
);

router.get('/user', onboardingController.getInitialState);

router.post('/auth/login', login);

export default router;
