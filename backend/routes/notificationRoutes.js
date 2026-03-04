const express = require("express");
const Notification = require("../models/Notification");
const { protect } = require("../middleware/authMiddleware");
const router = express.Router();

// GET /api/notifications
router.get("/", protect, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id ;

    // 👇 1. SOI XEM AI ĐANG GỌI API?
    console.log("🕵️‍♂️ API Notification - User đang gọi là:", userId);

    // Lấy thông báo của user ĐANG ĐĂNG NHẬP hoặc thông báo chung
    const notifications = await Notification.find({
      $or: [{ user: userId }, { user: null }],
    }).sort({ createdAt: -1 });

    // 👇 2. SOI XEM TÌM ĐƯỢC BAO NHIÊU CÁI?
    console.log(`✅ Tìm thấy ${notifications.length} thông báo cho user này.`);

    res.json(notifications);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});

// PUT /api/notifications/:id/read (Đánh dấu đã đọc)
router.put("/:id/read", protect, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (notification) {
      notification.read = true;
      await notification.save();
      res.json(notification);
    } else {
      res.status(404).json({ message: "Not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
});



// Thêm API xoá thông báo (DELETE)
router.delete("/:id", protect, async (req, res) => {
  try {
    // Tìm thông báo theo ID từ trên URL gửi xuống
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ message: "Không tìm thấy thông báo để xoá" });
    }

    // Tiến hành xoá nó khỏi Database
    await notification.deleteOne(); 
    // (Lưu ý: Nếu xài Mongoose bản cũ thì dùng await notification.remove(); nha)

    res.status(200).json({ message: "Đã xoá thông báo thành công!" });
  } catch (error) {
    console.error("Lỗi khi xoá thông báo:", error);
    res.status(500).json({ message: "Lỗi Server không thể xoá" });
  }
});

module.exports = router;