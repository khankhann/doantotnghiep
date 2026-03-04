const express = require("express")
const Order = require("../models/Order")
const CheckOut = require("../models/Checkout")
const {protect} = require("../middleware/authMiddleware")
const router = express.Router()

// router Get / api / orders/ my-orders 
// get logged-in user order 
// private 

router.get("/my-orders", protect , async(req, res)=>{
    try { 
const orders = await Order.find({user : req.user._id}).sort({
    createdAt: -1,
})
res.json(orders)
    }catch(err){
        console.error(err)
        res.status(500).json({message : "server error"})
    }
})

// router get / api / orders / :id
// get order detail by Id 
// private 

router.get("/:id", protect , async(req, res)=>{
    try {
        const order = await Order.findById(req.params.id).populate(
            "user", "name email"
        )
        if(!order){
            return res.status(400).json({message : "Order not found "})
        }
        if(order.user._id.toString() !== req.user._id.toString()){
            return res.status(400).json({message : "not authorized to view this order "})
        }
        res.json(order)
    }catch (err){
        console.error(err)
        res.status(500).json({message : "server error"})
    }
})

// Xoá đơn hàng (Nhớ có middleware protect để bắt buộc đăng nhập mới được xoá)
router.delete("/:id", protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    }

    // Tuỳ logic của fen: 
    // 1. Nếu muốn user chỉ được xoá đơn CỦA HỌ:
    if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: "Không có quyền xoá đơn này" });
    }

    await order.deleteOne();
    res.status(200).json({ message: "Đã xoá đơn hàng thành công" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server khi xoá đơn hàng" });
  }
});



module.exports = router 
