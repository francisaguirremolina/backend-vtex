import { RequestHandler } from 'express';

export const passNotFound: RequestHandler = (_, res) => {
	return res.status(404).json({
		success: false,
		statusCode: 404,
		message: 'Not found',
		code: '404'
	});
};
