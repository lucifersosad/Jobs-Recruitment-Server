import { Post } from "../../../../models/post.model";
import { Request, Response } from "express";
import { Comment } from "../../../../models/comment.model";
import { timeAgo } from "../../../../helpers/timeHelper";

export const getEmployerPosts = async (req: Request, res: Response) => {
  try {
    const { employerId } = req.params;

    if (!employerId) {
      return res.status(400).json({ message: "Thiếu ID nhà tuyển dụng" });
    }

    const posts = await Post.find({ employerId }).sort({ createdAt: -1 });

    res.status(200).json(
      posts.map((post) => ({
        id: post._id,
        caption: post.caption,
        images: post.images,
        likes: post.likes.length,
        timeAgo: timeAgo(post.createdAt),
      }))
    );
  } catch (error) {
    console.error("Lỗi khi lấy danh sách bài viết:", error);
    res.status(500).json({ message: "Lỗi server, vui lòng thử lại sau." });
  }
};
  

// **Like bài viết**
export const likePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Bài viết không tồn tại" });
    }

    // Kiểm tra xem user đã like chưa
    const hasLiked = post.likes.includes(userId);
    if (hasLiked) {
      post.likes = post.likes.filter(id => id.toString() !== userId.toString());
    } else {
      post.likes.push(userId);
    }

    await post.save();
    res.status(200).json({ message: hasLiked ? "Bỏ like bài viết" : "Đã like bài viết", likes: post.likes.length });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi like bài viết", error });
  }
};

// **Bình luận bài viết**
export const commentOnPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;
    const userId = req.user._id;

    if (!content.trim()) {
      return res.status(400).json({ message: "Nội dung bình luận không được để trống" });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Bài viết không tồn tại" });
    }

    const newComment = await Comment.create({ postId, userId, content });

    res.status(201).json({ message: "Bình luận thành công", comment: newComment });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi bình luận bài viết", error });
  }
};
