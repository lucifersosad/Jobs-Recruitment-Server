import { Router } from "express";

import * as controller from "../../controllers/employers/auth.controller";
import * as validates from "../../validates/employers/employers-user.validate"

const router : Router = Router();

router.post('/register',validates.register,controller.register )
router.post('/login',validates.login,controller.login )

export const employerAuthRoutes : Router  = router