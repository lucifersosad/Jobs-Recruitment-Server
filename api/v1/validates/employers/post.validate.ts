import { body, param } from "express-validator";

export const createPost = [
  body("caption")
    .notEmpty()
    .withMessage("Nội dung bài viết không được để trống"),
  body("images").isArray().withMessage("Hình ảnh phải là một mảng"),
];

export const updatePost = [
  param("id").isMongoId().withMessage("ID bài viết không hợp lệ"),
  body("caption").optional().notEmpty().withMessage("Nội dung không hợp lệ"),
  body("images").optional().isArray().withMessage("Hình ảnh không hợp lệ"),
];

export const replyToComment = [
  param("commentId").isMongoId().withMessage("ID bình luận không hợp lệ"),
  body("postId").isMongoId().withMessage("postId không hợp lệ"),
  body("content").notEmpty().withMessage("Nội dung phản hồi không được để trống"),
];

export const getLikes = [
  param("postId").isMongoId().withMessage("ID bài viết không hợp lệ"),
];


export const deletePost = [
  param("id").isMongoId().withMessage("ID bài viết không hợp lệ"),
];
