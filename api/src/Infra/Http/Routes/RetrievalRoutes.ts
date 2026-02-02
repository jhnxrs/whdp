import { Router } from "express";
import { GetUserAggregatedViewsController, GetUserHistoricalMetricsController, GetUserRecentMetricsController } from "src/Infra/Http/Controllers/RetrievalController";
import { AuthenticationMiddleware } from "src/Infra/Http/Middleware/Authentication";

const router = Router();

router.get("/recent", AuthenticationMiddleware, GetUserRecentMetricsController);
router.get("/history/:metricCode", AuthenticationMiddleware, GetUserHistoricalMetricsController);
router.get("/aggregated", AuthenticationMiddleware, GetUserAggregatedViewsController);

export default router;