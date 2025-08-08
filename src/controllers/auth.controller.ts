import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { catchAsync } from 'conexa-core-server';
import ApiError from '../lib/ApiError';
import * as authService from '../services/auth.service';
import { getUserByVtexUrl } from '../services/db.service';
import { timeSafeEqual } from '../utils/misc';
import * as carrierService from '../services/carrier.service';

export const login = catchAsync(
	async (req: Request<{}, {}, { urlStore: string; pass: string }>, res: Response) => {
		const { urlStore, pass } = req.body;

		const user = await getUserByVtexUrl(urlStore);

		if (!user || !timeSafeEqual(pass, user.password))
			throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid credentials', 'onboarding.invalid-credentials');

		await carrierService.getOperationalByUser('https://ocapartnerar.myvtex.com', 'QA123456');

		const { _id: userId } = user;
		const token = authService.getAuthToken(userId.toString());

		res.json({
			success: true,
			token,
			userId,
			code: 'auth.user-authenticated'
		});
	}
);

export const refreshToken = catchAsync(async (req: Request, res: Response) => {
	const token = authService.getAuthToken(req.userId);

	res.status(200).json({
		success: true,
		message: 'Token renovado correctamente.',
		token
	});
});
