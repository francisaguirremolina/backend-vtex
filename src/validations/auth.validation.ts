import { Joi } from 'conexa-core-server';
import { IValidationSchema } from '../lib/conexa-core/interfaces/validation.interfaces';

export const login: IValidationSchema = {
	body: Joi.object().keys({
		urlStore: Joi.string().required(),
		pass: Joi.string().required()
	})
};

export const vtexStep: IValidationSchema = {
	body: Joi.object().keys({
		apiKey: Joi.string().required(),
		apiPass: Joi.string().required(),
		urlStore: Joi.string().required()
	})
};
