declare global {
	namespace Express {
		interface Request {}

		interface Response {
			locals: any;
			statusCode: any;
			success: boolean;
			status: any;
			message: any;
		}
	}
}
