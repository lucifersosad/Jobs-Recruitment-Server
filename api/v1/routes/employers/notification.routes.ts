import { Router } from "express";
import * as controller from "../../controllers/employers/notification.controller";
import * as authMiddlewares from "../../middlewares/employers/auth.middleware"
const router: Router = Router();

router.get("/", authMiddlewares.auth, controller.index);
router.post("/read/:id", authMiddlewares.auth, controller.read);
router.post("/read-all", authMiddlewares.auth, controller.readAll);
router.get("/count-unread", authMiddlewares.auth, controller.countUnreadNoti);

export const notificationRoutes: Router = router;
