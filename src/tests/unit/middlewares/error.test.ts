import mongoose from 'mongoose';
import httpStatus from 'http-status';
import httpMocks from 'node-mocks-http';
import { jest } from '@jest/globals';
// import config from '../../../config/config';
import { Logger } from 'conexa-core-server';
import winston from 'winston';
import ApiError from '../../../lib/ApiError';
import { errorHandler } from '../../../middlewares/error.middleware';

describe('Error middlewares', () => {
	afterAll(async () => {
		await mongoose.disconnect();
	});

	describe('Error handler', () => {
		beforeEach(() => {
			jest.spyOn(Logger, 'error').mockImplementation(() => winston.createLogger({}));
		});
		test('should send proper error response and put the error message in res.locals', () => {
			const error = new ApiError(httpStatus.BAD_REQUEST, 'Any error', 'any-error');
			const res = httpMocks.createResponse();
			const next = jest.fn();
			const sendSpy = jest.spyOn(res, 'send');
			errorHandler(error, httpMocks.createRequest(), res, next);
			expect(sendSpy).toHaveBeenCalledWith({
				success: false,
				statusCode: error.statusCode,
				code: error.code,
				message: error.message
			});
		});

		test('should send internal server error status and message if in production mode and error is not operational', () => {
			const error = new Error('unexpected error');
			const res = httpMocks.createResponse();
			const next = jest.fn();
			const sendSpy = jest.spyOn(res, 'send');
			errorHandler(error, httpMocks.createRequest(), res, next);
			expect(sendSpy).toHaveBeenCalledWith({
				success: false,
				statusCode: httpStatus.INTERNAL_SERVER_ERROR,
				message: httpStatus[httpStatus.INTERNAL_SERVER_ERROR]
			});
		});
	});
});
