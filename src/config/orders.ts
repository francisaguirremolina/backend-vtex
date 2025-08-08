import { OcaStatuses, IOcaOrderStatus } from '../interfaces/oca.interfaces';

export const orderStatuses: Record<OcaStatuses, IOcaOrderStatus> = {
	[OcaStatuses.CANCELED]: {
		code: 'ERROR',
		description: 'Cancelado'
	},
	[OcaStatuses.PENDING]: {
		code: 'PENDING',
		description: 'Por crear'
	},
	[OcaStatuses.CREATED]: {
		code: 'CREATED',
		description: 'Creado'
	},
	[OcaStatuses.WITHDRAWN]: {
		code: 'COLLECTED',
		description: 'Retirado'
	},
	[OcaStatuses.ADMITTED]: {
		code: 'COLLECTED',
		description: 'Retirado'
	},
	[OcaStatuses.PROCESSED]: {
		code: 'COLLECTED',
		description: 'Retirado'
	},
	[OcaStatuses.IN_TRANSIT_TO_DESTINATION_BRANCH]: {
		code: 'ON_ROUTE',
		description: 'En camino'
	},
	[OcaStatuses.RECEIVED_AT_DESTINATION_BRANCH]: {
		code: 'AT_STORE',
		description: 'En sucursal'
	},
	[OcaStatuses.AWAITING_PICKUP_AT_BRANCH]: {
		code: 'AT_STORE',
		description: 'En sucursal'
	},
	[OcaStatuses.SCHEDULED_FOR_VISIT]: {
		code: 'AT_STORE',
		description: 'En sucursal'
	},
	[OcaStatuses.ON_THE_WAY]: {
		code: 'AT_STORE',
		description: 'En sucursal'
	},
	[OcaStatuses.DELIVERED]: {
		code: 'DELIVERED',
		description: 'Entregado'
	},
	[OcaStatuses.NOT_DELIVERED]: {
		code: 'ERROR',
		description: 'No Entregado'
	},
	[OcaStatuses.SCHEDULED_FOR_RETURN]: {
		code: 'RETURNED',
		description: 'En devolución'
	}
};
