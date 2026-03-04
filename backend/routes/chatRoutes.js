const { GoogleGenerativeAI } = require("@google/generative-ai");
const express = require("express")
const Message = require("../models/Chat")
const User = require("../models/User")
const Order = require("../models/Order"); 
const Product = require("../models/Product");
const {protect, admin} = require("../middleware/authMiddleware")
const router = express.Router()

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
router.post("/ai", protect, async (req, res) => {
  try {
    const { message } = req.body;
    const user = req.user; // Lấy thông tin người dùng từ token (nhờ protect)

    if (!message) {
      return res.status(400).json({ message: "Vui lòng nhập tin nhắn" });
    }

    let systemContext = "";

    // ==========================================
    // 1. NẾU LÀ ADMIN: Kéo data doanh thu, đơn hàng
    // ==========================================
   if (user.role === "admin") {
      // Mốc thời gian bắt đầu ngày hôm nay
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      // 💰 TÍNH NĂNG 1: DOANH THU & ĐƠN HÀNG HÔM NAY
      const todayOrders = await Order.find({ createdAt: { $gte: startOfDay } });
      const todayOrderCount = todayOrders.length;
      const todayRevenue = todayOrders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);

      // 📦 TÍNH NĂNG 2: NHẮC VIỆC (ĐƠN CHƯA XỬ LÝ)
      // Giả sử schema Order của fen có trường status là 'Pending' hoặc isDelivered = false
      const pendingOrdersCount = await Order.countDocuments({ 
        $or: [{ status: "Pending" }, { isDelivered: false }] 
      });

      // ⚠️ TÍNH NĂNG 3: CẢNH BÁO KHO HÀNG SẮP HẾT
      // Giả sử schema Product có trường countInStock (số lượng tồn)
      const lowStockProducts = await Product.find({ countInStock: { $lt: 10, $gt: 0 } })
                                            .select('name countInStock')
                                            .limit(5);
      const lowStockText = lowStockProducts.length > 0 
        ? lowStockProducts.map(p => `${p.name} (còn ${p.countInStock} cái)`).join(', ')
        : "Kho hàng ổn định, không có sản phẩm nào sắp hết.";

      const outOfStockCount = await Product.countDocuments({ countInStock: 0 });

      // 🏆 TÍNH NĂNG 4: SẢN PHẨM BÁN CHẠY & KHÁCH MỚI
      const bestSellers = await Product.find().sort({ sold: -1 }).limit(3);
      const bestSellerNames = bestSellers.map(p => p.name).join(", ");
      
      const newUsersCount = await User.countDocuments({ createdAt: { $gte: startOfDay }, role: "customer" });

      // 🧠 BƠM DỮ LIỆU CHO "SIÊU THƯ KÝ"
      systemContext = `
        Bạn là "Thư ký Quản trị (Admin Assistant)" cấp cao của Shop thời trang.
        Người đang chat với bạn là Sếp (Admin / Chủ shop).
        
        Dưới đây là BÁO CÁO HỆ THỐNG TRỰC TIẾP tính đến thời điểm hiện tại:
        
        [1. TÀI CHÍNH & VẬN HÀNH HÔM NAY]
        - Số đơn hàng mới: ${todayOrderCount} đơn.
        - Tổng doanh thu trong ngày: ${todayRevenue.toLocaleString('vi-VN')} VNĐ.
        - Số đơn hàng ĐANG TỒN ĐỌNG (chưa xử lý/chưa giao): ${pendingOrdersCount} đơn.
        - Số lượng khách hàng đăng ký mới hôm nay: ${newUsersCount} người.
        
        [2. TÌNH TRẠNG KHO HÀNG & SẢN PHẨM]
        - Top 3 sản phẩm gánh doanh thu: ${bestSellerNames || "Chưa có dữ liệu"}.
        - Cảnh báo sắp hết hàng (<10 cái): ${lowStockText}.
        - Số lượng sản phẩm đã hết sạch (Out of stock): ${outOfStockCount} sản phẩm.
        
        [HƯỚNG DẪN TRẢ LỜI CỦA THƯ KÝ]
        1. BÁO CÁO DOANH THU: Nếu Sếp hỏi "Hôm nay bán được bao nhiêu?", "Doanh thu thế nào?" -> Báo cáo ngay số đơn và tiền, kèm lời chúc mừng nếu có đơn, hoặc động viên nếu ế.
        2. NHẮC NHỞ CÔNG VIỆC: Nếu có đơn hàng tồn đọng (${pendingOrdersCount} đơn), hãy chủ động nhắc Sếp vào mục Quản lý Đơn hàng để duyệt/giao hàng cho khách.
        3. QUẢN LÝ KHO: Nếu Sếp hỏi "Có món nào cần nhập thêm không?", "Kho bãi sao rồi?" -> Đọc danh sách cảnh báo sắp hết hàng và số món đã hết sạch để Sếp lên kế hoạch nhập kho.
        4. TƯ VẤN CHIẾN LƯỢC: Nếu Sếp hỏi "Làm sao để tăng doanh thu?", hãy khuyên Sếp đẩy mạnh Marketing cho Top 3 sản phẩm gánh doanh thu, và xả kho hoặc làm combo ưu đãi.
        5. Truy cập internet lấy thông tin xu hướng thời trang, ở đâu , xuát xứ , cập nhật giá cả ví dụ :"200.000 vnd " ,  các ca sĩ nổi tiếng trong thời gian hiện nay tóm tắt 1 cách ngắn gọn đầy đủ 
        6. THÁI ĐỘ: Ngắn gọn, súc tích, chuyên nghiệp. Xưng hô là "Sếp" hoặc "Admin". Báo cáo bằng số liệu thực tế, phong cách giống như một Giám đốc Vận hành (COO) thực thụ.
        7. nhấn mạnh in đậm các từ quan trọng để nắm bắt thông tin 
      
      
      
        `;
    }
    // ==========================================
    // 2. NẾU LÀ KHÁCH HÀNG: Kéo lịch sử mua, gợi ý
    // ==========================================
    else {
      // 📦 TÍNH NĂNG 1: LẤY LỊCH SỬ MUA & TRẠNG THÁI ĐƠN HÀNG MỚI NHẤT
      const myOrders = await Order.find({ user: user._id })
                                  .sort({ createdAt: -1 })
                                  .limit(5); // Lấy 5 đơn gần nhất để có nhiều data hơn

      let orderHistoryText = "Khách chưa từng mua sản phẩm nào.";
      let latestOrderStatus = "Hiện không có đơn hàng nào đang xử lý.";

      if (myOrders.length > 0) {
        // Lấy danh sách tên sản phẩm đã mua
        const boughtItems = [];
        myOrders.forEach(order => {
          const items = order.orderItems || order.items || [];
          items.forEach(item => {
            if (item.name) boughtItems.push(item.name);
          });
        });

        if (boughtItems.length > 0) {
          orderHistoryText = [...new Set(boughtItems)].join(", ");
        }

        // Lấy trạng thái của đơn hàng MỚI NHẤT (đơn đầu tiên trong mảng)
        const latestOrder = myOrders[0];
        // Giả sử DB của fen dùng isDelivered, isPaid hoặc có trường status riêng
        const status = latestOrder.status || (latestOrder.isDelivered ? "Đã giao hàng thành công" : "Đang xử lý/Đang vận chuyển");
        const orderDate = new Date(latestOrder.createdAt).toLocaleDateString('vi-VN');
        const shortOrderId = latestOrder._id.toString().slice(-6).toUpperCase(); // Cắt 6 số cuối làm mã đơn
        
        latestOrderStatus = `Đơn hàng gần nhất đặt ngày ${orderDate}, mã đơn #${shortOrderId}, trạng thái hiện tại: ${status}.`;
      }

      // 👗 TÍNH NĂNG 2: LẤY SẢN PHẨM HOT ĐỂ LÀM STYLIST PHỐI ĐỒ
      const bestSellers = await Product.find().sort({ sold: -1 }).limit(5);
      // Ghép tên và giá để báo giá luôn cho khách
      const bestSellerNames = bestSellers.map(p => `${p.name} (${p.price.toLocaleString('vi-VN')}đ)`).join(" | ");

      // 🛡️ TÍNH NĂNG 3 & 4: CHÍNH SÁCH CỬA HÀNG & VOUCHER KHUYẾN MÃI (Gắn cứng hoặc lấy từ DB)
      const storePolicy = `
        - Đổi trả: Hỗ trợ đổi size/mẫu trong 7 ngày (giữ nguyên tem mác).
        - Vận chuyển: Phí ship toàn quốc 30K. Miễn phí ship (Freeship) cho đơn từ 500K trở lên.
        - Mã giảm giá hôm nay: Nhập "GIAM50K" để giảm ngay 50.000đ cho đơn trên 1 triệu.
      `;

      // 🧠 BƠM TOÀN BỘ "SIÊU DỮ LIỆU" VÀO NÃO AI
      systemContext = `
        Bạn là "Trợ lý ảo CSKH kiêm Stylist" chuyên nghiệp của Shop thời trang. 
        Khách hàng đang chat tên là: ${user.name}.
        
        Bạn có các thông tin nội bộ sau để hỗ trợ khách:
        [THÔNG TIN KHÁCH HÀNG]
        - Lịch sử các món đã mua: ${orderHistoryText}
        - Trạng thái đơn hàng gần nhất: ${latestOrderStatus}

        [THÔNG TIN CỬA HÀNG]
        - Top 5 sản phẩm nổi bật đang bán: ${bestSellerNames || "Áo thun cơ bản, Quần Jean ống rộng"}
        - Chính sách & Ưu đãi: ${storePolicy}

        [HƯỚNG DẪN TRẢ LỜI ĐA NHIỆM]
        1. KIỂM TRA ĐƠN HÀNG: Nếu khách hỏi đơn hàng đang ở đâu, bao giờ nhận được -> Báo cáo dựa vào "Trạng thái đơn hàng gần nhất".
        2. GỢI Ý PHỐI ĐỒ (MIX & MATCH): Nếu khách nhờ tư vấn mặc gì, hãy xem "Lịch sử đã mua", kết hợp với "Sản phẩm nổi bật" để mix thành một outfit cực chất.
        3. BÁO GIÁ & CHÍNH SÁCH: Nếu khách hỏi phí ship, đổi trả, mã giảm giá -> Bê nguyên "Chính sách & Ưu đãi" ra tư vấn.
        4. THÁI ĐỘ: Trả lời tự nhiên, thân thiện, xưng hô "Shop" và "Bạn" (hoặc tên khách). Nếu khách hỏi ngoài lề (không liên quan thời trang/mua sắm), hãy khéo léo lái câu chuyện về quần áo.
      `;
    }

    // ==========================================
    // 3. GỌI GEMINI VỚI PROMPT ĐÃ ĐƯỢC BƠM DATA
    // ==========================================
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    // Nối ngữ cảnh hệ thống với câu hỏi thực tế của người dùng
    const finalPrompt = `
      ${systemContext}
      
      Câu hỏi của người dùng: "${message}"
      Trả lời:
    `;

    const result = await model.generateContent(finalPrompt);
    const response = await result.response;
    const aiText = response.text();

    res.status(200).json({ reply: aiText });

  } catch (error) {
    console.error("Lỗi AI Route:", error);
    res.status(500).json({ error: "AI đang bận, vui lòng thử lại sau!" });
  }
});


router.get("/history", protect, async (req, res) => {
  try {
    // Tìm tất cả tin nhắn của userId này, sắp xếp cũ nhất -> mới nhất
    const messages = await Message.find({ user: req.user._id }).sort({ createdAt: 1 });
    
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ message: "Lỗi tải lịch sử chat!" });
  }
});

// 1. Lấy danh sách khách hàng đã từng nhắn tin (Sắp xếp theo tin nhắn mới nhất)
router.get("/admin/conversations", protect, admin, async (req, res) => {
  try {
    // Tìm tất cả các user ID có trong bảng Message
    const userIds = await Message.distinct("user");
    const users = await User.find({ _id: { $in: userIds } }).select("name email role");
   
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: "Lỗi lấy danh sách chat!" });
  }
});

router.get("/admin/history/:userId", async (req, res) => {
  try {
    const targetId = req.params.userId; // ID của người mình vừa click
    const myId = req.query.myId; // ID của Admin đang đăng nhập (Lấy từ token)

    // 1. Kiểm tra xem người đang click là Khách hay Admin
    const targetUser = await User.findById(targetId);

    let query = {};

    if (targetUser && targetUser.role === "admin") {
      //  ADMIN CHAT VỚI ADMIN: 
      // Lấy tin nhắn mình gửi cho họ (user: targetId) HOẶC họ gửi cho mình (user: myId)
      query = {
        $or: [
          { user: targetId }, 
          { user: myId }      
        ],
        sender: "admin" // Bắt buộc sender phải là admin để không lẫn tin nhắn của khách
      };
    } else {
      // 🚀 ADMIN CHAT VỚI KHÁCH: 
      // Mọi tin nhắn (khách gửi hay admin gửi) đều chung 1 mã 'user' là ID của khách
      query = { user: targetId };
    }

    // 2. Query và sắp xếp theo thời gian cũ -> mới
    const messages = await Message.find(query).sort({ createdAt: 1 });

    // 3. Trả về đúng mảng để Frontend Redux nó hứng
    res.status(200).json(messages);

  } catch (error) {
    console.error("Lỗi lấy lịch sử chat:", error);
    res.status(500).json({ message: "Lỗi lấy lịch sử tin nhắn" });
  }
});

// Route: GET /api/messages/admins

router.get("/admins", async (req, res) => {
  try {
    // Tìm tất cả user có role là admin
    const admins = await User.find({ role: "admin" }).select("name email role");
    res.status(200).json(admins);
  } catch (error) {
    res.status(500).json({ message: "Lỗi tải danh sách Admin" });
  }
});

// Route: GET /api/messages/users (Hoặc prefix nào fen đang xài cho chat)
// Chức năng: Lấy danh sách tất cả người dùng (Không bao gồm Admin)
router.get("/users", async (req, res) => {
  try {
    // $ne: "admin" nghĩa là lấy tất cả những ai KHÔNG CÓ role là admin
    const users = await User.find({ role: { $ne: "admin" } }).select("name email role");
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: "Lỗi tải danh sách người dùng" });
  }
});


















module.exports = router