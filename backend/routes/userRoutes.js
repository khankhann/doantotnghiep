const express = require("express");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const { protect } = require("../middleware/authMiddleware");
const router = express.Router();
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const bcrypt = require('bcryptjs'); // Đảm bảo đã import thư viện mã hóa


// MỚI THÊM: Import crypto và hàm gửi mail
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");

// Cấu hình Multer để lưu ảnh tạm vào RAM
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Hàm hỗ trợ ném ảnh lên Cloudinary
const uploadToCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: "user_avatars" },
      (error, result) => {
        if (result) resolve(result);
        else reject(error);
      }
    );
    uploadStream.end(buffer);
  });
};

// ==========================================
// 1. route POST /api/user/register (ĐÃ SỬA: Thêm gửi mail)
// ==========================================
router.post("/register", async (req, res) => {
  const { name, email, password, rfidCard } = req.body; // Thêm rfidCard nếu cần
  try {
    let user = await User.findOne({ email });
    
    // Nếu user đã tồn tại VÀ đã xác thực -> Chặn
    if (user && user.isVerified) {
        return res.status(400).json({ message: "Email này đã được sử dụng!" });
    }

    // Nếu user tồn tại nhưng CHƯA xác thực -> Cho phép ghi đè/cập nhật để gửi lại mail
    if (!user) {
        user = new User({ name, email, password, rfidCard });
    } else {
        user.name = name;
        user.password = password;
        user.rfidCard = rfidCard;
    }

    const verifyToken = crypto.randomBytes(20).toString('hex');
    user.verifyToken = verifyToken;
    user.verifyTokenExpire = Date.now() + 24 * 60 * 60 * 1000;
    
    await user.save();
    // Chuẩn bị URL và Nội dung Email
    // LƯU Ý: Phải có biến FRONTEND_URL trong file .env (ví dụ: http://localhost:3000)
    const verifyUrl = `${process.env.FRONTEND_URL}/verify-email/${verifyToken}`;
    const message = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <h2 style="color: #333; text-align: center;">Chào mừng bạn đến với Cửa Hàng!</h2>
        <p>Xin chào <strong>${user.name}</strong>,</p>
        <p>Cảm ơn bạn đã đăng ký tài khoản. Để hoàn tất đăng ký và bắt đầu mua sắm, vui lòng xác thực địa chỉ email của bạn bằng cách click vào nút bên dưới:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verifyUrl}" style="background-color: #000; color: #fff; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Xác Thực Email Của Tôi</a>
        </div>
        <p style="color: #888; font-size: 12px;">Đường link này sẽ hết hạn sau 24 giờ. Nếu bạn không thực hiện đăng ký, vui lòng bỏ qua email này.</p>
      </div>
    `;

    // Gửi email
    try {
      await sendEmail({ email: user.email, subject: "Xác thực tài khoản", html: message });
      res.status(200).json({ success: true, message: "Vui lòng kiểm tra Email để xác thực!" });
    } catch (error) {
      console.log("❌ LỖI GỬI MAIL CHI TIẾT:", error);
      return res.status(500).json({ message: "Lỗi gửi mail xác thực. Vui lòng thử lại!" });
    }
  } catch (err) {
    console.log("❌ LỖI SERVER TỔNG:", err);
    res.status(500).json({ message: "Lỗi Server" });
  }
});
// ==========================================
// 2. route GET /api/user/verify-email/:token (MỚI THÊM)
// ==========================================
router.get("/verify-email/:token", async (req, res) => {
  try {
    // Tìm user có token khớp và token phải chưa hết hạn ($gt = greater than now)
    const user = await User.findOne({
      verifyToken: req.params.token,
      verifyTokenExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: "Link xác thực không hợp lệ hoặc đã hết hạn!" });
    }

    // Nếu ok -> Xác thực thành công
    user.isVerified = true;
    user.verifyToken = undefined;
    user.verifyTokenExpire = undefined;
    
    await user.save();

    res.status(200).json({ success: true, message: "Xác thực tài khoản thành công! Bạn có thể đăng nhập ngay bây giờ." });
  } catch (error) {
    console.log("Lỗi xác thực: ", error);
    res.status(500).send("Server error");
  }
});

// ==========================================
// 3. route POST /api/user/login (ĐÃ SỬA: Chặn nếu chưa xác thực)
// ==========================================
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    let user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Tài khoản hoặc mật khẩu không đúng!" }); // Nên đổi tiếng Việt cho mượt
    
    const isMatch = await user.matchPassword(password);
    if (!isMatch) return res.status(400).json({ message: "Tài khoản hoặc mật khẩu không đúng!" });

    // MỚI THÊM: Chặn nếu chưa xác thực email
    if (!user.isVerified) {
      return res.status(403).json({ message: "Tài khoản của bạn chưa được xác thực. Vui lòng kiểm tra Email!" });
    }

    const payload = {
      user: {
        id: user._id,
        role: user.role,
      },
    };
    
    const accessToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1d" });
    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: "1d" });
    
    user.refreshToken = refreshToken;
    await user.save();

    res.json({
        user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            avatar : user.avatar
        },
        accessToken,
        refreshToken,
    });
      
  } catch (err) {
    console.error(err);
    res.status(500).send("server Error");
  }
});

// ==========================================
// Các Routes Dưới Này Giữ Nguyên
// ==========================================

// route POST /api/users/refresh-token
router.post("/refresh-token", async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) return res.status(401).json({ message: "No token provided" });

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.user.id);

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    const payload = {
      user: {
        id: user._id,
        role: user.role,
      },
    };

    const newAccessToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "2h" });
    res.json({ accessToken: newAccessToken });
  } catch (err) {
    console.error(err);
    res.status(403).json({ message: "Invalid or expired refresh token" });
  }
});

// route GET /api/users/profile
router.get("/profile", protect, async (req, res) => {
  res.json(req.user);
});

// PUT /api/users/profile
router.put('/profile', protect, upload.single('avatar'), async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: "User not found" });

        user.name = req.body.name || user.name;
        if (req.body.password) user.password = req.body.password;

        if (req.file) {
            const cloudResult = await uploadToCloudinary(req.file.buffer);
            user.avatar = cloudResult.secure_url;
        }

        const updatedUser = await user.save();
        res.json({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,
            avatar: updatedUser.avatar, 
        });
    } catch (error) {
        res.status(500).json({ message: "Cập nhật thất bại!" });
    }
});
// Route: POST /api/users/verify-access
// ==========================================
router.post('/verify-access', async (req, res) => {
  try {
    const { authRfid, password, userId } = req.body;

    // 1. Tìm thông tin Admin đang đăng nhập
    const adminUser = await User.findById(userId);
    if (!adminUser) return res.status(404).json({ message: "Không tìm thấy tài khoản!" });
    
    // Đảm bảo chỉ Admin mới có quyền qua cửa
    if (adminUser.role !== 'admin') {
      return res.status(403).json({ message: "Bạn không có quyền truy cập khu vực này!" });
    }

    // 2. Kịch bản A: Xác thực bằng Thẻ RFID
    if (authRfid) {
      if (adminUser.rfidCard !== authRfid) {
        return res.status(401).json({ message: "Thẻ RFID không khớp với tài khoản Admin của bạn!" });
      }
      return res.status(200).json({ message: "Xác thực RFID thành công" });
    }

    // 3. Kịch bản B: Xác thực bằng Mật khẩu
    if (password) {
      const isMatch = await bcrypt.compare(password, adminUser.password);
      if (!isMatch) {
        return res.status(401).json({ message: "Mật khẩu không chính xác!" });
      }
      return res.status(200).json({ message: "Xác thực mật khẩu thành công" });
    }

    res.status(400).json({ message: "Thiếu thông tin xác thực" });

  } catch (error) {
    res.status(500).json({ message: "Lỗi Server", error: error.message });
  }
});

module.exports = router;