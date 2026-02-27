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

module.exports = router;