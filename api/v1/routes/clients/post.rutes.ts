import { Router } from "express";
import * as controller from "../../controllers/clients/post.controller";
import * as validates from "../../validates/clients/post.validate";
import { auth } from "../../middlewares/clients/auth.middleware";

const router: Router = Router();

router.get("/post/get-all/:employerId", validates.getPosts, controller.getEmployerPosts);
router.post("/post/like/:postId", auth, validates.likePost, controller.likePost);
router.post("/post/comment/:postId", auth, validates.commentOnPost, controller.commentOnPost);

// Thêm các API mới
router.get("/post/detail/:postId", validates.getPostDetail, controller.getPostDetail);
router.get("/post/comments/:postId", validates.getPostComments, controller.getPostComments);
router.post("/post/check-like-status", auth, validates.checkLikeStatus, controller.checkLikeStatus);
router.get("/post/employer-like-status/:employerId", auth, validates.checkEmployerPostsLikeStatus, controller.checkEmployerPostsLikeStatus);

export const postRoutes: Router = router;
