import { Joi } from 'conexa-core-server';
import 'dotenv/config';

const envVarsSchema = Joi.object()
	.keys({
		NODE_ENV: Joi.string().valid('production', 'development', 'test').required(),
		PORT: Joi.number().default(3000),
		MONGODB_URL: Joi.string().required().description('Mongo DB url'),
		API_URL: Joi.string().required().description('API url'),
		FRONTEND_URL: Joi.string().required().description('Frontend url'),
		CRYPTOJS_SECRET_KEY: Joi.string().required().description('CryptoJS key'),
		JWT_SECRET: Joi.string().required().description('Json Web Token secret'),
		RECIPIENT_EMAIL: Joi.string().required().description('Recipient email'),
		NODEMAILER_EMAIL: Joi.string().required().description('Nodemailer email'),
		NODEMAILER_PASSWORD: Joi.string().required().description('Nodemailer password'),
		NODEMAILER_SERVICE: Joi.string().required().description('Nodemailer service'),
		NODEMAILER_HOST: Joi.string().required().description('Nodemailer host'),
		NODEMAILER_PORT: Joi.string().required().description('Nodemailer port'),
		// force prod oca api
		OCA_FORCE_PROD: Joi.boolean().required().description('Boolean to choose url')
	})
	.unknown();

const { value: envVars, error } = envVarsSchema.prefs({ errors: { label: 'key' } }).validate(process.env);

if (error) {
	throw new Error(`Config validation error: ${error.message}`);
}

const config = {
	apiVersion: 'v1',
	env: envVars.NODE_ENV,
	port: envVars.PORT,
	cryptojsKey: envVars.CRYPTOJS_SECRET_KEY,
	jwtSecret: envVars.JWT_SECRET,
	mongoose: {
		url: envVars.MONGODB_URL + (envVars.NODE_ENV === 'test' ? '-test' : ''),
		options: {
			useCreateIndex: true,
			useNewUrlParser: true,
			useUnifiedTopology: true
		}
	},
	api: {
		url: envVars.API_URL.replaceAll('"', ''),
		oca: {
			forceProd: envVars.OCA_FORCE_PROD
		}
	},
	frontendUrl: envVars.FRONTEND_URL,
	urlWebhookOca: envVars.URL_WEBHOOK_OCA,
	ORIGIN_STORE_NAME: envVars.URL_WEBHOOK_OCA,
	originStoreName: envVars.ORIGIN_STORE_NAME,
	apiemail: {
		recipientEmail: envVars.RECIPIENT_EMAIL || 'leandro@conexa.ai'
	}
};

export default config;
