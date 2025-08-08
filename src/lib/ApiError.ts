class ApiError extends Error {
	success: boolean;

	statusCode: number;

	code?: string;

	constructor(statusCode: number, message: string, code?: string) {
		super(message);
		this.statusCode = statusCode;
		this.success = false;
		this.code = code || String(statusCode);
	}
}

export default ApiError;
