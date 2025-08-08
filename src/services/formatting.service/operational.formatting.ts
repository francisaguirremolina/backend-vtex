import { Operationals } from 'oca-package/dist/interface/oca.interface';
import { IUserDocument, OperativaInterface } from '../../interfaces';

export const formatOperationalsToFront = (
	user: IUserDocument,
	operationals: Operationals[] = []
): OperativaInterface[] => {
	const { operational: userOperationals } = user;

	return operationals.map((element) => {
		const accountNumber = element.description.split('-')[0]?.trim() as string;
		const accountType = element.description;
		const operationalExists = userOperationals.find((r) => r.accountNumber === accountNumber);
		const selected = operationalExists ? operationalExists.selected : false;

		return {
			accountNumber,
			accountType,
			selected,
			dockIds: operationalExists?.dockIds || []
		};
	});
};
