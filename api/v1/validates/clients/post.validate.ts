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
