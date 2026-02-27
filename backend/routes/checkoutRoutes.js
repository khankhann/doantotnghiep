const express = require("express");

const Checkout = require("../models/Checkout");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const Order = require("../models/Order");
const { protect } = require("../middleware/authMiddleware");
const router = express.Router();

// POST /api/checkout
router.post("/", protect, async (req, res) => {
  const { checkoutItem, shippingAddress, paymentMethod } = req.body;

  if (!checkoutItem || checkoutItem.length === 0) {
    return res.status(400).json({ message: "no items in checkout" });
  }
  try {
    const mergedItems = [];
    checkoutItem.forEach((item) => {
      const existingItem = mergedItems.find(
        (i) => i.product === item.product && i.size === item.size && i.color === item.color
      );

      if (existingItem) {
        existingItem.quantity += item.quantity;
      } else {
        mergedItems.push(item);
      }
    });

    // ==========================================
    // 🚀 1. LOGIC CHECK KHÁCH HÀNG (TẶNG 10% KHÁCH MỚI/LẶN 15 NGÀY)
    // ==========================================
    let userDiscount = 0; 

    const lastCreatedOrder = await Order.findOne({ user: req.user._id }).sort({ createdAt: -1 });
    const lastPaidOrder = await Order.findOne({ 
      user: req.user._id,
      isPaid: true 
    }).sort({ paidAt: -1 });

    if (!lastCreatedOrder && !lastPaidOrder) {
      userDiscount = 10; 
    } else {
      let latestActivityTime = 0;
      const createdTime = lastCreatedOrder ? new Date(lastCreatedOrder.createdAt).getTime() : 0;
      const paidTime = lastPaidOrder ? new Date(lastPaidOrder.paidAt).getTime() : 0;
      
      latestActivityTime = Math.max(createdTime, paidTime);

      if (latestActivityTime > 0) {
        const diffInDays = (Date.now() - latestActivityTime) / (1000 * 60 * 60 * 24);
        if (diffInDays >= 15) {
          userDiscount = 10; 
        }
      }
    }

    // ==========================================
    // 🚀 2. TÌM 10 SẢN PHẨM Ế NHẤT TỪ DATABASE 
    // ==========================================
    const bottom10ProductsDB = await Product.find()
      .sort({ sold: 1, _id: 1 }) // <--- FIX: Đã thêm _id: 1 để đồng bộ 100% với Frontend
      .limit(10)         
      .select('_id createdAt'); 
    
    const bottom10Ids = bottom10ProductsDB.map(p => p._id.toString());

    // ==========================================
    // 🚀 3. TÍNH TIỀN CHO TỪNG SẢN PHẨM TRONG GIỎ
    // ==========================================
    let calculatedTotalPrice = 0; 
    
    for(let item of mergedItems){
      const realProduct = await Product.findById(item.product || item.productId); 
      if(!realProduct){
        return res.status(404).json({message: "product not exist"});
      }

      let productDiscount = 0;
      const isBottom10 = bottom10Ids.includes(realProduct._id.toString());
      const productAgeDays = (Date.now() - new Date(realProduct.createdAt).getTime()) / (1000 * 60 * 60 * 24);

      if (isBottom10) {
        if (productAgeDays >= 20) {
          productDiscount = 50; 
        } else if (productAgeDays >= 10) {
          productDiscount = 30; 
        }
      }

      // 🚀 CHỐT DEAL
      const finalDiscountPercent = Math.max(userDiscount, productDiscount);

      const finalPrice = realProduct.price - (realProduct.price * finalDiscountPercent / 100);
      const safeQuantity = Number(item.quantity || 1);
     
      item.price = finalPrice;
      item.product = realProduct._id; 
      
      calculatedTotalPrice += (finalPrice * safeQuantity); 
    }

    const newCheckout = await Checkout.create({
      user: req.user._id,
      checkoutItem: mergedItems,
      shippingAddress,
      paymentMethod,
      totalPrice: calculatedTotalPrice,
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

// GET /api/checkout/:id
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

// PUT /api/checkout/:id/pay
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

// POST /api/checkout/:id/finalize
router.post("/:id/finalize", protect, async (req, res) => {
  try {
    const checkout = await Checkout.findById(req.params.id);
    if (!checkout) {
      return res.status(404).json({ message: "checkout not found" });
    }
    if (checkout.user.toString() !== req.user._id.toString()) {
        return res.status(401).json({ message: "Not authorized" });
    }

    const existingOrder = await Order.findOne({ 
        user: checkout.user, 
        paidAt: checkout.paidAt 
    });

    if (existingOrder) {
        if (!checkout.isFinalized) {
            checkout.isFinalized = true;
            checkout.finalizedAt = Date.now();
            await checkout.save();
        }
        return res.status(200).json(existingOrder);
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

      // 🚀 CẬP NHẬT TỒN KHO VÀ LƯỢT BÁN (Đã Fix lỗi logic)
     for(const item of checkout.checkoutItem){
        const productId = item.product || item.productId;
        
        // Dùng findByIdAndUpdate để update trực tiếp, không bị dính lỗi thiếu "lastEditByUser"
        await Product.findByIdAndUpdate(
          productId,
          {
            $inc: { 
              countInStock: -item.quantity, // Trừ đi số lượng khách mua
              sold: item.quantity           // Cộng thêm lượt bán
            }
          }
        );
      }

      checkout.isFinalized = true;
      checkout.finalizedAt = Date.now();
      await checkout.save();
      
      await Cart.findOneAndDelete({ user: checkout.user });
      
      res.status(201).json(finalOrder);

    } else if (checkout.isFinalized) {
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