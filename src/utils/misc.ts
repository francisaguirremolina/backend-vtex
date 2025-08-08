export const fromNameAndSurnameToFullName = (name: string = '', surname: string = ''): string =>
	`${name} ${surname}`.trim();

export const fromStreetAndNumberToAddress = (street: string = '', number: string = ''): string =>
	`${street} ${number}`.trim();

// returns if an object is empty
export const isEmpty = (object: any) => {
	if (!object) return true;
	return Object.keys(object).length === 0;
};

// Used to avoid timing attacks
//
export const timeSafeEqual = (cad1: string, cad2: string) => {
	let mismatch = 0;
	for (let i = 0; i < cad1.length; i++) {
		mismatch |= cad1.charCodeAt(i) ^ cad2.charCodeAt(i);
	}
	if (cad1.length !== cad2.length) return false;
	return mismatch === 0;
};

export const deleteRepeatedObjectsFromArrays = <T>(array: T[], comparisonProperty: keyof T): T[] => {
	return array.filter(
		(item, index, self) => index === self.findIndex((t) => t[comparisonProperty] === item[comparisonProperty])
	);
};

export const stringIncludesNumber = (string: string) => {
	const regex = /\d+/;
	return regex.test(string);
};
