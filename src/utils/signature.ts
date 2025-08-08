import CryptoJS from 'crypto-js';
import config from '../config/config';
/**
 * Generates an HMAC-SHA256 signature.
 * @param {string} value - The value for which the signature will be generated.
 * @param {string} key - The secret key used in the HMAC algorithm.
 * @returns {string} - The generated signature in hexadecimal format.
 */
export function getSignature(value: string) {
	return CryptoJS.HmacSHA256(value, config.cryptojsKey).toString();
}
