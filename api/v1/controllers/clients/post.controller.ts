import { Post } from "../../../../models/post.model";
import { Request, Response } from "express";
import { Comment } from "../../../../models/comment.model";
import { timeAgo } from "../../../../helpers/timeHelper";
import mongoose from "mongoose";

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

// **Chi tiết bài viết**
export const getPostDetail = async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;

    if (!postId) {
      return res.status(400).json({ message: "Thiếu ID bài viết" });
    }

    const post = await Post.findById(postId)
      .populate("employerId", "companyName logo")
      .populate({
        path: "likes",
        select: "fullname avatar"
      });

    if (!post) {
      return res.status(404).json({ message: "Bài viết không tồn tại" });
    }

    // Lấy số lượng comment của bài viết
    const commentCount = await Comment.countDocuments({ postId });

    const result = {
      id: post._id,
      employerId: post.employerId,
      caption: post.caption,
      images: post.images,
      likes: post.likes,
      likesCount: post.likes.length,
      commentsCount: commentCount,
      timeAgo: timeAgo(post.createdAt),
      createdAt: post.createdAt,
    };

    res.status(200).json(result);
  } catch (error) {
    console.error("Lỗi khi lấy chi tiết bài viết:", error);
    res.status(500).json({ message: "Lỗi server, vui lòng thử lại sau." });
  }
};

// **Lấy tất cả bình luận của bài viết**
export const getPostComments = async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;

    if (!postId) {
      return res.status(400).json({ message: "Thiếu ID bài viết" });
    }

    const comments = await Comment.find({ postId })
      .populate("userId", "fullname avatar")
      .sort({ createdAt: -1 });

    const formattedComments = comments.map(comment => ({
      id: comment._id,
      content: comment.content,
      userId: comment.userId,
      timeAgo: timeAgo(comment.createdAt),
      parentCommentId: comment.parentCommentId,
    }));

    res.status(200).json(formattedComments);
  } catch (error) {
    console.error("Lỗi khi lấy danh sách bình luận:", error);
    res.status(500).json({ message: "Lỗi server, vui lòng thử lại sau." });
  }
};

// **Kiểm tra trạng thái đã like các bài viết**
export const checkLikeStatus = async (req: any, res: Response) => {
  try {
    const { postIds } = req.body;
    const userId = req.user._id;

    if (!postIds || !Array.isArray(postIds)) {
      return res.status(400).json({ message: "Danh sách ID bài viết không hợp lệ" });
    }

    // Chuyển đổi string IDs sang ObjectIds
    const validPostIds = postIds.filter(id => mongoose.Types.ObjectId.isValid(id))
      .map(id => new mongoose.Types.ObjectId(id));

    // Tìm tất cả các bài viết có trong danh sách postIds và có userId trong danh sách likes
    const likedPosts = await Post.find({
      _id: { $in: validPostIds },
      likes: userId
    }).select('_id');

    // Tạo đối tượng kết quả với key là postId và value là trạng thái đã like hay chưa
    const result = {};
    validPostIds.forEach(postId => {
      const isLiked = likedPosts.some(post => post._id.toString() === postId.toString());
      result[postId.toString()] = isLiked;
    });

    res.status(200).json(result);
  } catch (error) {
    console.error("Lỗi khi kiểm tra trạng thái like:", error);
    res.status(500).json({ message: "Lỗi server, vui lòng thử lại sau." });
  }
};

// **Kiểm tra trạng thái đã like tất cả bài viết của một nhà tuyển dụng**
export const checkEmployerPostsLikeStatus = async (req: any, res: Response) => {
  try {
    const { employerId } = req.params;
    const userId = req.user._id;

    if (!employerId) {
      return res.status(400).json({ message: "Thiếu ID nhà tuyển dụng" });
    }

    // Lấy tất cả bài viết của nhà tuyển dụng
    const employerPosts = await Post.find({ employerId }).select('_id');
    const postIds = employerPosts.map(post => post._id);
    
    if (postIds.length === 0) {
      return res.status(200).json({});
    }

    // Tìm tất cả các bài viết có trong danh sách postIds và có userId trong danh sách likes
    const likedPosts = await Post.find({
      _id: { $in: postIds },
      likes: userId
    }).select('_id');

    // Tạo đối tượng kết quả với key là postId và value là trạng thái đã like hay chưa
    const result = {};
    postIds.forEach(postId => {
      const isLiked = likedPosts.some(post => post._id.toString() === postId.toString());
      result[postId.toString()] = isLiked;
    });

    res.status(200).json(result);
  } catch (error) {
    console.error("Lỗi khi kiểm tra trạng thái like cho bài viết của nhà tuyển dụng:", error);
    res.status(500).json({ message: "Lỗi server, vui lòng thử lại sau." });
  }
};
