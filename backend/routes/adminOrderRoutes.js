const express = require("express");
const Order = require("../models/Order");
const Notification = require("../models/Notification"); 
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

module.exports = router;
