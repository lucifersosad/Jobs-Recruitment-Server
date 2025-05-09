import { Router } from "express";
import * as controller from "../../controllers/clients/post.controller";
import * as validates from "../../validates/clients/post.validate";

const router: Router = Router();



router.get("/get-all/:employerId",validates.getPosts, controller.getEmployerPosts );
router.post("/like/:postId",validates.likePost, controller.likePost);
router.post("/comment/:postId", validates.commentOnPost, controller.commentOnPost);

export const postRoutes: Router = router;
