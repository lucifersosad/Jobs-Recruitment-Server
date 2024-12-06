import { Router } from "express";
import * as controller from "../../controllers/admins/seed.controller";

const router: Router = Router();

router.get('/', controller.seedData);


export const seedRoutes: Router = router