import { Router } from "express";
import fileUpload from "express-fileupload"
import * as controller from "../../controllers/employers/myCv.controller";


const router : Router = Router();
const FileUpload = fileUpload()

router.post('/:id/file', controller.getMyCvFile)
router.post('/evaluate', controller.evaluateMyCv)
export const myCvsRoutes : Router  = router