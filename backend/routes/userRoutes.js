const express = require("express");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const { protect } = require("../middleware/authMiddleware");
const router = express.Router();
const multer = require("multer");
const cloudinary = require("cloudinary").v2;

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
// route POST / api / user / register

router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  try {
    // register
    // res.send({name, email , password})
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: "User already exists" });
    user = new User({ name, email, password });
    
    // create jwt payload
    const payload = {
        user: {
            id: user._id,
            role: user.role,
        },
    };
    // sign va return the token voi user data
    const accessToken =jwt.sign(payload,process.env.JWT_SECRET, {expiresIn: "5m" })
    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {expiresIn: "1d"})
    //trong vong 1p se het han token
    user.refreshToken = refreshToken
    await user.save();
    //   (err, token) => {
    //     if (err) throw err;
    //   }
        // gui user and token trong yeu cau gui di  status(201)
        res.json({
          user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            avatar : user.avatar
          },
          accessToken, refreshToken
        });
      
    

    // gửi thử  user tren posman co nhan duoc khong
    // res.status(201).json({
    //   user: {
    //     _id: user._id,
    //     name: user.name,
    //     email: user.email,
    //     role: user.role,
    //   },
    // });
  } catch (err) {
    console.log("loi server", err);
    res.status(500).send("Server error ");
  }
});

// route POST/ api/ user/ Login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    // tim user bang email
    let user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "invalid credentials" });
    const isMatch = await user.matchPassword(password);

    if (!isMatch)
      return res.status(400).json({ message: "Invalid Credentials" });
    const payload = {
      user: {
        id: user._id,
        role: user.role,
      },
    };
    const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    const refreshToken = jwt.sign(payload,process.env.JWT_REFRESH_SECRET,{ 
      expiresIn: "1d" })
    user.refreshToken = refreshToken
    await user.save()

    //   (err, token) => {
    //     if (err) throw err;
    //   }
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

// route POST /api/users/refresh-token
router.post("/refresh-token", async (req, res) => {
  // 1. Lấy refreshToken từ body client gửi lên
  const { refreshToken } = req.body;

  // Nếu không có token thì đuổi về
  if (!refreshToken)
    return res.status(401).json({ message: "No token provided" });

  try {
    // 2. Kiểm tra Token có hợp lệ không (Dùng khóa bí mật REFRESH)
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // 3. Tìm user sở hữu token này
    const user = await User.findById(decoded.user.id);

    // 4. Kiểm tra xem Token này có khớp với cái đang lưu trong DB không?
    // (Chống trường hợp Hacker dùng token cũ đã bị user đăng xuất)
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    // 5. Nếu ngon lành -> Cấp Access Token MỚI
    const payload = {
      user: {
        id: user._id,
        role: user.role,
      },
    };

    const newAccessToken = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "15m",
    });

    // Trả vé mới về
    res.json({ accessToken: newAccessToken });
  } catch (err) {
    console.error(err);
    res.status(403).json({ message: "Invalid or expired refresh token" });
  }
});

// route GET / api / users/ profile
router.get("/profile", protect, async (req, res) => {
  res.json(req.user);
});

// PUT /api/users/profile
router.put('/profile', protect, upload.single('avatar'), async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user) {
        user.name = req.body.name || user.name;
        user.email = req.body.email || user.email;
        
        if (req.body.password) {
            user.password = req.body.password;
        }

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
            avatar: updatedUser.avatar, // Nhớ trả về avatar mới
        });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});





module.exports = router;
