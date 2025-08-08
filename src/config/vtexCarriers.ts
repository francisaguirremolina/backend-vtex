export const getBusinessHours = () => {
	return [...Array(7).keys()].map((dayOfWeek) => ({
		dayOfWeek,
		openingTime: '09:00:00',
		closingTime: '21:00:00'
	}));
};
