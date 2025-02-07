import { Router } from "express";
import * as controller from "../../controllers/admins/admins-user.controller";
import * as validates from "../../validates/admins/admins.validate";
import * as middleware from "../../middlewares/admins/auth.middleware";
const router: Router = Router();

router.get("/", controller.index);
router.post("/login", validates.login, controller.login);
router.post("/authen", validates.authen, controller.authen);
router.post("/info", middleware.auth, controller.info);
router.post("/create", middleware.auth, validates.create, controller.create);
router.patch("/edit/:id", middleware.auth, validates.edit, controller.edit);
router.delete("/delete/:id", middleware.auth, controller.deleteAdmin);
//Thay đổi trạng thái dữ liệu
router.patch(
  "/change-status/:id",
  middleware.auth,
  validates.editStatus,
  controller.changeStatus
);
router.patch("/change-multi", middleware.auth, controller.changeMulti);

export const adminRoutes: Router = router;
