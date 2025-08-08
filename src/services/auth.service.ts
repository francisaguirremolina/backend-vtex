import jwt from 'jsonwebtoken';

import config from '../config/config';

export const getAuthToken = (userId: string): string => {
	const { jwtSecret } = config;

	const authToken = jwt.sign({ userId }, jwtSecret, { expiresIn: '24h' });
	return authToken;
};
