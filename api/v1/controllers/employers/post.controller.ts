import { Request, Response } from "express";
import { Post } from "../../../../models/post.model";
import { Comment } from "../../../../models/comment.model";
import { timeAgo } from "../../../../helpers/timeHelper";
import { putObject } from "../../../../helpers/uploadToS3Aws";
import Employer from "../../../../models/employers.model";
import Like from "../../../../models/like.model";
import mongoose from "mongoose";



export const getMyPosts = async (req: Request, res: Response) => {
  try {
    const posts = await Post.find({ employerId: req["user"]["_id"] }).sort({ createdAt: -1 });

    res.status(200).json(posts.map(post => ({
      id: post._id,
      caption: post.caption,
      images: post.images,
      likes: post.likes.length,
      timeAgo: timeAgo(post.createdAt),
    })));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Lấy chi tiết một bài viết
export const getPostById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const post = await Post.findById(id)
      .populate({
        path: 'employerId',
        select: 'companyName logo'
      })
      .populate({
        path: "likes",
        select: "fullName avatar"
      });
    
    if (!post) {
      return res.status(404).json({ message: "Bài viết không tồn tại" });
    }

    // Đếm số lượng bình luận
    const commentCount = await Comment.countDocuments({ postId: id });
    
    // Kiểm tra người dùng hiện tại đã thích bài viết chưa
    const userLiked = post.likes.some(user => user._id.toString() === req["user"]["_id"].toString());

    res.status(200).json({
      id: post._id,
      employer: post.employerId,
      caption: post.caption,
      images: post.images,
      likes: post.likes,
      likesCount: post.likes.length,
      commentCount,
      userLiked,
      timeAgo: timeAgo(post.createdAt),
      createdAt: post.createdAt
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Thích/bỏ thích bài viết
export const likePost = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req["user"]["_id"];
    
    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ message: "Bài viết không tồn tại" });
    }
    
    // Kiểm tra xem người dùng đã thích bài viết chưa
    const isLiked = post.likes.includes(userId);
    
    if (isLiked) {
      // Bỏ thích
      await Post.findByIdAndUpdate(id, { $pull: { likes: userId } });
      await Like.findOneAndDelete({ postId: id, userId });
      res.status(200).json({ message: "Đã bỏ thích bài viết", likes: post.likes.length - 1 });
    } else {
      // Thích bài viết
      await Post.findByIdAndUpdate(id, { $addToSet: { likes: userId } });
      await Like.create({ postId: id, userId });
      res.status(200).json({ message: "Đã thích bài viết", likes: post.likes.length + 1 });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Bình luận bài viết
export const commentPost = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req["user"]["_id"];
    
    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ message: "Bài viết không tồn tại" });
    }
    
    if (!content.trim()) {
      return res.status(400).json({ message: "Nội dung bình luận không được để trống" });
    }
    
    const newComment = await Comment.create({
      postId: id,
      userId,
      content,
      parentCommentId: null
    });
    
    const populatedComment = await Comment.findById(newComment._id).populate({
      path: 'userId',
      select: 'fullName avatar'
    });
    
    res.status(201).json({
      comment: {
        id: populatedComment._id,
        content: populatedComment.content,
        userId: populatedComment.userId,
        timeAgo: timeAgo(populatedComment.createdAt),
        parentCommentId: populatedComment.parentCommentId,
      },
      message: "Đã bình luận thành công"
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Lấy danh sách bình luận của bài viết
export const getPostComments = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ message: "Thiếu ID bài viết" });
    }
    
    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ message: "Bài viết không tồn tại" });
    }
    
    // Lấy tất cả comment của bài viết
    const comments = await Comment.find({ postId: id })
      .sort({ createdAt: -1 });
    
    // Phân loại comment và reply
    const parentComments = [];
    const replyComments = [];
    
    comments.forEach(comment => {
      if (comment.parentCommentId) {
        replyComments.push(comment);
      } else {
        parentComments.push(comment);
      }
    });
    
    // Lấy thông tin user cho parent comments
    const populatedParentComments = await Promise.all(
      parentComments.map(async (comment) => {
        const user = await mongoose.model('User').findById(comment.userId).select('fullName avatar');
        return {
          id: comment._id,
          content: comment.content,
          userId: user,
          timeAgo: timeAgo(comment.createdAt),
          parentCommentId: comment.parentCommentId,
          createdAt: comment.createdAt
        };
      })
    );
    
    // Lấy thông tin user hoặc employer cho reply comments
    const populatedReplyComments = await Promise.all(
      replyComments.map(async (comment) => {
        // Kiểm tra xem comment này có phải của employer không
        const post = await Post.findById(comment.postId);
        const isEmployerReply = post && post.employerId.toString() === comment.userId.toString();
        
        let userInfo = null;
        
        if (isEmployerReply) {
          // Nếu là reply của employer
          const employer = await Employer.findById(comment.userId);
          userInfo = employer ? {
            _id: employer._id,
            fullName: employer.companyName || "Nhà tuyển dụng",
            avatar: employer.logoCompany || ""
          } : null;
        } else {
          // Nếu là reply của user thông thường
          userInfo = await mongoose.model('User').findById(comment.userId).select('fullName avatar');
        }
        
        return {
          id: comment._id,
          content: comment.content,
          userId: userInfo,
          timeAgo: timeAgo(comment.createdAt),
          parentCommentId: comment.parentCommentId,
          createdAt: comment.createdAt,
          isEmployerReply: isEmployerReply
        };
      })
    );
    
    // Kết hợp tất cả comments
    const formattedComments = [...populatedParentComments, ...populatedReplyComments];
    
    // Sắp xếp theo thời gian mới nhất
    formattedComments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    res.status(200).json(formattedComments);
  } catch (error) {
    console.error("Lỗi khi lấy bình luận:", error);
    res.status(500).json({ message: error.message });
  }
};

// Kiểm tra trạng thái đã like các bài viết
export const checkLikeStatus = async (req: any, res: Response) => {
  try {
    const { postIds } = req.body;
    const userId = req["user"]["_id"];

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

// Kiểm tra trạng thái đã like tất cả bài viết của một employer
export const checkEmployerPostsLikeStatus = async (req: any, res: Response) => {
  try {
    const employerId = req["user"]["_id"]; // Lấy employerId từ token thay vì từ parameter
    const userId = req["user"]["_id"];

    // Lấy tất cả bài viết của employer
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


export const replyToComment = async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const { content } = req.body;
    const userId = req.user._id;

    if (!content.trim()) {
      return res.status(400).json({ message: "Nội dung phản hồi không được để trống" });
    }

    const originalComment = await Comment.findById(commentId);
    if (!originalComment) {
      return res.status(404).json({ message: "Bình luận không tồn tại" });
    }

    // Kiểm tra employer có quyền trả lời không
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Bài viết không tồn tại" });
    }

    const employer = await Employer.findById(userId);
    if (!employer || userId.toString() !== post.employerId.toString()) {
      return res.status(403).json({ message: "Bạn không có quyền trả lời bình luận này" });
    }

    const replyComment = await Comment.create({
      postId,
      userId,
      content,
      parentCommentId: commentId,
    });

    // Tạo một đối tượng để trả về với định dạng giống như khi comment được populate
    const formattedReply = {
      id: replyComment._id,
      content: replyComment.content,
      userId: {
        _id: employer._id,
        fullName: employer.companyName || "Nhà tuyển dụng",
        avatar: employer.logoCompany || ""
      },
      timeAgo: timeAgo(replyComment.createdAt),
      parentCommentId: replyComment.parentCommentId,
      createdAt: replyComment.createdAt,
      isEmployerReply: true // Flag để xác định đây là reply từ employer
    };

    res.status(201).json({ 
      message: "Trả lời bình luận thành công", 
      reply: formattedReply
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi trả lời bình luận", error });
  }
};

// 🔥 Xem danh sách User đã like bài post
export const getLikes = async (req: Request, res: Response) => {
  try {
    const post = await Post.findById(req.params.postId).populate("likes", "fullName avatar");
    if (!post) {
      return res.status(404).json({ message: "Bài viết không tồn tại" });
    }
    res.status(200).json(post.likes || []);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};




export const createPost = async (req: Request, res: Response) => {
  try {
    const { caption } = req.body;
    console.log("Body:", req.body); 
    console.log("Files:", req.files); 

    if (!caption) {
      return res
        .status(400)
        .json({ message: "Nội dung bài viết không được để trống" });
    }

    let imageUrls: string[] = [];

   
    let files: Express.Multer.File[] = [];

    if (Array.isArray(req.files)) {
      files = req.files; 
    } else if (req.files && typeof req.files === "object") {
      files = req.files["images"] as Express.Multer.File[] ?? [];
    }

    
    if (!Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ message: "Không có file hợp lệ" });
    }

    
    for (const file of files) {
      const result = await putObject(file.buffer, `posts/${Date.now()}-${file.originalname}`, 'image/jpeg');
      if (result) {
        imageUrls.push(result.url);
      }
    }

    
    const post = await Post.create({
      employerId: req["user"]["_id"],
      caption,
      images: imageUrls,
    });

    res.status(201).json(post);
  } catch (error) {
    console.error("Lỗi khi tạo bài viết:", error);
    res.status(500).json({ message: "Lỗi server, vui lòng thử lại sau." });
  }
};





export const updatePost = async (req: Request, res: Response) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: "Bài viết không tồn tại" });
    }

    
    if (post.employerId.toString() !== req["user"]["_id"].toString()) {
      return res.status(403).json({ message: "Bạn không có quyền chỉnh sửa bài viết này" });
    }

    let updatedImages = post.images;
    let files: Express.Multer.File[] = [];

 
    if (Array.isArray(req.files)) {
      files = req.files;
    } else if (req.files && typeof req.files === "object") {
      files = req.files["images"] as Express.Multer.File[] ?? [];
    }


    if (Array.isArray(files) && files.length > 0) {
      updatedImages = [];
      for (const file of files) {
        const result = await putObject(file.buffer, `posts/${Date.now()}-${file.originalname}`, 'image/jpeg');
        if (result) {
          updatedImages.push(result.url);
        }
      }
    }

  
    post.caption = req.body.caption || post.caption;
    post.images = updatedImages;
    await post.save();

    res.status(200).json(post);
  } catch (error) {
    console.error("Lỗi khi cập nhật bài viết:", error);
    res.status(500).json({ message: "Lỗi server, vui lòng thử lại sau." });
  }
};



export const deletePost = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const employerId = req["user"]["_id"]; 

    
    const post = await Post.findOne({ _id: id, employerId });
    if (!post) {
      return res.status(404).json({ message: "Bài viết không tồn tại hoặc bạn không có quyền xóa." });
    }

    // Xóa bài viết
    await Post.findByIdAndDelete(id);
    
    // Xóa tất cả bình luận liên quan 
    await Comment.deleteMany({ postId: id });
    
    // Xóa tất cả like liên quan
    await Like.deleteMany({ postId: id });
    
    res.status(200).json({ message: "Đã xóa bài viết thành công." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Lấy tất cả bình luận cho tất cả bài viết của employer từ token
export const getAllPostsComments = async (req: Request, res: Response) => {
  try {
    const employerId = req["user"]["_id"];
    
    // Lấy tất cả bài viết của employer
    const posts = await Post.find({ employerId }).select('_id');
    
    if (posts.length === 0) {
      return res.status(200).json({});
    }
    
    const postIds = posts.map(post => post._id);
    
    // Lấy tất cả bình luận cho các bài viết này
    const comments = await Comment.find({ 
      postId: { $in: postIds } 
    }).sort({ createdAt: -1 });
    
    // Tổ chức dữ liệu theo postId
    const commentsByPost = {};
    
    // Xử lý tất cả comments
    for (const comment of comments) {
      const postId = comment.postId.toString();
      
      if (!commentsByPost[postId]) {
        commentsByPost[postId] = [];
      }
      
      // Kiểm tra xem comment này có phải của employer không
      const isEmployerComment = employerId.toString() === comment.userId.toString();
      
      let userInfo = null;
      
      if (isEmployerComment) {
        // Nếu là comment của employer
        const employer = await Employer.findById(comment.userId);
        userInfo = {
          _id: employer._id,
          fullName: employer.companyName || "Nhà tuyển dụng",
          avatar: employer.logoCompany || ""
        };
      } else {
        // Nếu là comment của user thông thường
        userInfo = await mongoose.model('User').findById(comment.userId).select('fullName avatar');
      }
      
      commentsByPost[postId].push({
        id: comment._id,
        content: comment.content,
        userId: userInfo,
        timeAgo: timeAgo(comment.createdAt),
        parentCommentId: comment.parentCommentId,
        createdAt: comment.createdAt,
        isEmployerReply: isEmployerComment
      });
    }
    
    // Lấy thông tin bài viết cho mỗi postId
    const result = {};
    for (const postId of postIds) {
      const post = await Post.findById(postId);
      if (post) {
        result[postId.toString()] = {
          postInfo: {
            id: post._id,
            caption: post.caption,
            images: post.images,
            likesCount: post.likes.length,
            timeAgo: timeAgo(post.createdAt),
            createdAt: post.createdAt
          },
          comments: commentsByPost[postId.toString()] || []
        };
      }
    }
    
    res.status(200).json(result);
  } catch (error) {
    console.error("Lỗi khi lấy bình luận cho tất cả bài viết:", error);
    res.status(500).json({ message: "Lỗi server, vui lòng thử lại sau." });
  }
};
