import { Router } from "express";
import * as controller from "../../controllers/admins/seed.controller";

const router: Router = Router();

router.get('/', controller.seedData);
router.get('/user-embedding', controller.seedUserEmbedding);
router.get('/job-embedding', controller.seedJobEmbedding);


export const seedRoutes: Router = router