import { decode } from 'html-entities';
import { handlerHttpResponse } from 'conexa-core-server';
import httpStatus from 'http-status';
import { Request, Response } from 'express';
import { generatePDFString, mergePdfBuffers } from '../services/pdf.service';
import { getBuffers } from '../utils/format.util';

export async function printDocument(req: Request, res: Response) {
	const { file } = req.body;
	const data = await generatePDFString(decode(file));
	const statusCode = httpStatus.CREATED;

	return handlerHttpResponse(res, { data, statusCode, message: httpStatus[statusCode] });
}

export async function MergeDocuments(req: Request, res: Response) {
	const { files } = req.body;
	const buffers = getBuffers(files);
	const data = await mergePdfBuffers(buffers);
	const statusCode = httpStatus.CREATED;

	return handlerHttpResponse(res, { data, statusCode, message: httpStatus[statusCode] });
}
