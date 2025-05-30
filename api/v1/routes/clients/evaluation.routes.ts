import { Router } from "express";
//Xíu phải tạo file Control mới có file controller này
import * as controller from "../../controllers/clients/evaluation.controller";
import * as authMiddlewares from "../../middlewares/clients/auth.middleware"
import fileUpload from "express-fileupload"

const router : Router = Router();
const FileUpload = fileUpload()

router.get('/:id', controller.getEvaluation)
router.post('', controller.evaluateCV)
router.post('/check', controller.checkEvaluateCV)
export const evaluationRoutes : Router  = router