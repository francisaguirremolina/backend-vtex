import { Browser, chromium } from 'playwright';

let browser: Browser;

async function getBrowserInstance() {
	if (!browser) {
		browser = await chromium.launch();
	}

	return browser;
}

export async function getPageInstance() {
	const currentBrowser = await getBrowserInstance();
	const page = await currentBrowser.newPage();

	return {
		page,
		async closePage() {
			await page.close();
		}
	};
}
