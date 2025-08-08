// @ts-expect-error: INTERFACE
import { merge } from 'merge-pdf-buffers';
import { getPageInstance } from '../lib/browser.instance';

export async function generatePDFString(file: string) {
	const { page, closePage } = await getPageInstance();

	try {
		await page.setContent(file);
		await page.emulateMedia({ media: 'screen' });

		const pdf = await page.pdf({ preferCSSPageSize: true });

		return pdf.toString('base64');
	} finally {
		await closePage();
	}
}

export async function mergePdfBuffers(buffers: Buffer[]) {
	const merged = await merge(buffers);

	return merged.toString('base64');
}
