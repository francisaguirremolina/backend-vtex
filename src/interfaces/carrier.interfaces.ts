export interface WebhookOCA {
	nroDocCliente: string;
	nroEnvio: string;
	idEstado: string;
	estado: string;
	idMotivo: string;
	motivo: string;
	fecha: string;
	sucursal: null;
	datosReceptor: null;
}

export interface PointsWebhookOCA {
	CentrosDeImposicion: {
		Centro: {
			message: string;
			IdCentroImposicion: number;
			TipoAgencia: string;
			SucursalOCA: string;
			StatusABM: number;
		};
	};
}
