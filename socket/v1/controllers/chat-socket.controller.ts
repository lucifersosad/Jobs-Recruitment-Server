import { Socket } from "socket.io";
import Chat from "../../../models/chat.model";
import Employer from "../../../models/employers.model";
import User from "../../../models/user.model";
import RoomChat from "../../../models/rooms-chat.model";

export const chatSocket = (socket: Socket, io: any, typeRoom: string): any => {
  return async (msg: string) => {

    const avatar = typeRoom === "friend" ?  (socket["user"]?.image || socket["user"]?.avatar || "") : (socket["user"]?.logoCompany || "")
   
    // Log tin nhắn và id của user
    const objectSend: {
      fullName: string;
      content: string;
      user_id: string;
      avatar: string;
    } = {
      fullName: socket["user"].fullName,
      content: msg,
      user_id: socket["user"]._id,
      avatar: avatar,
    };

    const record: {
      user_id?: string;
      room_chat_id?: string;
      content?: string;
      images?: Array<string>;
    } = {
      user_id: socket["user"]._id,
      room_chat_id: socket["roomChat"],
      content: msg,
      images: [],
    };
    const chat = new Chat(record);
    await chat.save();
    // Gửi tin nhắn về cho tất cả client
    io.to(socket["roomChat"]).emit("SERVER_RETURN_MESSAGE", objectSend);
    //Muốn trả ra một sự kiện để bên client nó nhận được một request yêu cầu check lịch sử chat lấy tin nhắn mới nhất
    //Chỉ gửi tới các thành viên của phòng chat (qua room riêng `user:<id>`), không broadcast cho mọi socket
    const roomChat = await RoomChat.findById(socket["roomChat"]).select("users.id_check");
    const memberRooms: string[] = (roomChat?.users || [])
      .map((item) => item?.id_check)
      .filter(Boolean)
      .map((id) => `user:${id}`);
    if (memberRooms.length > 0) {
      io.to(memberRooms).emit("SERVER_RETURN_REQUEST_LOADMORE", {
        id_check: socket["user"]._id,
      });
    }
  }; 
};

export const disconnectChatSocket = (socket: Socket, io: any): any => {
  return async (msg: string) => {
    // Lấy idUser và roomChat từ socket
    const idUser = socket["user"]._id;
    //Tạo một enum để quản lý role
    enum Role {
      EMPLOYER = "employer",
      USER = "client",
    }
    //Lấy role từ socket
    const role = socket?.handshake?.auth?.role;
    //Nếu không có role thì không thực hiện gì cả
    switch (role) {
      //Nếu role là employer thì cập nhật trạng thái online của employer
      case Role.EMPLOYER:
        await Employer.updateOne({ _id: idUser }, { statusOnline: false });
        break;
      //Nếu role là user thì cập nhật trạng thái online của user
      case Role.USER:
        await User.updateOne({ _id: idUser }, { statusOnline: false });
        break;
    }
    const roomChat = socket["roomChat"];
    // Nếu không có idUser hoặc roomChat thì không thực hiện gì cả
    if (!idUser || !roomChat) return;
    // Thoát khỏi phòng chat
    socket.leave(roomChat);
    // Gửi tin nhắn về cho tất cả client thông báo có người offline
    io.to(roomChat).emit("SERVER_RETURN_REQUEST_OFFLINE", {
      user_id: idUser,
      status: "offline",
    });
  };
};

//hàm này có task là cập nhật trạng thái đã đọc tin nhắn khi đang ở khung chat cùng đối phương
export const requestSeenChat = (socket: Socket, io: any): any => {
  return async (data: any, callback?: () => void) => {
    try {
      const idUser : string = data["idUser"];
      const idCheck : string = data["idCheck"];
      //idUser ở đây chính là idUser của đối phương đang nhắn tin cùng mình
      // Cập nhật trạng thái đã đọc tin nhắn

      if(idUser === idCheck){
        await Chat.updateMany(
          { user_id: idUser, room_chat_id: socket["roomChat"], read: false },
          { read: true }
        );
      }
      //Phòng group: idUser là id phòng group đang mở. Mỗi thành viên đọc riêng nên chỉ thêm mình vào readBy,
      //không đổi cờ read chung (nếu không thì người gửi/1 thành viên mở group sẽ làm tin thành "đã đọc" với tất cả)
      const userMain: string = socket["user"]._id.toString();
      const exitedRoomChat = await RoomChat.findOne({
        _id:idUser,
        typeRoom: "group",
        "users.id_check": userMain,
      });
      if(exitedRoomChat){
        await Chat.updateMany(
          { room_chat_id: idUser, user_id: { $ne: userMain }, readBy: { $ne: userMain } },
          { $addToSet: { readBy: userMain } }
        );
      }
    } finally {
      //Báo cho client biết đã cập nhật xong để client mới load lại lịch sử chat (tránh race condition)
      if (typeof callback === "function") callback();
    }
  };
};

export const sendTyping = (socket: Socket, io: any): any => {
  return async (idUser: string) => {
    const record: {
      user_id?: string;
      room_chat_id?: string;
    } = {
      user_id: socket["user"]._id,
      room_chat_id: socket["roomChat"],
    };
    //
    socket.broadcast
      .to(socket["roomChat"])
      .emit("SERVER_RETURN_TYPING", record);
  };
};
