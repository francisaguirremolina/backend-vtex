import { IDispatchSettings } from './dispatch.interfaces';
import { PackageSettings } from './panel.interfaces';
import { OperativaInterface } from './user.interfaces';

export interface InitialState {
	userId?: string;
	storeUrl: string;
	packageSettings: PackageSettings;
	dispatchSettings: IDispatchSettings;
	shippingSettings?: OperativaInterface[];
}
