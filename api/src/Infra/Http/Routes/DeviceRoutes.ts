import { Router } from "express";
import { AssignDeviceToUserController, CreateDeviceController, GetAssignmentHistoryController, GetUserDevicesController, UnassignDeviceToUserController } from "src/Infra/Http/Controllers/DeviceController";
import { AuthenticationMiddleware } from "src/Infra/Http/Middleware/Authentication";

const router = Router();

router.post("/", AuthenticationMiddleware, CreateDeviceController);
router.get("/", AuthenticationMiddleware, GetUserDevicesController);
router.post("/:deviceId/assign", AuthenticationMiddleware, AssignDeviceToUserController);
router.post("/:deviceId/unassign", AuthenticationMiddleware, UnassignDeviceToUserController);
router.get("/:deviceId/history", AuthenticationMiddleware, GetAssignmentHistoryController);

export default router;