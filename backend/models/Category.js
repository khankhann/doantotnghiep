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
    parentCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null, 
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Category", categorySchema);