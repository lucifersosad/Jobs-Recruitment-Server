import { Router } from "express";
import * as controller from "../../controllers/common/school.controller";

const router: Router = Router();

router.get("/", controller.index);

export const schoolRoutes: Router = router;