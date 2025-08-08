import express from 'express';
import * as vitalsController from '../controllers/vitals.controller';

const router = express.Router();

router.get('/', vitalsController.getVitals);
router.get('/dbCheck', vitalsController.getDbStatus);

export default router;
