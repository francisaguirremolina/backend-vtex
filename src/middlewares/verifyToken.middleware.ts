import { RequestHandler } from 'express';

import httpStatus from 'http-status';
import jwt from 'jsonwebtoken';
import { Logger } from 'conexa-core-server';
import ApiError from '../lib/ApiError';
import config from '../config/config';

// Augments Request interface with userId, so we can use it from anyware in the code
declare global {
	namespace Express {
		interface Request {
			userId: string;
		}
	}
}

interface IMiddlemanTokenContent {
	userId: string;
}

export const verifyToken: RequestHandler = (req, _res, next) => {
	try {
		const token = req.headers.authorization?.split(' ')[1];
		if (!token) throw new Error('Token not present in the request header.');

		const decodedToken = jwt.verify(token, config.jwtSecret);
		if (typeof decodedToken === 'object') {
			const content = decodedToken as IMiddlemanTokenContent;
			req.userId = content.userId;
		}

		next();
	} catch (error) {
		Logger.error(error);
		Logger.error(error);
		next(
			new ApiError(
				httpStatus.UNAUTHORIZED,
				'Se detectó un problema con la autenticación',
				'panel.auth-problem'
			)
		);
	}
};
