const express = require("express");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

const getCart = async (userId, guestId) => {
  if (userId) {
    return await Cart.findOne({ user: userId });
  } else if (guestId) {
    return await Cart.findOne({ guestId });
  }
  return null;
};

// POST /api/cart
// add a product to the cart
router.post("/", async (req, res) => {
  const { productId, quantity, size, color, guestId, userId } = req.body;
  try {
    const product = await Product.findById(productId);
    if (!product) {
        return res.status(404).json({ message: "Product not found" });
    }
    const qty = quantity && !isNaN(quantity) ? Number(quantity) : 1
    let cart = await getCart(userId, guestId);

    if (cart) {
     
      const productIndex = cart.products.findIndex((p) => 
        p.productId.toString() === productId &&
        p.size === size &&
        p.color === color
      );
  

      if (productIndex > -1) {
       
        cart.products[productIndex].quantity += qty;
      } else {

        cart.products.push({
          productId,
          name: product.name,
          image: product.images[0].url, 
          price: product.price,
          size,
          color,
          quantity:qty,
        });
      }

      cart.totalPrice = cart.products.reduce(
        (acc, item) => acc + item.price * item.quantity,
        0
      );

      await cart.save();
      return res.status(200).json(cart);
      
    } else {

      const newCart = await Cart.create({
        user: userId ? userId : undefined, 
        guestId: guestId ? guestId : "guest_" + new Date().getTime(),
        products: [
          {
            productId,
            name: product.name,
            image: product.images[0].url,
            price: product.price,
            size,
            color,
            quantity:qty,
          },
        ],
        totalPrice: product.price * qty,
      });
      return res.status(201).json(newCart);
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

// route Put / api/ cart 
// update product 
// PUT /api/cart
// Update product quantity in cart
router.put("/", async (req, res) => {
  // SỬA 1: Thêm 'color' vào destructuring
  const { productId, quantity, size, color, guestId, userId } = req.body;

  try {
    let cart = await getCart(userId, guestId);
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    const productIndex = cart.products.findIndex(
      (p) =>
        p.productId.toString() === productId &&
        p.size === size &&
        p.color === color // Biến color giờ đã có giá trị
    );

    // SỬA 2: Đưa logic save và return vào trong block if
    if (productIndex > -1) {
      if (quantity > 0) {
        cart.products[productIndex].quantity = quantity;
      } else {
        cart.products.splice(productIndex, 1); // Xóa nếu số lượng <= 0
      }

      cart.totalPrice = cart.products.reduce(
        (acc, item) => acc + item.price * item.quantity,
        0
      );

      await cart.save();
      return res.status(200).json(cart);
    } else {
      return res.status(404).json({ message: "Product not found in cart" });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

// route Delete / api / cart 
// remove Product 
router.delete("/", async (req, res)=> {
    const {productId , size , color , guestId , userId} = req.body 
    try{ 
        let cart = await getCart(userId , guestId)
        if(!cart) return res.status(404).json({message : "cart not found "})
            const productIndex = cart.products.findIndex(
        (p)=> 
            p.productId.toString() === productId
         && p.size === size 
         && p.color === color )

      if (productIndex > -1) {
      cart.products.splice(productIndex, 1);
      
      cart.totalPrice = cart.products.reduce(
        (acc, item) => acc + item.price * item.quantity,
        0
      );
      
      await cart.save();
      return res.status(200).json(cart);
    } else {
      return res.status(404).json({ message: "Product not found in cart" });
    }
    
  } catch (err) { 
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

// route Delete / api / cart 
// remove cart 

router.delete("/clear", async (req, res) => {
  const { guestId, userId } = req.body;
  try {
    let cart = await getCart(userId, guestId);
    if (!cart) return res.status(404).json({ message: "Không tìm thấy giỏ hàng" });

    // Xóa sạch mảng products và reset tổng tiền
    cart.products = [];
    cart.totalPrice = 0;

    await cart.save();
    return res.status(200).json(cart); // Trả về giỏ hàng trống { products: [], totalPrice: 0 }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}); 





// Get / api / cart 
// get logged  user or guest user 
router.get("/", async (req, res)=>{
    const {userId, guestId} = req.query

    try {
        const cart = await getCart(userId , guestId)
        if(cart){
            res.json(cart)
        }else {
            res.status(404).json({message: "cart not found "})

        }
    }catch (err){
        console.error(err)
        res.status(500).json({message : "server error "})
    }
})



// Post / api / cart/ merge 
// Route Merge Cart (Gộp giỏ hàng Guest vào User)
router.post("/merge", protect, async (req, res) => {
  const { guestId } = req.body;

  try {
    // 1. Tìm cả 2 giỏ hàng
    const guestCart = await Cart.findOne({ guestId });
    const userCart = await Cart.findOne({ user: req.user._id });

    // 2. Nếu có giỏ hàng khách
    if (guestCart) {
      if (guestCart.products.length === 0) {
        return res.status(400).json({ message: "Guest cart is empty" });
      }

      if (userCart) {
        // TRƯỜNG HỢP A: User cũng đã có giỏ hàng -> GỘP (MERGE)
        guestCart.products.forEach((guestItem) => {
          const productIndex = userCart.products.findIndex(
            (item) =>
              item.productId.toString() === guestItem.productId.toString() &&
              item.size === guestItem.size &&
              item.color === guestItem.color
          );

          if (productIndex > -1) {
            // Sản phẩm trùng -> Cộng dồn số lượng
            userCart.products[productIndex].quantity += guestItem.quantity;
          } else {
            // Sản phẩm chưa có -> Thêm vào
            userCart.products.push(guestItem);
          }
        });

        // Tính lại tổng tiền
        userCart.totalPrice = userCart.products.reduce(
          (acc, item) => acc + item.price * item.quantity,
          0
        );

        await userCart.save();

        // Xóa giỏ hàng khách sau khi gộp xong
        try {
          await Cart.findOneAndDelete({ guestId });
        } catch (err) {
          console.error("Error deleting guest cart", err);
        }

        return res.status(200).json(userCart);

      } else {
        guestCart.user = req.user._id;
        guestCart.guestId = undefined;
        await guestCart.save(); 
        return res.status(200).json(guestCart);
      }
    } else {
      // 3. Nếu không có giỏ hàng khách
      if (userCart) {
        return res.status(200).json(userCart);
      }
      return res.status(404).json({ message: "Guest cart not found" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" }); 
  }
});


module.exports = router;