import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    employerId: { type: mongoose.Schema.Types.ObjectId, ref: "Employer", required: true },
    caption: { type: String, required: true },
    images: { type: [String], default: [] },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

export const Post = mongoose.model("Post", postSchema);
