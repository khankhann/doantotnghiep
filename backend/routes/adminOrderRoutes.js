const express = require("express");
const Order = require("../models/Order");
const Notification = require("../models/Notification"); 
const Product = require("../models/Product")
const { protect, admin } = require("../middleware/authMiddleware");
const router = express.Router();

// route Get / api/ admin / orders
// get all orders (admin only)
// private/ admin
router.get("/", protect, admin, async (req, res) => {
  try {
    const orders = await Order.find({}).populate("user", "name email");
   
    res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "server error" });
  }
});

// route Put / api / admin/ orders/:id
// update order status by Id
// private / admin
router.put("/:id", protect, admin, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate("user", "name");
    if (order) {
      order.status = req.body.status || order.status;
      if(req.body.status === "Delivered"){
        order.isDelivered = true
        order.deliveredAt = Date.now()
      }else if (req.body.status){
        order.isDelivered = false
        order.deliveredAt = null
      }
     

      const updatedOrder = await order.save();
    const userId = order.user?._id;
    if(userId){
      console.log("server dang ket noi cho user id ", userId)
      const message = `Don hang ${updatedOrder._id} cua ban da duoc ${order.status}`
      
      await Notification.create({
        user : userId,
        message,
        type: "ORDER_UPDATE",
        orderId: updatedOrder._id,
      })
      if(req.io ){
        
        req.io.to(userId.toString()).emit("receive_notification",{
          message,
          type: "ORDER_UPDATE",
          orderId: updatedOrder._id,
          read: false,
          createdAt: new Date()
        })
      }
    }
      res.json(updatedOrder);
    } else {
      res.status(404).json({ message: "order not found " });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "server error" });
  }
});

// route Get / api/ admin/ orders/user/:id
// Lấy toàn bộ đơn hàng của 1 khách hàng (Dành cho Admin)
// private / admin
router.get("/user/:id", protect, admin, async (req, res) => {
  try {
    // Tìm tất cả đơn hàng có trường 'user' bằng với ID truyền lên
    const orders = await Order.find({ user: req.params.id }).sort({
      createdAt: -1, // Đơn mới nhất xếp trên cùng
    });
    res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server khi tìm lịch sử đơn hàng" });
  }
});

module.exports = router;

// route delete / api / admin/ orders/:id
// // delete order by Id
// // private / admin

router.delete("/:id", protect, admin, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (order) {
      await order.deleteOne();
      res.json({ message: "order deleted successfully" });
    } else {
      res.status(404).json({ message: "order not found " });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "server error" });
  }
});

// route post / api/ admin/ orders/ pos 
router.post("/pos", protect, admin, async (req, res) => {
  try {
    const { orderItems, customerName, customerPhone, totalPrice } = req.body;

    if (orderItems && orderItems.length === 0) {
      return res.status(400).json({ message: "Không có sản phẩm nào trong đơn hàng" });
    }

    // 1. Tạo đơn hàng mới
    const order = new Order({
      user: req.user._id, // Admin là người tạo đơn này
      orderItems,
      // Lưu thông tin khách vãng lai vào shippingAddress cho đúng chuẩn Schema hiện tại
      shippingAddress: {
        fullName: customerName,
        phone: customerPhone,
        address: "Mua tại cửa hàng (POS)",
        city: "Tại quầy",
        postalCode: "00000",
        country: "VN"
      },
      paymentMethod: "VietQR - POS",
      itemsPrice: totalPrice,
      taxPrice: 0,
      shippingPrice: 0,
      totalPrice: totalPrice,
      isPaid: true,           // Bán tại quầy thì xác nhận đã thanh toán luôn
      paidAt: Date.now(),
      isDelivered: true,      // Khách lấy hàng luôn
      deliveredAt: Date.now(),
      status: "Delivered"     // Cập nhật status thành Delivered cho đồng bộ
    });

    const createdOrder = await order.save();

    // 2. TRỪ TỒN KHO THÔNG MINH
    for (const item of orderItems) {
      // Tìm sản phẩm trong MongoDB
      const product = await Product.findById(item.productId);
      if (product) {
        // Trừ đi số lượng khách mua
        product.countInStock = product.countInStock - item.quantity;
        await product.save();
      }
    }

    res.status(201).json(createdOrder);
  } catch (error) {
    console.error("Lỗi tạo đơn POS:", error);
    res.status(500).json({ message: "Lỗi Server khi tạo đơn POS" });
  }
});

module.exports = router;
