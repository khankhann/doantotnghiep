const express = require("express");
const router = express.Router();
const Category = require("../models/Category");

// ==========================================
// 🚀 GET /api/categories - Lấy tất cả danh mục
// ==========================================
router.get("/", async (req, res) => {
  try {
    const categories = await Category.find({});
    res.status(200).json(categories);
  } catch (error) {
    console.error("Lỗi lấy danh mục:", error);
    res.status(500).json({ message: "Lỗi Server khi lấy danh mục" });
  }
});

// ==========================================
// 🚀 POST /api/categories - Tạo danh mục mới
// ==========================================
router.post("/", async (req, res) => {
  try {
    const { name, description, parentCategory } = req.body;

    // Kiểm tra xem danh mục đã tồn tại chưa
    const categoryExists = await Category.findOne({ name });
    if (categoryExists) {
      return res.status(400).json({ message: "Tên danh mục này đã tồn tại!" });
    }

    const category = await Category.create({
      name,
      description,
      parentCategory: parentCategory || null, // Nếu rỗng thì nó là Danh mục cha
    });

    res.status(201).json(category);
  } catch (error) {
    console.error("Lỗi tạo danh mục:", error);
    res.status(500).json({ message: "Lỗi Server khi tạo danh mục" });
  }
});

module.exports = router;