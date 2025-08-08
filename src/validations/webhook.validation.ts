import { Joi } from 'conexa-core-server';
import { IValidationSchema } from '../lib/conexa-core/interfaces/validation.interfaces';

// OCA
export const updateShippingRates: IValidationSchema = {
	body: Joi.object().keys({
		message: Joi.string().required(),
		idProducto: Joi.string().required()
	})
};

export const updatePickUpPoint: IValidationSchema = {
	body: Joi.object().keys({
		CentrosDeImposicion: Joi.object()
			.required()
			.keys({
				Centro: Joi.object().keys({
					message: Joi.string(),
					IdCentroImposicion: Joi.number().required(),
					TipoAgencia: Joi.string().required(),
					SucursalOCA: Joi.string().required(),
					StatusABM: Joi.number().required()
				})
			})
	})
};

export const deletePoints: IValidationSchema = {
	query: Joi.object().keys({
		userId: Joi.string().required()
	})
};
