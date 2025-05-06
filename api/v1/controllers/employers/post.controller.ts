import { Request, Response } from "express";
import { Post } from "../../../../models/post.model";
import { Comment } from "../../../../models/comment.model";
import { timeAgo } from "../../../../helpers/timeHelper";
import { putObject } from "../../../../helpers/uploadToS3Aws";
import Employer from "../../../../models/employers.model";



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

    res.status(201).json({ message: "Trả lời bình luận thành công", reply: replyComment });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi trả lời bình luận", error });
  }
};

// 🔥 Xem danh sách User đã like bài post
export const getLikes = async (req: Request, res: Response) => {
  try {
    const post = await Post.findById(req.params.postId).populate("likes", "fullName");
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
    res.status(200).json({ message: "Đã xóa bài viết thành công." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
