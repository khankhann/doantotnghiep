const express = require("express");
const Product = require("../models/Product");
const { protect, admin } = require("../middleware/authMiddleware");
const Notification = require("../models/Notification");
const User = require("../models/User");

// 🔥 IMPORT THÊM 3 THƯ VIỆN NÀY
const QRCode = require('qrcode');
const cloudinary = require('cloudinary').v2; // Đảm bảo fen đã config Cloudinary ở server.js nhé
const axios = require('axios');

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
    // 🚀 LOGIC 1: TẠO QR -> CLOUDINARY -> DISCORD
    // ========================================================
    try {
      console.log(" [DEBUG ADMIN] Đang tạo ảnh QR...");
      
      // Lấy URL frontend từ .env (nếu không có thì dùng localhost để test)
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
      const productUrl = `${frontendUrl}/admin/products/${newProduct._id}`;

      // 1. Sinh ảnh QR dạng Base64
      const qrBase64 = await QRCode.toDataURL(productUrl, {
          errorCorrectionLevel: 'H', // Mức độ chống xước cao nhất
          margin: 2,
          width: 300
      });

      // 2. Up lên Cloudinary
      const uploadResult = await cloudinary.uploader.upload(qrBase64, {
          folder: "Shop_QRCodes", // Tạo folder riêng cho xịn
      });

      // 3. Cập nhật link ảnh vào DB và lưu lại
      newProduct.qrCodeUrl = uploadResult.secure_url;
      await newProduct.save();
      console.log("✅ [DEBUG ADMIN] Đã upload QR thành công!");

      // 4. Bắn lên Discord
      if (process.env.DISCORD_WEBHOOK_URL) {
          const discordPayload = {
              content: `🎉 **Vừa nhập kho sản phẩm mới!**\nTên: **${newProduct.name}**\nGiá: ${newProduct.price}đ`,
              embeds: [{
                  title: "Mã QR Truy Xuất Nhanh",
                  description: "Quét mã này để mở thẳng trang quản lý.",
                  color: 3447003,
                  image: {
                      url: newProduct.qrCodeUrl 
                  }
              }]
          };
          // Gửi đi không cần await để luồng API chạy nhanh hơn
          axios.post(process.env.DISCORD_WEBHOOK_URL, discordPayload).catch(e => console.log("Lỗi Discord:", e.message));
      }
    } catch (qrErr) {
        console.error("❌ Lỗi luồng tạo QR:", qrErr.message);
        // Nếu lỗi QR thì vẫn cứ chạy tiếp xuống dưới để báo cho khách hàng
    }

    // ========================================================
    // 🚀 LOGIC 2: THÔNG BÁO CHO KHÁCH HÀNG (Cũ của fen)
    // ========================================================
    try {
      const message = `Sản phẩm HOT: ${newProduct.name} vừa được thêm!`;
      const users = await User.find({role : "customer"});
      
      console.log(` [DEBUG ADMIN] Đang gửi thông báo cho ${users.length} người...`);

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
    }

    // Trả về sản phẩm mới tạo (Lúc này đã có kèm theo qrCodeUrl)
    res.status(201).json(newProduct);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/:id/generate-qr", protect, admin, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
    }

    console.log(`[DEBUG ADMIN] Đang tạo bù QR cho sản phẩm: ${product.name}`);

    // Lấy URL frontend từ .env (nếu không có thì dùng localhost)
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    // Tạo link đích để khi khách quét nó nhảy thẳng vào trang chi tiết sản phẩm
    const productUrl = `${frontendUrl}/product/${product._id}`;

    // 1. Sinh ảnh QR dạng Base64
    const qrBase64 = await QRCode.toDataURL(productUrl, {
        errorCorrectionLevel: 'H',
        margin: 2,
        width: 300
    });

    // 2. Up lên Cloudinary
    const uploadResult = await cloudinary.uploader.upload(qrBase64, {
        folder: "Shop_QRCodes", 
    });

    // 3. Cập nhật link ảnh vào Database và lưu lại
    product.qrCodeUrl = uploadResult.secure_url;
    await product.save();

    console.log("✅ [DEBUG ADMIN] Đã tạo bù QR thành công!");


    if (process.env.DISCORD_WEBHOOK_URL) {
      const discordPayload = {
          content: `**Vừa bổ sung mã QR cho sản phẩm cũ!**\nTên: **${product.name}** \nGiá: ${product.price?.toLocaleString('vi-VN') || 'Chưa có giá'}\nSKU: ${product.sku || 'Chưa có SKU'}`,
          embeds: [{
              title: "Mã QR Truy Xuất Nhanh (Đã cập nhật)",
              description: "Quét mã này để truy xuất nhanh thông tin sản phẩm.",
              color: 16766720, // Đổi sang màu Vàng (Hex: FFEA00) để phân biệt với hàng tạo mới
              image: {
                  url: product.qrCodeUrl 
              }
          }]
      };
      
      // Gửi đi không cần await để luồng API chạy nhanh hơn
      axios.post(process.env.DISCORD_WEBHOOK_URL, discordPayload)
           .catch(e => console.log("Lỗi Discord:", e.message));
    }
    // 4. Trả hàng về cho Frontend để nó hiển thị cái khung QR ngay lập tức
    res.status(200).json({ qrCodeUrl: product.qrCodeUrl });
    
  } catch (error) {
    console.error("❌ Lỗi tạo bù QR:", error);
    res.status(500).json({ message: "Lỗi server khi tạo QR bù" });
  }
});

module.exports = router;