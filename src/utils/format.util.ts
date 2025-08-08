export function getBuffers(files: string[]) {
	return files.map((file) => Buffer.from(file, 'base64'));
}
