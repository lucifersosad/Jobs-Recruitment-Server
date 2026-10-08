import mongoose from "mongoose";

const chatSchema = new mongoose.Schema(
  {
    user_id: String,
    room_chat_id: String,
    content: String,
    images: Array,
    role: String,
    deleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: Date,
    read:{
      type: Boolean,
      default: false,

    },
    //Danh sách id người đã đọc tin nhắn (dùng cho phòng group, vì mỗi thành viên đọc riêng)
    readBy: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const Chat = mongoose.model("Chat", chatSchema, "chats");

export default Chat;
