import { Router } from "express";
import fileUpload from "express-fileupload"
import * as controller from "../../controllers/clients/myCv.controller";
import * as authMiddlewares from "../../middlewares/clients/auth.middleware"
import * as uploadAws from "../../middlewares/clients/uploadAws.middleware"


const router : Router = Router();
const FileUpload = fileUpload()

router.get('/', authMiddlewares.auth, controller.getMyCvs)
router.get('/:id', authMiddlewares.auth, controller.getMyCv)
router.get('/:id/file', authMiddlewares.auth, controller.getMyCvFile)
router.patch('/edit', authMiddlewares.auth, controller.editMyCv)
router.post('/upload', authMiddlewares.auth, FileUpload, uploadAws.uploadPdf, controller.uploadMyCv)
router.post('/extract', authMiddlewares.auth, FileUpload, uploadAws.uploadPdf, controller.extractCv)
router.post('/', authMiddlewares.auth, controller.createMyCv)
router.get('/:id/download', controller.downloadMyCv)
export const myCvsRoutes : Router  = router