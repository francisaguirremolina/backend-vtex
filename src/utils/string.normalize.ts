export const normalizeString = (string: string): string => {
	const accentsMap: { [key: string]: string } = {
		á: 'a',
		é: 'e',
		í: 'i',
		ó: 'o',
		ú: 'u',
		Á: 'a',
		É: 'e',
		Í: 'i',
		Ó: 'o',
		Ú: 'u',
		ñ: 'n',
		Ñ: 'n'
	};

	return string
		.split('')
		.map((char) => accentsMap[char] || char) // Replace accented chars
		.join('')
		.replace(/[^\w\s]/g, ''); // Remove special characters except alphanumeric and space
};
