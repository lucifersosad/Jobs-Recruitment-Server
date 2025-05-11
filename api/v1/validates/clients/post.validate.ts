import { body, param } from "express-validator";

export const getPosts = [
  param("employerId").isMongoId().withMessage("ID employer không hợp lệ"),
];

export const likePost = [
  param("postId").isMongoId().withMessage("ID bài viết không hợp lệ"),
];

export const commentOnPost = [
  param("postId").isMongoId().withMessage("ID bài viết không hợp lệ"),
  body("content").notEmpty().withMessage("Nội dung bình luận không được để trống"),
];

export const getPostDetail = [
  param("postId").isMongoId().withMessage("ID bài viết không hợp lệ"),
];

export const getPostComments = [
  param("postId").isMongoId().withMessage("ID bài viết không hợp lệ"),
];

export const checkLikeStatus = [
  body("postIds").isArray().withMessage("postIds phải là một mảng"),
  body("postIds.*").isMongoId().withMessage("ID bài viết không hợp lệ"),
];

export const checkEmployerPostsLikeStatus = [
  param("employerId").isMongoId().withMessage("ID nhà tuyển dụng không hợp lệ"),
];
