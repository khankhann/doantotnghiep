const Message = require("../models/Chat"); // Nhớ check lại đường dẫn model của fen nha

// Dùng Map lưu trên RAM để chống Spam: Khách nhắn 10 tin liên tục thì bot chỉ rep 1 lần
const chatSessions = new Map();
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 phút (Sau 30p khách nhắn lại mới tính là phiên mới)

const handleChatSocket = (io) => {
  io.on("connection", (socket) => {
    
    // ==========================================
    // 1. JOIN PHÒNG CHAT
    // ==========================================
    socket.on("join_room", (userId) => {
      if (userId) {
        socket.join(String(userId));
      }
    });

    socket.on("admin_join", () => {
      socket.join("admin_room");
      console.log(`🟢 Admin (Socket: ${socket.id}) đã kết nối vào phòng trực chat!`);
    });

    // ==========================================
    // 2. KHÁCH GỬI TIN NHẮN CHO ADMIN
    // ==========================================
    socket.on("send_msg_to_admin", async (data) => {
      try {
        // A. Lưu tin nhắn của khách vào Database
        const newMessage = new Message({
          user: data.userId,
          text: data.message, 
          sender: "customer", 
        });
        await newMessage.save();

        // B. Phát tin nhắn hiển thị lên màn hình Khách và màn hình Admin
        io.to(String(data.userId)).emit("receive_msg_from_user", newMessage);
        io.to("admin_room").emit("receive_msg_from_user", newMessage);
        socket.emit("msg_saved_success", newMessage); 

        // ==========================================
        // 🔥 C. LOGIC AUTO-REPLY THÔNG MINH (ONLINE/OFFLINE)
        // ==========================================
        const now = Date.now();
        let session = chatSessions.get(data.userId);

        // Nếu khách im lặng quá 30 phút -> Reset lại luồng auto-reply
        if (session && (now - session.lastActive > SESSION_TIMEOUT)) {
          session = null;
        }

        // CHỈ AUTO-REPLY KHI CHƯA CÓ SESSION (Khách mới nhắn lần đầu hoặc sau 30p)
        if (!session) {
          
          // 👉 ĐẾM SỐ LƯỢNG ADMIN ĐANG ONLINE TRONG PHÒNG
          const adminRoom = io.sockets.adapter.rooms.get("admin_room");
          const adminCount = adminRoom ? adminRoom.size : 0;

          // 👉 CHỌN CÂU TRẢ LỜI DỰA THEO SỐ LƯỢNG ADMIN
          let replyText = "";
          if (adminCount > 0) {
            replyText = "Dạ shop đã nhận được tin nhắn. Hiện tại các Admin đang bận chút việc, bạn vui lòng chờ trong giây lát shop sẽ phản hồi ngay nhé! ❤️";
          } else {
            replyText = "🌙 Dạ hiện tại các Admin đang offline hoặc ngoài giờ trực. Shop đã ghi nhận tin nhắn và sẽ phản hồi lại cho bạn sớm nhất ngay khi online trở lại nhé!";
          }

          // Delay 1.5s tạo cảm giác bot đang gõ chữ
          setTimeout(async () => {
            // Lưu câu trả lời tự động vào Database
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

          // Khóa mõm Bot: Đánh dấu đoạn chat này đang "đợi", khách spam tiếp sẽ KHÔNG auto-reply nữa
          chatSessions.set(data.userId, { status: "waiting", lastActive: now });
          
        } else {
          // Nếu đã có session (Khách đang đợi hoặc Admin đang chat) -> Chỉ cập nhật lại thời gian cuối
          session.lastActive = now;
          chatSessions.set(data.userId, session);
        }

      } catch (error) {
        console.error("Lỗi lưu tin nhắn khách:", error);
      }
    });

    // ==========================================
    // 3. ADMIN TRẢ LỜI LẠI CHO KHÁCH
    // ==========================================
    socket.on("send_msg_to_user", async (data) => {
      try {
        // Lưu tin nhắn của Admin vào Database
        const newMessage = new Message({
          user: data.targetUserId,
          text: data.message,
          sender: "admin",
          adminId: data.adminId 
        });
        await newMessage.save();

        // 🔥 ĐÁNH DẤU ADMIN ĐÃ NHẢY VÀO CHAT -> Tắt hoàn toàn Auto-reply
        chatSessions.set(data.targetUserId, { status: "active", lastActive: Date.now() });

        // Bắn cho Khách và bắn lại vào phòng của Admin (Để các máy Admin khác đồng bộ)
        socket.to(String(data.targetUserId)).emit("receive_msg_from_admin", newMessage);
        io.to("admin_room").emit("receive_msg_from_admin", newMessage);
        
      } catch (error) {
        console.error("Lỗi admin gửi tin:", error);
      }
    });

    // ==========================================
    // 4. KHI NGƯỜI DÙNG HOẶC ADMIN THOÁT
    // ==========================================
    socket.on("disconnect", () => {
      // Socket.io tự động loại bỏ người dùng/admin khỏi các phòng (rooms)
      // Nên io.sockets.adapter.rooms.get("admin_room").size sẽ tự động giảm đi, rất an toàn!
      // console.log("🔴 Một User/Admin đã ngắt kết nối");
    });
  });
};

module.exports = handleChatSocket;