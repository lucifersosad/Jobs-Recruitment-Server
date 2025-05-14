import { Router } from "express";
import * as controller from "../../controllers/employers/post.controller";
import * as validates from "../../validates/employers/post.validate";
import multer from "multer";
const upload = multer(); 
const router: Router = Router();

router.get("/my-posts", controller.getMyPosts);
router.get("/all-comments", controller.getAllPostsComments);
router.get("/my-posts-like-status", controller.checkEmployerPostsLikeStatus);
router.post("/check-like-status", controller.checkLikeStatus);
router.post("/create", upload.fields([{ name: "images", maxCount: 10 }]), validates.createPost, controller.createPost);
router.get("/liked-list/:postId", validates.getLikes, controller.getLikes);
router.get("/:id", validates.getPostById, controller.getPostById);
router.get("/:id/comments", validates.getPostComments, controller.getPostComments);
router.post("/:id/like", validates.likePost, controller.likePost);
router.post("/:id/comment", validates.commentPost, controller.commentPost);
router.post("/:postId/comments/:commentId/reply", validates.replyToComment, controller.replyToComment);
router.patch("/update/:id", upload.fields([{ name: "images", maxCount: 10 }]), validates.updatePost, controller.updatePost);
router.delete("/delete/:id", validates.deletePost, controller.deletePost);

export const postRoutes: Router = router;
