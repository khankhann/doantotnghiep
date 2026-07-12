const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true, // Không cho phép trùng tên danh mục
    },
    description: {
      type: String,
      default: "",
    },
    // 👉 TRƯỜNG NÀY ĐỂ LÀM DANH MỤC ĐA TẦNG (Danh mục con sẽ lưu ID của Danh mục cha vào đây)
    parentCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null, 
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Category", categorySchema);