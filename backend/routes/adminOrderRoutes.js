const express = require("express");
const Order = require("../models/Order");
const Notification = require("../models/Notification"); 
const Product = require("../models/Product");
const { protect, admin } = require("../middleware/authMiddleware");
const router = express.Router();

// 1. GET /api/admin/orders
// Lấy toàn bộ danh sách đơn hàng
router.get("/", protect, admin, async (req, res) => {
  try {
    const orders = await Order.find({}).populate("user", "name email ");
   if (orders) {
      res.json(orders);
    } else {
      res.status(404).json({ message: "Không tìm thấy đơn hàng!" });
    }
    
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// 2. GET /api/admin/orders/user/:id
// Lấy toàn bộ đơn hàng của 1 khách hàng
router.get("/user/:id", protect, admin, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.params.id }).sort({
      createdAt: -1,
    });
    res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server khi tìm lịch sử đơn hàng" });
  }
});

// 3. POST /api/admin/orders/pos
// Tạo đơn hàng bán tại quầy POS
router.post("/pos", protect, admin, async (req, res) => {
  try {
    const { orderItems, customerName, customerPhone, totalPrice } = req.body;

    if (orderItems && orderItems.length === 0) {
      return res.status(400).json({ message: "Không có sản phẩm nào trong đơn hàng" });
    }

    const order = new Order({
      user: req.user._id, // Admin là người tạo đơn
      orderItems,
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
      isPaid: true,           
      paidAt: Date.now(),
      isDelivered: true,      
      deliveredAt: Date.now(),
      status: "Delivered"     
    });

    const createdOrder = await order.save();

    for (const item of orderItems) {
      const product = await Product.findById(item.productId);
      if (product) {
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

// 4. GET /api/admin/orders/:id  <--- Bổ sung Route lấy chi tiết 1 đơn hàng ở đây
router.get("/:id", protect, admin, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("user", "name email phone")

    if (order) {
      res.json(order);
    } else {
      res.status(404).json({ message: "Không tìm thấy đơn hàng!" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error khi lấy chi tiết đơn hàng" });
  }
});

// 5. PUT /api/admin/orders/:id
// Cập nhật trạng thái đơn hàng
router.put("/:id", protect, admin, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate("user", "name");
    if (order) {
      order.status = req.body.status || order.status;
      if (req.body.status === "Delivered") {
        order.isDelivered = true;
        order.deliveredAt = Date.now();
      } else if (req.body.status) {
        order.isDelivered = false;
        order.deliveredAt = null;
      }

      const updatedOrder = await order.save();
      const userId = order.user?._id;
      
      if (userId) {
        console.log("Server đang kết nối cho user id: ", userId);
        const message = `Đơn hàng ${updatedOrder._id} của bạn đã được ${order.status}`;
        
        await Notification.create({
          user: userId,
          message,
          type: "ORDER_UPDATE",
          orderId: updatedOrder._id,
        });

        if (req.io) {
          req.io.to(userId.toString()).emit("receive_notification", {
            message,
            type: "ORDER_UPDATE",
            orderId: updatedOrder._id,
            read: false,
            createdAt: new Date()
          });
        }
      }
      res.json(updatedOrder);
    } else {
      res.status(404).json({ message: "Order not found" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// 6. DELETE /api/admin/orders/:id
// Xóa đơn hàng theo Id
router.delete("/:id", protect, admin, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (order) {
      await order.deleteOne();
      res.json({ message: "Order deleted successfully" });
    } else {
      res.status(404).json({ message: "Order not found" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});
module.exports = router;