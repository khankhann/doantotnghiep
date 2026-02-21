const express = require("express");
const Product = require("../models/Product");
const { protect, admin } = require("../middleware/authMiddleware");
const router = express.Router();
// route Get / api/ admin / products
// get all products (admin only)
// private/ admin

router.get("/", protect, admin, async (req, res) => {
  try {
    const products = await Product.find({});
    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "server error" });
  }
});

// route Delete / api / admin / produsts
router.delete("/:id", protect, admin, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (product) {
      await product.deleteOne();
      res.status(200).json({ message: "product deleted" });
    } else {
      res.status(404).json({ message: "product not found " });
    }
  } catch (error) {
    res.status(500).json({ message: "server error" });
  }
});

// route Put / api/ admin / products
router.put("/:id", protect, admin, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (product) {
      product.name = req.body.name || product.name;
      product.description = req.body.description || product.description;
      product.price = req.body.price || product.price;
      product.discountPrice = req.body.discountPrice || product.discountPrice;
      product.countInStock = req.body.countInStock || product.countInStock;
      product.sku = req.body.sku || product.sku;
      product.category = req.body.category || product.category;
      product.brand = req.body.brand || product.brand;
      product.sizes = req.body.sizes || product.sizes;
      product.colors = req.body.colors || product.colors;
      product.collections = req.body.collections || product.collections;
      product.material = req.body.material || product.material;
      product.gender = req.body.gender || product.gender;
      product.images = req.body.images || product.images;

      const updatedProduct = await product.save();
      res.status(200).json(updatedProduct);
    } else {
      res.status(404).json({ message: "Product not found " });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/admin/products
// Create new product
router.post("/", protect, admin, async (req, res) => {
    try {
        const productData = req.body;
        
        // Thêm ID của admin tạo ra sản phẩm này
        const product = new Product({
            ...productData,
            user: req.user._id
        });

        const createdProduct = await product.save();
        res.status(201).json(createdProduct);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});


module.exports = router;
