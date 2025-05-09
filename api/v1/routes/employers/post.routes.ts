import { Router } from "express";
import * as controller from "../../controllers/employers/post.controller";
import * as validates from "../../validates/employers/post.validate";
import multer from "multer";
const upload = multer(); 
const router: Router = Router();

router.get("/my-posts", controller.getMyPosts);
router.get("/liked-list/:postId", controller.getLikes);
router.post("/create", upload.fields([{ name: "images", maxCount: 10 }]), validates.createPost, controller.createPost);
router.patch("/update/:id", validates.updatePost, controller.updatePost);
router.post("/:postId/comment/:commentId/reply",validates.replyToComment, controller.replyToComment);
router.delete("/delete/:id", controller.deletePost);

export const postRoutes: Router = router;
