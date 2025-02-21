import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    userId: String,
    employerId: String,
    title: String,
    image: String,
    content: String,
    type: String,
    detail_type: String,
    isSeen: Boolean,
    ref_id: String,
    extra: Object
  },
  {
    timestamps: true,
  }
);

const Notification = mongoose.model("Notification", notificationSchema, "notifications");

export default Notification;
