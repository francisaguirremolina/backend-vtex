/* eslint-disable security/detect-non-literal-fs-filename */
import axios from 'axios';
import { Logger } from 'conexa-core-server';
import fs from 'fs';
import config from '../config/config';

const ENDPOINTEMAILOCA = 'http://www6.oca.com.ar/apimensajeria/api/mensajes';

const sendEmail = async (body: any) => {
	const { data } = await axios(ENDPOINTEMAILOCA, {
		method: 'POST',
		headers: {
			'content-type': 'multipart/form-data',
			apiKey: 'TN-383c03697a092f9e871adb77bb5594b8a5d7cf8d040e7b3582fea2f854a69a61'
		},
		data: body
	});
	Logger.info(JSON.stringify(data));
	if (data.IdEmail === 0) Logger.error(JSON.stringify(data));
};

export const formDataEmail = async (data: any) => {
	const { files, personalData, store } = data;
	const {
		businessName,
		cuit,
		area,
		storeUrl,
		commercialAddress,
		floor,
		department,
		locality,
		province,
		postalCode
	} = JSON.parse(store);
	const { firstName, lastName, phoneNumber, email } = JSON.parse(personalData);

	const storeData = [
		{ nombre: 'RazonSocial', valor: businessName },
		{ nombre: 'CUIT', valor: cuit },
		{ nombre: 'Rubro', valor: area },
		{ nombre: 'URLTienda', valor: storeUrl },
		{ nombre: 'Domicilio', valor: commercialAddress },
		{ nombre: 'Piso', valor: floor },
		{ nombre: 'Depto', valor: department },
		{ nombre: 'Localidad', valor: locality },
		{ nombre: 'Provincia', valor: province },
		{ nombre: 'CodigoPostal', valor: postalCode },
		{ nombre: 'Nombre', valor: firstName },
		{ nombre: 'Apellido', valor: lastName },
		{ nombre: 'Telefono', valor: phoneNumber },
		{ nombre: 'Email', valor: email }
	];
	const fileOne = files[0].path;
	const fileTwo = files[1].path;

	const objectEmail = {
		tipo: 'EMAIL',
		prioridad: 0,
		variables: JSON.stringify(storeData),
		codigofrecuente: 'MAIL_NuevaCuentaTiendaNube',
		destinatarios: config.apiemail.recipientEmail,
		remitente: email,
		asunto: '[ALTA TIENDANUBE] - Nueva solicitud de alta de cuenta',
		fileOne: fs.createReadStream(fileOne),
		fileTwo: fs.createReadStream(fileTwo)
	};

	const result = await sendEmail(objectEmail);
	const removeFileOne = await removeFile(fileOne);
	Logger.info(removeFileOne);
	const removeFileTwo = await removeFile(fileTwo);
	Logger.info(removeFileTwo);

	return result;
};

const removeFile = async (path: string): Promise<boolean> => {
	try {
		if (fs.existsSync(path)) fs.rmSync(path);
		return true;
	} catch (error) {
		Logger.error(JSON.stringify(error));
		return false;
	}
};
