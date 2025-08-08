import { Joi } from 'conexa-core-server';
import { IValidationSchema } from '../lib/conexa-core/interfaces/validation.interfaces';

export const vtex: IValidationSchema = {
	body: Joi.object().keys({
		vtexUrl: Joi.string().required(),
		vtexKey: Joi.string().required(),
		vtexToken: Joi.string().required()
	})
};
// OCA
export const carrier: IValidationSchema = {
	body: Joi.object().keys({
		userId: Joi.string().required(),
		email: Joi.string().required(),
		accountNumber: Joi.string().required(),
		password: Joi.string().required()
	})
};

export const operational: IValidationSchema = {
	body: Joi.object().keys({
		doorToDoor: Joi.number().required(),
		doorToStore: Joi.number().required(),
		storeToStore: Joi.number().required(),
		storeToDoor: Joi.number().required()
	})
};

export const dispatch: IValidationSchema = {
	body: Joi.object().keys({
		branch: Joi.number().required(),
		address: Joi.number().required(),
		packageCollectionDay: Joi.number().required(),
		schedule: Joi.number().required()
	})
};

export const nearbyStores: IValidationSchema = {
	query: Joi.object().keys({
		userId: Joi.string().required(),
		postalCode: Joi.string().required()
	})
};
