import { Router } from "express";
import fileUpload from "express-fileupload"
import * as controller from "../../controllers/clients/myCv.controller";
import * as authMiddlewares from "../../middlewares/clients/auth.middleware"
import * as uploadAws from "../../middlewares/clients/uploadAws.middleware"


const router : Router = Router();
const FileUpload = fileUpload()

router.get('/:id', controller.getMyCv)
router.post('/:id/file', controller.getMyCvFile)
router.post('/', authMiddlewares.auth, controller.createMyCv)
router.get('/:id/download', controller.downloadMyCv)
router.post('/extract', FileUpload, uploadAws.uploadPdf, controller.extractCv)
export const myCvsRoutes : Router  = router