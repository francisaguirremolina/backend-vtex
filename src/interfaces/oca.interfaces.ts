import { OperativeDetail } from 'oca-package/dist/interface/config.interface';
import {
	CreateShipmentError,
	CreateShipmentResponse,
	CreateShipmentXML,
	DestinationToXML,
	Ecommerce,
	ErrorCodeMessage,
	OriginToXML,
	Rate,
	Shipment
} from 'oca-package/dist/interface/oca.interface';

export type OcaDays = 'LUN' | 'MAR' | 'MIE' | 'JUE' | 'VIE' | 'VIER' | 'SAB';

export type ServicesAvailable = 'admission' | 'delivery';

type OfficeHours = { day: number; start: string; end: string };

type Address = {
	address?: string;
	province: string;
	locality: string;
	city?: string;
	number: number;
	street: string;
	postalCode: number;
	latitude?: string;
	longitude?: string;
};

export type AdmissionPackageBranch = {
	name: string;
	type: string;
	impositionCenterId: string;
	phone?: string;
	officeHours?: Array<OfficeHours>;
	address: Address;
};

export type DeliveryPackageBranch = Required<AdmissionPackageBranch>;

/** Shipment interfaces */
export { ErrorCodeMessage as SDKErrorCodes };
export interface IShipmentData extends Shipment {}
export interface ICreateShipmentError extends CreateShipmentError {}
export interface ICreateShipmentResponse extends CreateShipmentResponse {
	orderNumber?: string;
}
// Shipment Data
export { Ecommerce };
export interface IOriginToXML extends OriginToXML {}
export interface IDestinationToXML extends DestinationToXML {}
export interface ICreateShipmentXML extends CreateShipmentXML {}

// Webhooks
export interface IShippingRatesWebhook {
	message: string;
	idProducto: string;
}

// Rates
export interface IRate extends Rate {}

export interface IOperativeDetail extends OperativeDetail {}

// Pickup Points
export interface IOcaPickupPoint {
	IdCentroImposicion: string;
	Sigla: string;
	Sucursal: string;
	Calle: string;
	Numero: string;
	Torre: string;
	Piso: string;
	Depto: string;
	Localidad: string;
	CodigoPostal: string;
	Provincia: string;
	Telefono: string;
	Latitud: string;
	Longitud: string;
	TipoAgencia: string;
	HorarioAtencion: string;
	SucursalOCA: string;
	Servicios: {
		Servicio: {
			IdTipoServicio: string;
			ServicioDesc: string;
		}[];
	};
}

export enum PrefixTag {
	OCA = 'OCA',
	LOCKER = 'OCA-LOCKER'
}

export enum OcaStatuses {
	// CONEXA STATUS
	CANCELED = '-1', // TODO:  Define the correct value for CANCELED instead of using '-1'.
	PENDING = '0',
	// OCA STATUS
	CREATED = '1',
	WITHDRAWN = '2',
	ADMITTED = '3',
	PROCESSED = '4',
	IN_TRANSIT_TO_DESTINATION_BRANCH = '5',
	RECEIVED_AT_DESTINATION_BRANCH = '6',
	AWAITING_PICKUP_AT_BRANCH = '7',
	SCHEDULED_FOR_VISIT = '8',
	ON_THE_WAY = '9',
	DELIVERED = '10',
	NOT_DELIVERED = '11',
	SCHEDULED_FOR_RETURN = '12'
}

export interface IOcaOrderStatus {
	code: string;
	description: string;
}
