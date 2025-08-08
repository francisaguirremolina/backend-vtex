import { Joi } from 'conexa-core-server';

const createPDF = {
	body: Joi.object().keys({
		file: Joi.string().required()
	})
};

const mergePDFs = {
	body: Joi.object().keys({
		files: Joi.array().items(Joi.string()).required()
	})
};

export default {
	createPDF,
	mergePDFs
};
