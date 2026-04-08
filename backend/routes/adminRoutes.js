const express = require("express")
const User = require("../models/User")
const multer = require("multer")
const cloudinary = require("cloudinary").v2
const bcrypt = require("bcryptjs") // 🔥 Bắt buộc phải import bcrypt để check pass
const { protect, admin } = require("../middleware/authMiddleware")
const router = express.Router()

const storage = multer.memoryStorage()
const upload = multer({storage : storage})

// HÀM HỖ TRỢ UPLOAD BUFFER LÊN CLOUDINARY
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

// route Get / api/ admin/ users 
router.get("/", protect , admin , async(req, res)=>{
    try {
        const users = await User.find().select("-password")
        res.json(users)
    }catch (err){
        console.error(err)
        res.status(500).json({message : "server error"})
    }
})

// route post / api/ admin/ users
router.post("/", protect, admin, upload.single("avatar"), async(req, res)=>{
    const {name , email , password , role} = req.body
    try {
        let user = await User.findOne({email})
        if(user){
            return res.status(400).json({message : "user already exists"})
        } 

        let avatarUrl = "";
        if (req.file) {
            const cloudResult = await uploadToCloudinary(req.file.buffer);
            avatarUrl = cloudResult.secure_url;
        }

        user = new User({
            name,
            email, 
            password, // Nhớ đảm bảo password đã được băm trước khi save (trong Model User)
            role: role || "customer",
            avatar: avatarUrl 
        })

        await user.save()
        user.password = undefined;
        res.status(201).json({message : "user created successfully", user})
    }
    catch(err){
        console.error(err)
        res.status(500).json({message : "server error"})
    }
})

// 🔥 UPDATE INFO USER (CÓ CHECK PASS ADMIN)
router.put("/:id", protect, admin , upload.single("avatar"), async(req, res)=>{
    try {
        // 1. Lấy thông tin ông Admin đang thực hiện thao tác
        const currentUser = await User.findById(req.user._id)

        // 2. Chốt chặn: Bắt buộc phải có pass và pass phải đúng
        if (!req.body.currentPassword) {
            return res.status(400).json({ message: "Yêu cầu nhập mật khẩu Admin để xác nhận!" })
        }
        
        const isMatch = await bcrypt.compare(req.body.currentPassword, currentUser.password)
        if (!isMatch) {
            return res.status(401).json({ message: "Mật khẩu Admin không chính xác. Từ chối quyền!" })
        }

        // 3. Nếu qua ải pass, cho phép sửa User mục tiêu
        const user = await User.findById(req.params.id)
        if(user){
            user.name = req.body.name || user.name
            user.email = req.body.email || user.email
            user.role = req.body.role || user.role

            if(req.file){
                const cloudResult = await uploadToCloudinary(req.file.buffer);
                user.avatar = cloudResult.secure_url
            }
            const userUpdate =  await user.save()
            res.json({message : "user updated successfully", user: userUpdate})
        }else{
            res.status(404).json({message : "user not found"})
        }
    }catch (err){
        console.error(err)
        res.status(500).json({message : "server error"})
    }
})

// 🔥 DELETE USER (CÓ CHECK PASS ADMIN)
router.delete("/:id", protect, admin , async(req, res)=>{
    try {
        // 1. Lấy thông tin ông Admin đang thực hiện thao tác
        const currentUser = await User.findById(req.user._id)

        // 2. Chốt chặn: Bắt buộc phải có pass và pass phải đúng
        if (!req.body.currentPassword) {
            return res.status(400).json({ message: "Yêu cầu nhập mật khẩu Admin để xác nhận xóa!" })
        }
        
        const isMatch = await bcrypt.compare(req.body.currentPassword, currentUser.password)
        if (!isMatch) {
            return res.status(401).json({ message: "Mật khẩu Admin không chính xác. Từ chối quyền!" })
        }

        // 3. Nếu qua ải pass, cho phép xóa User mục tiêu
        const user = await User.findById(req.params.id)
        if(user){
            await user.deleteOne()
            res.json({message : "user delete successfully"})
        }else{
            res.status(404).json({message : "user not found"})
        }
    }catch (err){
        console.error(err)
        res.status(500).json({message : "server error"})
    }
})

module.exports = router