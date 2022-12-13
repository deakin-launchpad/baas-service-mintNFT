import ServerHelper from "./helpers.js";

const initServer = async () => {
	//Create Server
	const server = ServerHelper.createServer();

	//Register All Plugins
	await ServerHelper.registerPlugins(server);

	//Add views
	ServerHelper.addViews(server);

	//Default Routes
	ServerHelper.setDefaultRoute(server);

	// Add routes to Swagger documentation
	ServerHelper.addSwaggerRoutes(server);

	// Bootstrap Application
	// ServerHelper.bootstrap();

	ServerHelper.attachLoggerOnEvents(server);

	// Start Server
	ServerHelper.startServer(server);
};

export const startMyServer = () => {
	ServerHelper.configureLog4js();
	ServerHelper.setGlobalAppRoot();
	process.on("unhandledRejection", (err) => {
		appLogger.fatal(err);
		process.exit(1);
	});

	initServer();
};
