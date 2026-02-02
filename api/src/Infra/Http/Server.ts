import express, { type Express } from "express";
import cors from 'cors';
import IngestionRoutes from './Routes/IngestionRoutes';
import DeviceRoutes from './Routes/DeviceRoutes';
import RetrievalRoutes from './Routes/RetrievalRoutes';
import { ErrorHandler } from "src/Infra/Http/Middleware/ErrorHandler";

export function createServer(): Express {
	const app = express();

	app.use(express.json({ limit: "10mb" }));
	app.use(express.urlencoded({ extended: true }));
	app.use(cors());

	app.use("/v1/ingestion", IngestionRoutes);
	app.use("/v1/device", DeviceRoutes);
	app.use("/v1/retrieval", RetrievalRoutes);

	app.use((_req, res) => {
		res.status(404).json({
			success: false,
			error: {
				message: "Not found",
				code: 404,
			},
		});
	});

	app.use(ErrorHandler);

	return app;
}
