import { Router } from "express";

import * as controller from "../../controllers/clients/myCv.controller";
import * as authMiddlewares from "../../middlewares/clients/auth.middleware"

const router : Router = Router();

router.get('/:id', controller.getMyCv)
router.post('/', authMiddlewares.auth, controller.createMyCv)
router.get('/:id/download', controller.downloadMyCv)
export const myCvsRoutes : Router  = router