export const centsToMoneyUnit = (amount: number): string => {
	if (!Number(amount)) return '0';
	return (amount / 100).toFixed(2);
};
