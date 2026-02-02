import { Router } from "express";
import { IngestDataController } from "src/Infra/Http/Controllers/IngestionController";
import { AuthenticationMiddleware } from "src/Infra/Http/Middleware/Authentication";

const router = Router();

router.post("/", AuthenticationMiddleware, IngestDataController);

export default router;