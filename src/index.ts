import { Logger } from 'conexa-core-server';
import { Server } from 'http';
import mongoose from 'mongoose';
import app from './app';
import config from './config/config';

let server: Server;

async function initServer() {
	mongoose.set('strictQuery', true);
	await mongoose.connect(config.mongoose.url);
	Logger.debug('Connected to Database successfully.');
	await mongoose.syncIndexes();
	Logger.debug('Indexes synchronized successfully.');
	server = app.listen(config.port, () => {
		Logger.debug(`Listening to port ${config.port}`);
	});
}

let shuttingDown = false;
const exitHandler = (error: string) => {
	if (error) Logger.error(error);

	if (shuttingDown) return;
	shuttingDown = true;

	if (!server) {
		Logger.debug(`Aplication shutdown complete.`);
		process.exit(1);
	}
	server.close((shutdownError) => {
		if (shutdownError) Logger.error(shutdownError);

		Logger.debug(`Server shutdown complete.`);

		setTimeout(() => {
			Logger.debug(`Aplication shutdown complete.`);
			process.exit(0);
		}, 10_000);
	});
};

['SIGINT', 'SIGTERM', 'SIGQUIT', 'unhandledRejection', 'uncaughtException'].forEach((signal) =>
	process.on(signal, (error) =>
		exitHandler(error || `Signal received: ${signal}. Shutting down application.`)
	)
);

['disconnected', 'error', 'timeout'].forEach((event) =>
	mongoose.connection.on(event, () =>
		exitHandler(`Database connection event triggered: ${event}. Shutting down application.`)
	)
);

initServer().catch(exitHandler);
