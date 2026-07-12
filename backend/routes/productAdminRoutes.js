const express = require("express");
const Product = require("../models/Product");
const { protect, admin } = require("../middleware/authMiddleware");
const Notification = require("../models/Notification");
const User = require("../models/User");

// 🔥 BỘ BA THƯ VIỆN ĐÃ CONFIG
const QRCode = require('qrcode');
const cloudinary = require('cloudinary').v2; 
const axios = require('axios');

const router = express.Router();

// ==========================================
// 🚀 1. GET /api/admin/products (LẤY DANH SÁCH + FIX BIỂU ĐỒ TRÒN)
// ==========================================
router.get("/", protect, admin, async (req, res) => {
  try {
    let query = {};
    if (req.query.search) {
      query.name = { $regex: req.query.search, $options: "i" };
    }
    // 👉 ĐÃ FIX: Thêm .populate("category", "name") để biểu đồ tròn hiển thị đúng tên danh mục, xóa sạch chữ "Khác"
    const products = await Product.find(query)
      .populate("user", "name email")
      .populate("lastEditByUser", "name")
      .populate("category", "name"); 
    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "server error" });
  }
});

// ==========================================
// 🚀 2. DELETE /api/admin/products/:id
// ==========================================
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

// ==========================================
// 🚀 3. PUT /api/admin/products/:id (SỬA SẢN PHẨM)
// ==========================================
router.put("/:id", protect, admin, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (product) {
      Object.assign(product, req.body);
     if (req.body.newHistoryEntry) {
        if (!product.stockHistory) {
          product.stockHistory = [];
        }
        product.stockHistory.push(req.body.newHistoryEntry);
      }
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

// 4. POST /api/admin/products (TẠO MỚI + BẮN DISCORD CHỮA CHÁY)

router.post("/", protect, admin, async (req, res) => {
  try {
    const productData = req.body;
    const product = new Product({
      ...productData,
      user: req.user._id,
      lastEditByUser: req.user._id,
    });

    const newProduct = await product.save();

    // Luồng sinh QR khi tạo mới
    try {
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
      const productUrl = `${frontendUrl}/product/${newProduct._id}`;

      const qrBase64 = await QRCode.toDataURL(productUrl, {
          errorCorrectionLevel: 'H',
          margin: 2,
          width: 300
      });

      const uploadResult = await cloudinary.uploader.upload(qrBase64, {
          folder: "Shop_QRCodes",
      });

      newProduct.qrCodeUrl = uploadResult.secure_url;
      await newProduct.save();

      // Bắn Discord hàng mới tạo (Có đầy đủ phân loại hệ mới)
      if (process.env.DISCORD_WEBHOOK_URL) {
          let variantsText = "❌ Không có phân loại chi tiết";
          if (newProduct.variants && newProduct.variants.length > 0) {
              variantsText = newProduct.variants.map(v => `• \`${v.variantName}\`: **${v.stock}** cái`).join("\n");
          }

          const discordPayload = {
              content: `🎉 **[HỆ THỐNG KHO] Vừa nhập kho sản phẩm mới!**`,
              embeds: [{
                  title: `👕 Tên SP: ${newProduct.name}`,
                  color: 3066993,
                  fields: [
                      { name: "💰 Giá bán", value: `**${newProduct.price?.toLocaleString('vi-VN')} đ**`, inline: true },
                      { name: "🏷️ SKU", value: `\`${newProduct.sku || "Chưa có"}\``, inline: true },
                      { name: "📦 Tổng kho", value: `**${newProduct.countInStock || 0}** cái`, inline: true },
                      { name: "📋 Chi tiết biến thể", value: variantsText, inline: false }
                  ],
                  image: { url: newProduct.qrCodeUrl }
              }]
          };
          axios.post(process.env.DISCORD_WEBHOOK_URL, discordPayload).catch(e => console.log(e.message));
      }
    } catch (qrErr) {
        console.error("Lỗi QR tạo mới:", qrErr.message);
    }

    // Luồng gửi thông báo cho khách hàng
    try {
      const message = `Sản phẩm HOT: ${newProduct.name} vừa được thêm!`;
      const users = await User.find({role : "customer"});
      for (const u of users) {
        await Notification.create({ user: u._id, message, type: "NEW_PRODUCT", productId: newProduct._id });
      }
    } catch (notifErr) {
      console.error(notifErr.message);
    }

    res.status(201).json(newProduct);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ==========================================
// 🚀 5. POST /api/admin/products/:id/generate-qr (TẠO BÙ QR CHO ĐỒ CŨ - ĐÃ FIX SẠCH LỖI)
// ==========================================
router.post("/:id/generate-qr", protect, admin, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
    }

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    // 👉 ĐÃ ĐỒNG BỘ: Dùng chung link gốc /product/:id giống như lúc tạo mới
    const productUrl = `${frontendUrl}/product/${product._id}`;

    // 1. Sinh ảnh QR
    const qrBase64 = await QRCode.toDataURL(productUrl, {
        errorCorrectionLevel: 'H',
        margin: 2,
        width: 300
    });

    // 2. Up lên Cloudinary
    const uploadResult = await cloudinary.uploader.upload(qrBase64, {
        folder: "Shop_QRCodes", 
    });

    // 👉 3. TỐI ƯU BẮT BUỘC: Cập nhật trực tiếp vào DB, bỏ qua khâu check lỗi dữ liệu cũ (category dạng chuỗi)
    await Product.findByIdAndUpdate(
        req.params.id, 
        { $set: { qrCodeUrl: uploadResult.secure_url } },
        { runValidators: false } 
    );

    // Gán lại link mới vào object để đem đi gửi Discord
    product.qrCodeUrl = uploadResult.secure_url;

    // 4. Đóng gói dữ liệu gửi lên Discord thông minh
    if (process.env.DISCORD_WEBHOOK_URL) {
      let variantsText = " Chưa cập nhật phân loại hệ mới (Size/Màu)";
      
      // Kiểm tra xem sản phẩm có mảng variants mới chưa
      if (product.variants && product.variants.length > 0) {
          variantsText = product.variants.map(v => `• \`${v.variantName}\`: ${v.stock} cái`).join("\n");
      } 
      // Bổ sung thám tử: Nếu là sản phẩm cũ dùng mảng cũ thì lôi ra cảnh báo luôn
      else if ((product.sizes && product.sizes.length > 0) || (product.colors && product.colors.length > 0)) {
          variantsText = `Phát hiện dữ liệu hệ thống cũ: \n• Size cũ: \`${product.sizes?.join(", ") || "Trống"}\`\n• Màu cũ: \`${product.colors?.join(", ") || "Trống"}\`\n  cần vào trang Admin bấm Sửa SP này để đồng bộ`;
      }

      const formattedPrice = product.price ? product.price.toLocaleString('vi-VN') + ' đ' : 'Chưa có giá';

      const discordPayload = {
          content: `[HỆ THỐNG KHO] Đã cấp bù mã QR thành công cho sản phẩm cũ!`,
          embeds: [{
              title: ` Tên Sản Phẩm: ${product.name}`,
              description: "Hệ thống đã tự động luồn lách qua dữ liệu cũ để cấp mã QR.",
              color: 16766720, 
              fields: [
                  { name: " Giá bán", value: `**${formattedPrice}**`, inline: true },
                  { name: " Mã SKU", value: `\`${product.sku || "Chưa có"}\``, inline: true },
                  { name: " Tổng tồn kho", value: `**${product.countInStock || 0}** cái`, inline: true },
                  { name: " Chi tiết tồn kho (Size - Màu)", value: variantsText, inline: false }
              ],
              image: { url: product.qrCodeUrl },
              footer: { text: "Hệ thống sửa đổi kho dữ liệu • ShopAdmin" },
              timestamp: new Date().toISOString()
          }]
      };
      
      axios.post(process.env.DISCORD_WEBHOOK_URL, discordPayload).catch(e => console.log("Lỗi Discord:", e.message));
    }

    res.status(200).json({ qrCodeUrl: product.qrCodeUrl });
    
  } catch (error) {
    console.error("❌ Lỗi tạo bù QR:", error);
    res.status(500).json({ message: "Lỗi server khi tạo QR bù" });
  }
});

module.exports = router;