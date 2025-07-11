import { Router } from "express";
//Xíu phải tạo file Control mới có file controller này
import * as controller from "../../controllers/clients/users-user.controller";
import * as validates from "../../validates/clients/users.validate"
import * as authMiddlewares from "../../middlewares/clients/auth.middleware"
import * as uploadDriver from "../../middlewares/admins/uploadDriver.middleware"
import * as uploadAws from "../../middlewares/clients/uploadAws.middleware"
import fileUpload from "express-fileupload"

const router : Router = Router();
const FileUpload = fileUpload()

router.post('/register',validates.register,controller.register )
router.post('/login',validates.login,controller.login)
router.post('/authen',validates.authen,controller.authen)
router.post('/password/forgot',validates.forgotPassword,controller.forgotPassword)
router.post('/password/check-token',validates.checkToken,controller.checkToken)
router.post('/password/reset',validates.resetPassword,controller.resetPassword)

router.post('/device-session',validates.authen,controller.authen)

router.post('/detail',authMiddlewares.auth,controller.detail)
router.post('/list',authMiddlewares.auth,controller.list)
router.post('/change-password',authMiddlewares.auth,validates.changePassword,controller.changePassword)
router.post('/change-info-user',authMiddlewares.auth,validates.changeInfoUser,controller.changeInfoUser)
router.post('/recruitment-job',authMiddlewares.auth,validates.recruitmentJob,uploadDriver.uplloadReactPdf,controller.recruitmentJob)
router.post('/save-job',authMiddlewares.auth,validates.saveJob,controller.saveJob)

router.post('/change-job-suggestions',authMiddlewares.auth,validates.changeJobSuggestions,controller.changeJobSuggestions)
router.post('/change-email-suggestions',authMiddlewares.auth,validates.changeEmailSuggestions,controller.changeEmailSuggestions)

router.post('/allow-setting-user',authMiddlewares.auth,validates.allowSettingUser,controller.allowSettingUser)
router.post('/upload-avatar',authMiddlewares.auth,uploadDriver.uplloadReact,controller.uploadAvatar)
router.post('/upload-cv',authMiddlewares.auth,validates.uploadCv,uploadDriver.uplloadReactPdf,controller.uploadCv)
router.get('/get-cv-user',authMiddlewares.auth,controller.getCvByUser)
router.post('/edit-cv-user',authMiddlewares.auth,validates.editCvByUser,controller.editCvByUser)

router.get('/get-profile/:id', controller.getProfile)
router.post('/upload-image', FileUpload, controller.uploadImage)
router.post('/update-education', authMiddlewares.auth, controller.updateEducation)
router.post('/update-experience', authMiddlewares.auth, controller.updateExperience)
router.post('/update-skill', authMiddlewares.auth, controller.updateSkill)
router.post('/update-profile', authMiddlewares.auth, controller.updateProfile)
router.post('/upload-cv-2', authMiddlewares.auth, FileUpload, uploadAws.uploadPdf, controller.uploadCv2)
export const usersRoutes : Router  = router