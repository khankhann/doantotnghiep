const mongoose = require("mongoose");

const replySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  name: {
    type: String,
    required: true 
  },
  comment: {
    type: String, 
    required: true
  },
  isAdmin: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

const reviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true 
  },
  name: {
    type: String,
    required: true 
  },
  replies: [replySchema],
  rating: {
    type: Number, 
    required: true 
  }, 
  comment: {
    type: String, 
    required: true
  }
}, {
  timestamps: true
});

// ==========================================
// 🔥 THÊM MỚI 1: Schema quản lý Kho Phân loại (Variants)
// ==========================================
const variantSchema = new mongoose.Schema({
  variantName: { type: String, required: true }, // VD: "Size XL - Màu Đen"
  stock: { type: Number, required: true, default: 0 }, // Số lượng kho riêng của loại này
  price: { type: Number }, // Tùy chọn: Nhập nếu size này bán đắt/rẻ hơn giá gốc
  sku: { type: String } // Tùy chọn: Mã vạch riêng của loại này
});

// ==========================================
// 🔥 THÊM MỚI 2: Schema thuộc tính động (Attributes - Thay cho colors, sizes cũ)
// ==========================================
const attributeSchema = new mongoose.Schema({
  name: { type: String, required: true }, // VD: "Size", "Màu sắc", "Giới tính", "RAM"
  value: { type: String, required: true } // VD: "XL", "Đỏ", "Nam", "8GB"
});

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },  
    qrCodeUrl: {
      type: String,
      default: "", 
    },
    stockHistory: [
    {
      action: { type: String, enum: ['IMPORT', 'EXPORT'] }, // Đổi 'type' thành 'action'
      amount: { type: Number },
      note: { type: String },
      userName: { type: String },
      date: { type: Date, default: Date.now }
    }
  ],
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    discountPrice: {
      type: Number,
    },
    sold: {
      type: Number,
      default: 0,
    },
    // Tổng số lượng kho (Sẽ bằng tổng các variant.stock cộng lại)
    countInStock: {
      type: Number,
      required: true,
      default: 0,
    },
    sku: {
      type: String,
      unique: true,
      required: true,
    },
    
    // 👉 ĐÃ FIX: Đổi từ String sang ObjectId để hết lỗi CastError và hỗ trợ đa tầng
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    
    brand: {
      type: String,
      required: true,
    },

    // 👉 ĐÃ THÊM: Mảng chứa thông số kỹ thuật (Để khách Filter)
    attributes: [attributeSchema],

    // 👉 ĐÃ THÊM: Mảng chứa Phân loại kho (Biết chính xác có bao nhiêu cái XL, L)
    variants: [variantSchema],

    // (ĐÃ XÓA: sizes, colors, collections, material, gender, suitableForBodyType)

    images: [
      {
        url: {
          type: String,
          required: true,
        },
        altText: {
          type: String,
        },
      },
    ],
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    reviews: [reviewSchema],
    rating: {
      type: Number,
      default: 0,
    },
    numReviews: {
      type: Number,
      default: 0,
    },
    tags: [String],
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    lastEditByUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      // Tạm thời bỏ required: true để khỏi lỗi khi create nếu frontend quên gửi
      required: false, 
    },
    metaTitle: {
      type: String,
    },
    metaDescription: {
      type: String,
    },
    metaKeywords: {
      type: String,
    },
    dimensions: {
      length: Number,
      width: Number,
      height: Number,
    },
    weight: Number,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);