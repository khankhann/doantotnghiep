// File: socket/chatSocket.js
const Message = require("../models/Chat"); 

const handleChatSocket = (io) => {
  io.on("connection", (socket) => {
    // 1. User/Admin join room
    socket.on("join_room", (userId) => {
      if (userId) {
        socket.join(String(userId));
      }
    });

    socket.on("admin_join", () => {
      socket.join("admin_room");
      console.log("👨‍💻 Admin đã kết nối vào phòng trực chat!");
    });

    // 2. KHÁCH GỬI TIN NHẮN CHO ADMIN
    socket.on("send_msg_to_admin", async (data) => {
      try {
        const lastMessage = await Message.findOne({ user: data.userId }).sort({ createdAt: -1 });
        
        const newMessage = new Message({
          user: data.userId,
          text: data.message, 
          sender: "customer", 
        });
        await newMessage.save();

        io.to(String(data.userId)).emit("receive_msg_from_user", newMessage);
        // BẮN CHO ADMIN ROOM
        socket.to("admin_room").emit("receive_msg_from_user", newMessage);
        socket.emit("msg_saved_success", newMessage); 

        // ==========================================
        // 🔥 LOGIC AUTO-REPLY THÔNG MINH (ONLINE/OFFLINE)
        // ==========================================
        let shouldAutoReply = false;
        
        if (!lastMessage || lastMessage.sender !== "customer") {
           shouldAutoReply = true;
        }

        if (shouldAutoReply) {
          // 👉 ĐẾM SỐ LƯỢNG ADMIN ĐANG ONLINE TRONG PHÒNG
          const adminRoom = io.sockets.adapter.rooms.get("admin_room");
          const adminCount = adminRoom ? adminRoom.size : 0;

          // 👉 CHỌN CÂU TRẢ LỜI DỰA THEO SỐ LƯỢNG ADMIN
          let replyText = "";
          if (adminCount > 0) {
            replyText = "Dạ shop đã nhận được tin nhắn. Hiện tại các Admin đang bận gói hàng, bạn vui lòng chờ trong giây lát shop sẽ phản hồi ngay nhé! ❤️";
          } else {
            replyText = "🌙 Dạ hiện tại các Admin đang offline hoặc ngoài giờ trực. Shop đã ghi nhận tin nhắn và sẽ phản hồi lại cho bạn sớm nhất ngay khi online trở lại nhé!";
          }

          setTimeout(async () => {
            const autoReplyMsg = new Message({
              user: data.userId,
              text: replyText,
              sender: "admin",
            });
            await autoReplyMsg.save();

            // Bắn câu trả lời tự động về cho Khách
            io.to(String(data.userId)).emit("receive_msg_from_admin", autoReplyMsg); 
            
            // Bắn câu trả lời tự động cho phòng Admin (Nếu lỡ có Admin nào vừa online vào giữa chừng)
            io.to("admin_room").emit("receive_msg_from_admin", autoReplyMsg);
          }, 1500);
        }

      } catch (error) {
        console.error("Lỗi lưu tin nhắn khách:", error);
      }
    });

    // 3. ADMIN TRẢ LỜI LẠI CHO KHÁCH
    socket.on("send_msg_to_user", async (data) => {
      try {
        const newMessage = new Message({
          user: data.targetUserId,
          text: data.message,
          sender: "admin",
          adminId: data.adminId 
        });
        await newMessage.save();

        // BẮN CHO KHÁCH VÀ BẮN LẠI VÀO PHÒNG CỦA ADMIN (Để các máy Admin khác đồng bộ)
        socket.to(String(data.targetUserId)).emit("receive_msg_from_admin", newMessage);
        io.to("admin_room").emit("receive_msg_from_admin", newMessage);
      } catch (error) {
        console.error("Lỗi admin gửi tin:", error);
      }
    });

    socket.on("disconnect", () => {
      console.log("🔴 Một User/Admin đã ngắt kết nối");
    });
  });
};

module.exports = handleChatSocket;