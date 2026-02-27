const express = require("express");
const Product = require("../models/Product");
const { protect, admin } = require("../middleware/authMiddleware");
const Notification = require("../models/Notification");
const User = require("../models/User");
const router = express.Router();

// route Get / api/ admin / products
router.get("/", protect, admin, async (req, res) => {
  try {
    let query = {};
    if (req.query.search) {
      query.name = { $regex: req.query.search, $options: "i" };
    }
    const products = await Product.find(query)
      .populate("user", "name email")
      .populate("lastEditByUser", "name");
    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "server error" });
  }
});

// route Delete / api / admin / products
router.delete("/:id", protect, admin, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (product) {
      await product.deleteOne();
      res.status(200).json({ message: "product deleted" });
    } else {
      res.status(404).json({ message: "product not found " });
    }
  } catch (error) {
    res.status(500).json({ message: "server error" });
  }
});

// route Put / api/ admin / products
router.put("/:id", protect, admin, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (product) {
      // Cập nhật các field
      Object.assign(product, req.body);
      product.lastEditByUser = req.user._id;

      const updatedProduct = await product.save();
      res.status(200).json(updatedProduct);
    } else {
      res.status(404).json({ message: "Product not found " });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/admin/products
router.post("/", protect, admin, async (req, res) => {
  try {
    const productData = req.body;

    const product = new Product({
      ...productData,
      user: req.user._id,
      lastEditByUser: req.user._id,
    });

    const newProduct = await product.save();

    // ========================================================
    // 🚀 LOGIC THÔNG BÁO (Gói gọn trong try-catch riêng)
    // ========================================================
    try {
      const message = `Sản phẩm HOT: ${newProduct.name} vừa được thêm!`;
      const users = await User.find({role : "customer"});
      
      console.log(`👉 [DEBUG ADMIN] Đang gửi thông báo cho ${users.length} người...`);

      for (const u of users) {
        const notif = await Notification.create({
          user: u._id,
          message: message,
          type: "NEW_PRODUCT",
          productId: newProduct._id,
        });

        if (req.io) {
          req.io.to(u._id.toString()).emit("receive_notification", notif);
        }
      }
      console.log("✅ [DEBUG ADMIN] ĐÃ GỬI XONG!");
    } catch (notifErr) {
      console.error("❌ Lỗi gửi thông báo:", notifErr.message);
      // Không return lỗi ở đây để vẫn trả về sản phẩm đã tạo thành công
    }

    // Trả về sản phẩm mới tạo (Dùng đúng tên biến newProduct)
    res.status(201).json(newProduct);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;