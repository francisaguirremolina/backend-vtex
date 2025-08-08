import express from 'express';

import { validateMiddleware as validate } from 'conexa-core-server';
import * as authController from '../controllers/auth.controller';
import { verifyToken } from '../middlewares/verifyToken.middleware';
import * as validations from '../validations/auth.validation';

const router = express.Router();

router.post('/login', validate(validations.login), authController.login);
router.post('/refresh-token', verifyToken, authController.refreshToken);

export default router;
