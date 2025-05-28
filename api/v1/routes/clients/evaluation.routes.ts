import { Router } from "express";
//Xíu phải tạo file Control mới có file controller này
import * as controller from "../../controllers/clients/evaluation.controller";
import * as authMiddlewares from "../../middlewares/clients/auth.middleware"
import fileUpload from "express-fileupload"

const router : Router = Router();
const FileUpload = fileUpload()

router.post('', authMiddlewares.auth, controller.evaluateCV)
export const evaluationRoutes : Router  = router