import { ErrorRequestHandler } from 'express';
import httpStatus from 'http-status';
import { Logger } from 'conexa-core-server';

// eslint-disable-next-line
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
	const { code } = err;
	let { message } = err;

	const statusCode = err.statusCode || httpStatus.INTERNAL_SERVER_ERROR;

	if (statusCode === httpStatus.INTERNAL_SERVER_ERROR) {
		message = httpStatus[statusCode as keyof typeof httpStatus];
	}

	const response = {
		success: false,
		statusCode,
		message,
		code
	};
	if (!code) delete response.code;

	Logger.error(err);

	res.status(statusCode).send(response);
};
