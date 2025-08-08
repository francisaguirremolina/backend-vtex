import CryptoJS from 'crypto-js';
import config from '../config/config';

export const protectedObject = {
	type: Object,
	get: decryptObject,
	set: encryptObject
};

export const protectedString = {
	type: String,
	get: decryptString,
	set: encryptString
};

function encryptString(dataString: string): string {
	return CryptoJS.AES.encrypt(dataString, config.cryptojsKey).toString();
}

function decryptString(encrypted: string): string {
	return CryptoJS.AES.decrypt(encrypted, config.cryptojsKey).toString(CryptoJS.enc.Utf8);
}

function encryptObject(dataObject: object): string {
	return encryptString(JSON.stringify(dataObject));
}

function decryptObject(encrypted: string): any {
	return JSON.parse(decryptString(encrypted));
}
