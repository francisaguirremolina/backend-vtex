import { Request, Response, NextFunction } from 'express';

export function deleteSpaces(req: Request<{}, {}, Record<string, any>>, _res: Response, next: NextFunction) {
	if (req.body && typeof req.body === 'object') {
		// eslint-disable-next-line no-restricted-syntax
		for (const key in req.body) {
			if (typeof req.body[key] === 'string') {
				req.body[key] = req.body[key].trim();
			}
		}
	}
	next();
}
