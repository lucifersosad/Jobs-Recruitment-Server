import { Router } from "express";
import * as controller from "../../controllers/employers/notification.controller";
import * as validates from "../../validates/employers/jobs.validate";
const router: Router = Router();

router.get("/", controller.index);

export const notificationRoutes: Router = router;
