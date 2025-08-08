export const extractEncryptedEmail = (email: string): string => {
	// FORMATS FROM VTEX:
	// example@example.com-281acb2105af4fd7ba0d36d9593bfb41@ct.vtex.com.br
	// 281acb2105af4fd7ba0d36d9593bfb41@ct.vtex.com.br

	// checks format xx@xx-xx@..vtex..
	const vtexEmailRegex = /^[^@]+@[^-]+-[^-]*vtex[^-]*$/;

	if (vtexEmailRegex.test(email)) return extractEmailFromEmailAliased(email);
	return email;
};

const extractEmailFromEmailAliased = (email: string): string => {
	// example@example.com-281acb2105af4fd7ba0d36d9593bfb41@ct.vtex.com.br
	return email.split('-')[0]!;
};
