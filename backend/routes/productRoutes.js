const express = require("express");
const Product = require("../models/Product");
const Category = require("../models/Category");
const Notification = require("../models/Notification");
const User = require("../models/User");
const { protect, admin } = require("../middleware/authMiddleware");

const router = express.Router();
 
router.post("/", protect, admin, async (req, res) => {
  try {
    const {
      name, description, price, discountPrice, countInStock, category, brand, 
      attributes, variants, images, isFeatured, isPublished, tags, dimensions, weight, sku
    } = req.body;

    const product = new Product({
      name, description, price, discountPrice, countInStock, category, brand,
      attributes, 
      variants,   
      images, isFeatured, isPublished, tags, dimensions, weight, sku,
      user: req.user._id, 
      lastEditByUser: req.user._id,
    });
    
    const newProduct = await product.save();
    res.status(201).json(newProduct);
  } catch (err) {
    console.error("Lỗi tạo sản phẩm:", err);
    res.status(500).json({ message: "Lỗi Server khi tạo sản phẩm" });
  }
});
 
router.put("/:id", protect, admin, async (req, res) => {
  try {
    const {
      name, description, price, discountPrice, countInStock, category, brand,
      attributes, variants, images, isFeatured, isPublished, tags, dimensions, weight, sku
    } = req.body;

    const product = await Product.findById(req.params.id);
    if (product) {
      product.name = name || product.name;
      product.description = description || product.description;
      product.price = price !== undefined ? price : product.price;
      product.discountPrice = discountPrice !== undefined ? discountPrice : product.discountPrice;
      product.countInStock = countInStock !== undefined ? countInStock : product.countInStock;
      product.category = category || product.category;
      product.brand = brand || product.brand;
      
      product.attributes = attributes || product.attributes;
      product.variants = variants || product.variants;
      
      product.sizes = undefined;
      product.colors = undefined;
      product.material = undefined;
      product.gender = undefined;

      product.images = images || product.images;
      product.isFeatured = isFeatured !== undefined ? isFeatured : product.isFeatured;
      product.isPublished = isPublished !== undefined ? isPublished : product.isPublished;
      product.tags = tags || product.tags;
      product.dimensions = dimensions || product.dimensions;
      product.weight = weight || product.weight;
      product.sku = sku || product.sku;
      product.lastEditByUser = req.user._id;

      const updatedProduct = await product.save();
      res.json(updatedProduct);
    } else {
      res.status(404).json({ message: "Không tìm thấy sản phẩm" });
    }
  } catch (err) {
    console.error("Lỗi cập nhật:", err);
    res.status(500).json({ message: "Lỗi Server" });
  }
});
 
router.delete("/:id", protect, admin, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (product) {
      await product.deleteOne();
      res.json({ message: "Đã xóa sản phẩm" });
    } else {
      res.status(404).json({ message: "Không tìm thấy sản phẩm" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Lỗi server");
  }
});
 
router.get("/", async (req, res) => {
  try {
    const { category, brand, size, color, gender, material, minPrice, maxPrice, sortBy, search, limit } = req.query;
    let query = {};

    // 1. Ép kiểu Category ID
    if (category && category.toLowerCase() !== "all") {
      const categoryDoc = await Category.findOne({ 
        name: { $regex: new RegExp(`^${category}$`, "i") } 
      });

      if (categoryDoc) {
        query.category = categoryDoc._id; 
      } else {
        return res.status(200).json([]); 
      }
    }

    // 2. Tìm kiếm
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    // 3. Lọc Brand
    if (brand) {
      query.brand = { $in: brand.split(",") };
    }

    // 4. Lọc Giá
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }
 
    let conditions = [];

    // Giới tính
    if (gender) {
      conditions.push({
        $or: [
          { gender: { $regex: new RegExp(`^${gender}$`, "i") } },
          { attributes: { $elemMatch: { name: { $regex: /^gender$/i }, value: { $regex: new RegExp(`^${gender}$`, "i") } } } }
        ]
      });
    }

    // Màu sắc
    if (color) {
      const colorMap = {
        "đỏ": "red",
        "xanh dương": "blue",
        "đen": "black",
        "xanh lá": "green",
        "vàng": "yellow",
        "xám": "gray",
        "trắng": "white",
        "hồng": "pink",
        "be": "beige",
        "navy": "navy"
      };
      
      const engColor = colorMap[color.toLowerCase()] || color;

      conditions.push({
        $or: [
          { colors: { $elemMatch: { $regex: color, $options: "i" } } },
          { attributes: { $elemMatch: { name: { $regex: /^color$/i }, value: { $regex: new RegExp(`${color}|${engColor}`, "i") } } } },
          { variants: { $elemMatch: { variantName: { $regex: new RegExp(`${color}|${engColor}`, "i") } } } }
        ]
      });
    }

    // Kích cỡ (Size)
    if (size) {
      const sizeList = size.split(",");
      conditions.push({
        $or: [
          { sizes: { $in: sizeList } },
          { attributes: { $elemMatch: { name: { $regex: /^size$/i }, value: { $in: sizeList } } } },
          { variants: { $elemMatch: { variantName: { $regex: new RegExp(sizeList.join("|"), "i") } } } }
        ]
      });
    }

    // Chất liệu
    if (material) {
      const materialList = material.split(",");
      conditions.push({
        $or: [
          { material: { $in: materialList } },
          { attributes: { $elemMatch: { name: { $regex: /^material$/i }, value: { $in: materialList } } } }
        ]
      });
    }

    // Gộp tất cả các điều kiện lọc lại với nhau
    if (conditions.length > 0) {
      query.$and = conditions;
    }

    // 6. Sắp xếp
    let sort = {};
    if (sortBy) {
      switch (sortBy) {
        case "priceAsc": sort = { price: 1 }; break;
        case "priceDesc": sort = { price: -1 }; break;
        case "popularity": sort = { rating: -1 }; break;
        default: sort = { createdAt: -1 }; break;
      }
    } else {
      sort = { createdAt: -1 };
    }

    // 7. Gọi Database
    let products = await Product.find(query)
      .sort(sort)
      .limit(Number(limit) || 0)
      .populate("category", "name");
      
    res.json(products);
  } catch (err) {
    console.error("Lỗi get products:", err);
    res.status(500).json({ message: "Lỗi Server" });
  }
});
 
router.get("/best-seller", async (req, res) => {
  try {
    const bestSeller = await Product.findOne().sort({ rating: -1 });
    if (bestSeller) res.json(bestSeller);
    else res.status(404).json({ message: "No best seller found" });
  } catch (err) {
    console.error(err);
    res.status(500).send("server error");
  }
});

router.get("/new-arrivals", async (req, res) => {
  try {
    const newArrivals = await Product.find().sort({ createdAt: -1 }).limit(8);
    res.json(newArrivals);
  } catch (err) {
    console.error(err);
    res.status(500).send("server error");
  }
});

router.get("/recommend", async (req, res) => {
  const { bodyType } = req.query; 

  try {
    if (!bodyType) {
      return res.status(400).json({ message: "Thiếu thông tin bodyType" });
    }
    const recommendedProducts = await Product.find({ 
        suitableForBodyType: { $in: [bodyType] } 
    }).limit(8); 

    res.status(200).json(recommendedProducts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi Server" });
  }
});

router.get("/similar/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found " });
    }
    const similarProduct = await Product.find({
      _id: { $ne: id },
      gender: product.gender,
      category: product.category,
    }).limit(6);
    res.json(similarProduct);
  } catch (err) {
    console.error(err);
    res.status(500).send("server error");
  }
});

router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate("category", "name");
    if (product) res.json(product);
    else res.status(404).json({ message: "Product not found" });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

module.exports = router;