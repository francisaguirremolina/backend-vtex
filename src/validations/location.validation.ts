import { Joi } from 'conexa-core-server';
import { IValidationSchema } from '../lib/conexa-core/interfaces/validation.interfaces';

export const location: IValidationSchema = {
	body: Joi.object().keys({
		location: Joi.object().keys({
			name: Joi.string().required(),
			country: Joi.string().required(),
			countryCode: Joi.string().required().length(3),
			province: Joi.string().required(),
			city: Joi.string().required(),
			street: Joi.string().required(),
			number: Joi.string().required()
		})
	})
};
