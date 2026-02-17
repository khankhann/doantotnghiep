const express = require("express");

const Checkout = require("../models/Checkout");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const Order = require("../models/Order");
const { protect } = require("../middleware/authMiddleware");
const router = express.Router();
// POST / api / checkout

router.post("/", protect, async (req, res) => {
  const { checkoutItems, shippingAddress, paymentMethod, totalPrice } = req.body;

  if (!checkoutItems || checkoutItems.length === 0) {
    return res.status(400).json({ message: "no items in checkout" });
  }
  try {
    const newCheckout = await Checkout.create({
      user: req.user._id,
      checkoutItems: checkoutItems,
      shippingAddress,
      paymentMethod,
      totalPrice,
      paymentStatus: "Pending",
      isPaid: false,
    });
    console.log(`Checkout created for user :  ${req.user._id}`);
    res.status(201).json(newCheckout);
  } catch (err) {
    console.error("error Creating checkout session", err);
    res.status(500).json({message : "server error "})
  }
});

// PUT / api / checkout / :id/pay
router.put("/:id/pay", protect, async (req, res) => {
  const { paymentStatus, paymentDetails } = req.body;

  try {
    const checkout = await Checkout.findById(req.params.id);
    if (!checkout) {
      return res.status(404).json({ message: "Checkout not found " });
    }
    if(checkout.user.toString() !== req.user._id.toString()){
      return res.status(401).json({message :" Not authorized "})
    }
    if (paymentStatus === "paid") {
      checkout.isPaid = true;
      checkout.paymentStatus = paymentStatus;
      checkout.paymentDetails = paymentDetails;
      checkout.paidAt = Date.now();
      await checkout.save();
      res.status(200).json(checkout);
    } else {
      res.status(400).json({ message: "invalid payment status" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "server error" });
  }
});

// post / api / checkout /:id/ finalize

router.post("/:id/finalize", protect, async (req, res) => {
  try {
    const checkout = await Checkout.findById(req.params.id);
    if (!checkout) {
      return res.status(404).json({ message: "checkout not found" });
    }
    if (checkout.user.toString() !== req.user._id.toString()) {
        return res.status(401).json({ message: "Not authorized" });
    }
    if (checkout.isPaid && !checkout.isFinalized) {
      const finalOrder = await Order.create({
        user: checkout.user,
        orderItems: checkout.checkoutItem,
        shippingAddress: checkout.shippingAddress,
        paymentMethod: checkout.paymentMethod,
        totalPrice: checkout.totalPrice,
        isPaid: true,
        paidAt: checkout.paidAt,
        isDelivered: false,
        paymentStatus: "paid",
        paymentDetails: checkout.paymentDetails,
      });
      (checkout.isFinalized = true),
       (checkout.finalizedAt = Date.now());
      await checkout.save();
      await Cart.findOneAndDelete({ user: checkout.user });
      res.status(201).json(finalOrder);
    } else if (checkout.isFinalized) {
      res.status(404).json({ message: "checkout already finalized" });
    } else {
      res.status(404).json({ message: "checkout is not paid" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "server error " });
  }
});
module.exports = router;
