const express = require("express");

const Checkout = require("../models/Checkout");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const Order = require("../models/Order");
const { protect } = require("../middleware/authMiddleware");
const router = express.Router();
// POST / api / checkout


router.post("/", protect, async (req, res) => {
  const { checkoutItem, shippingAddress, paymentMethod, totalPrice } = req.body;

  if (  !checkoutItem || checkoutItem.length === 0) {
    return res.status(400).json({ message: "no items in checkout" });
  }
  try {
    const mergedItems = []
    checkoutItem.forEach((item)=> {
      const existingItem = mergedItems.find(
        (i) => i.product === item.product && i.size === item.size && i.color === item.color
      )
      if(existingItem){
        existingItem.quantity += item.quantity
      }else{
        mergedItems.push(item)
      }
    })

    const newCheckout = await Checkout.create({
      user: req.user._id,
      checkoutItem: mergedItems,
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

// GET / api / chechout / :id
router.get('/:id', protect, async(req, res)=>{
  try {
const checkout = await Checkout.findById(req.params.id)
if(checkout){
  res.status(200).json(checkout)
}else{
  res.status(404).json({message : "khong tim thay "})
}
  }catch(error){
console.error(error)
res.status(500).json({message : "Server error"})
  }
})

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
      if(checkout.isPaid){
        return res.status(200).json(checkout)
      }
      checkout.isPaid = true;
      checkout.paymentStatus = "paid";
      checkout.paymentDetails = paymentDetails || {};
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

    // --- 2. LỚP BẢO VỆ CHỐNG TRÙNG ĐƠN (Race Condition) ---
    // Trước khi tạo, kiểm tra xem đã có Order nào tạo từ Checkout này chưa
    // (Dùng paidAt làm key, hoặc tốt hơn là thêm trường checkoutId vào Order schema nếu có)
    const existingOrder = await Order.findOne({ 
        user: checkout.user, 
        paidAt: checkout.paidAt 
    });

    if (existingOrder) {
        // Nếu tìm thấy đơn hàng đã tồn tại -> Update checkout cho khớp rồi trả về luôn
        if (!checkout.isFinalized) {
            checkout.isFinalized = true;
            checkout.finalizedAt = Date.now();
            await checkout.save();
        }
        return res.status(200).json(existingOrder);
    }
    // -----------------------------------------------------

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

      checkout.isFinalized = true;
      checkout.finalizedAt = Date.now();
      await checkout.save();
      
      await Cart.findOneAndDelete({ user: checkout.user });
      
      res.status(201).json(finalOrder);

    } else if (checkout.isFinalized) {
        // Trường hợp checkout đã đánh dấu finalized (logic cũ của bạn)
        // Code bên trên (existingOrder) đã cover phần này rồi, nhưng giữ lại làm backup cũng được
        const oldOrder = await Order.findOne({ 
            user: checkout.user, 
            paidAt: checkout.paidAt 
        }).sort({ createdAt: -1 });

        if (oldOrder) {
            return res.status(200).json(oldOrder);
        } else {
            return res.status(404).json({ message: "Order data consistency error" });
        }
    } else {
      res.status(400).json({ message: "Checkout is not paid yet" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "server error " });
  }
});
module.exports = router;
