const express = require("express");
const Cart = require("../models/Cart");
const Order = require("../models/Order"); 
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
    const qty = quantity && !isNaN(quantity) ? Number(quantity) : 1;
    const basePrice = Number(product.price || 0);

   
    let userDiscount = 0;

    if (!userId) {
      // Guest chưa đăng nhập -> Tính là khách mới
      userDiscount = 10;
    } else {
      const lastCreatedOrder = await Order.findOne({ user: userId }).sort({ createdAt: -1 });
      const lastPaidOrder = await Order.findOne({ user: userId, isPaid: true }).sort({ paidAt: -1 });

      if (!lastCreatedOrder && !lastPaidOrder) {
        userDiscount = 10; // Chưa từng mua
      } else {
        let latestActivityTime = 0;
        const createdTime = lastCreatedOrder ? new Date(lastCreatedOrder.createdAt).getTime() : 0;
        const paidTime = lastPaidOrder ? new Date(lastPaidOrder.paidAt).getTime() : 0;
        
        latestActivityTime = Math.max(createdTime, paidTime);

        if (latestActivityTime > 0) {
          const diffInDays = (Date.now() - latestActivityTime) / (1000 * 60 * 60 * 24);
          if (diffInDays >= 15) {
            userDiscount = 10; // Đã 15 ngày không mua
          }
        }
      }
    }

    let productDiscount = 0;

    // Truy vấn 10 sản phẩm có số lượng 'sold' thấp nhất
    const bottom10Products = await Product.find()
      .sort({ sold: 1 }) 
      .limit(10)         
      .select('_id createdAt'); 

    // Lấy danh sách ID của 10 đứa này
    const bottom10Ids = bottom10Products.map(p => p._id.toString());

    // Kiểm tra xem sản phẩm khách đang thêm vào giỏ có nằm trong danh sách "Đội sổ" không?
    const isBottom10 = bottom10Ids.includes(product._id.toString());

    if (isBottom10) {
      // Tính tuổi đời từ lúc tạo ra sản phẩm (createdAt)
      const productAgeDays = (Date.now() - new Date(product.createdAt).getTime()) / (1000 * 60 * 60 * 24);

      if (productAgeDays >= 20) {
        productDiscount = 50; // Tạo > 20 ngày mà lọt top ế -> 50%
      } else if (productAgeDays >= 10) {
        productDiscount = 30; // Tạo > 10 ngày mà lọt top ế -> 30%
      }
    }

    const finalDiscountPercent = Math.max(userDiscount, productDiscount);
    const finalPrice = basePrice - (basePrice * finalDiscountPercent / 100);

    let cart = await getCart(userId, guestId);

    if (cart) {
      const productIndex = cart.products.findIndex(
        (p) =>
          p.productId.toString() === productId &&
          p.size === size &&
          p.color === color,
      );

      if (productIndex > -1) {
        cart.products[productIndex].quantity += qty;
        cart.products[productIndex].price = finalPrice; // Cập nhật lại giá sale mới nhất
      } else {
        cart.products.push({
          productId,
          name: product.name,
          image: product.images[0].url,
          price: finalPrice,
          size,
          color,
          quantity: qty,
        });
      }

      // Tính lại tổng tiền của cả giỏ
      cart.totalPrice = cart.products.reduce(
        (acc, item) => acc + item.price * item.quantity,
        0,
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
            price: finalPrice,
            size,
            color,
            quantity: qty,
          },
        ],
        totalPrice: finalPrice * qty,
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
        p.color === color, // Biến color giờ đã có giá trị
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
        0,
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
router.delete("/", async (req, res) => {
  const { productId, size, color, guestId, userId } = req.body;
  try {
    let cart = await getCart(userId, guestId);
    if (!cart) return res.status(404).json({ message: "cart not found " });
    const productIndex = cart.products.findIndex(
      (p) =>
        p.productId.toString() === productId &&
        p.size === size &&
        p.color === color,
    );

    if (productIndex > -1) {
      cart.products.splice(productIndex, 1);

      cart.totalPrice = cart.products.reduce(
        (acc, item) => acc + item.price * item.quantity,
        0,
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
    if (!cart)
      return res.status(404).json({ message: "Không tìm thấy giỏ hàng" });

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
router.get("/", async (req, res) => {
  const { userId, guestId } = req.query;

  try {
    const cart = await getCart(userId, guestId);
    if (cart) {
      res.json(cart);
    } else {
      res.status(404).json({ message: "cart not found " });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "server error " });
  }
});

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
              item.color === guestItem.color,
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
          0,
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
