const express = require("express");
const Order = require("../models/Order");
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
    const order = await Order.findById(req.params.id);
    if (order) {
      order.status = req.body.status || order.status;
      order.isDelivered =
        req.body.status === "Delivered" ? true : order.isDelivered;
      order.deliveredAt =
        req.body.status === "Delivered" ? Date.now() : order.deliveredAt;

      const updatedOrder = await order.save();
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
