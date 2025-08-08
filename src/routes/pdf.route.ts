import express from 'express';
import { catchAsync, validateMiddleware } from 'conexa-core-server';
import validationPDF from '../validations/print.validation';
import { MergeDocuments, printDocument } from '../controllers/pdf.controller';

const router = express.Router();

router.post('/print', [validateMiddleware(validationPDF.createPDF)], catchAsync(printDocument));
router.post('/merge', [validateMiddleware(validationPDF.mergePDFs)], catchAsync(MergeDocuments));

export default router;
