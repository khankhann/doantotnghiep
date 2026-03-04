const express = require("express")
const Product = require("../models/Product")
const {protect} = require("../middleware/authMiddleware")

const router = express.Router()


// create review 
// post / api /reviews / :productId 
router.post("/:productId", protect , async(req, res )=>{
    try{
        const {rating , comment } = req.body
        const product = await Product.findById(req.params.productId)
        if(product ){
            const alreadyReviews = product.reviews.find((review)=> {
                    return review.user.toString() === req.user._id.toString()
            })

            if(alreadyReviews){
                return res.status(400).json({message : "da danh gia san pham nay roi"})
            }
            const review = {
                name : req.user.name,
                rating : Number(rating),
                comment, 
                user: req.user._id
            }
            product.reviews.push(review)
            
            product.numReviews = product.reviews.length
            product.rating = product.reviews.reduce((acc, item)=> {
                return (item.rating + acc) 
            },0)/ product.reviews.length
            
            await product.save()
            res.status(201).json({message : "danh gia thanh cong "})
        }else {
            res.status(404).json({message : "khong tim thay san pham"})
        }
            

    }catch(error){
        console.error(error)
        res.status(500).json({message : "loi server"})
    }
})

    // edit review 
    // put / api / reviews/ :productId / :reviewId 
    router.put("/:productId/:reviewId", protect, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const product = await Product.findById(req.params.productId);

    if (product) {
      const review = product.reviews.id(req.params.reviewId);

      if (!review) return res.status(404).json({ message: "Không tìm thấy đánh giá!" });

      // Kiểm tra xem user đang đăng nhập có phải là chủ nhân bài review không
      if (review.user.toString() !== req.user._id.toString()) {
        return res.status(401).json({ message: "Fen không có quyền sửa đánh giá của người khác!" });
      }

      // Cập nhật nội dung
      if (rating) review.rating = Number(rating);
      if (comment) review.comment = comment;

      // Tính lại điểm trung bình (vì lỡ user đổi số sao)
      product.rating =
        product.reviews.reduce((acc, item) => item.rating + acc, 0) /
        product.reviews.length;

      await product.save();
      res.json({ message: "Đã cập nhật đánh giá thành công!" });
    } else {
      res.status(404).json({ message: "Không tìm thấy sản phẩm!" });
    }
  } catch (error) {
    res.status(500).json({ message: "Lỗi server!" });
  }
});

    // delete reviews 
    // delete / api / reviews / :productId / :reviewId 
    router.delete("/:productId/:reviewId", protect, async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId);

    if (product) {
      const review = product.reviews.id(req.params.reviewId);

      if (!review) return res.status(404).json({ message: "Không tìm thấy đánh giá!" });

      // Chỉ người viết hoặc Admin (role === 'admin') mới được xóa
      if (
        review.user.toString() !== req.user._id.toString() &&
        req.user.role !== "admin"
      ) {
        return res.status(401).json({ message: "Fen không có quyền xóa đánh giá này!" });
      }

      // Xóa review ra khỏi mảng (Dùng hàm pull của Mongoose)
      product.reviews.pull(req.params.reviewId);

      // Cập nhật lại tổng số đánh giá và điểm trung bình
      product.numReviews = product.reviews.length;
      if (product.reviews.length > 0) {
        product.rating =
          product.reviews.reduce((acc, item) => item.rating + acc, 0) /
          product.reviews.length;
      } else {
        product.rating = 0; // Nếu xóa hết sạch thì cho về 0 sao
      }

      await product.save();
      res.json({ message: "Đã xóa đánh giá thành công!" });
    } else {
      res.status(404).json({ message: "Không tìm thấy sản phẩm!" });
    }
  } catch (error) {
    res.status(500).json({ message: "Lỗi server!" });
  }
});


// add reply in reviews 
// post / api / reviews / :productId / :reviewsId / replies

router.post("/:productId/:reviewsId/replies", protect , async(req, res)=>{
    try{
        const {comment } = req.body 
        if(!comment){
            return res.status(404).json({message : "vui long nhap noi dung phan hoi"})
        }

        const product = await Product.findById(req.params.productId)

        if(product){
            const review = product.reviews.id(req.params.reviewsId)
            if (!review) {
        return res.status(404).json({ message: "Không tìm thấy đánh giá này!" });
      }
      const reply = {
        user: req.user._id,
        name: req.user.name,
        comment,
        isAdmin: req.user.role === "admin", // Nếu user đang đăng nhập là admin thì đánh dấu luôn
      };

      review.replies.push(reply);
      await product.save();
      
      res.status(201).json({ message: "Đã gửi phản hồi thành công!" });
    } else {
      res.status(404).json({ message: "Không tìm thấy sản phẩm" });
    }
        }catch(error){
            console.error(error);
    res.status(500).json({ message: "loi server" });
        }
    
})

// edit reply 
// put / api / reviews / :productId / :reviewId / replyId 
router.put("/:productId/:reviewId/replies/:replyId", protect, async (req, res) => {
  try {
    const { comment } = req.body;
    const product = await Product.findById(req.params.productId);

    if (product) {
      const review = product.reviews.id(req.params.reviewId);
      if (!review) return res.status(404).json({ message: "Không tìm thấy đánh giá!" });

      const reply = review.replies.id(req.params.replyId);
      if (!reply) return res.status(404).json({ message: "Không tìm thấy phản hồi!" });

      // Xác thực chủ sở hữu
      if (reply.user.toString() !== req.user._id.toString()) {
        return res.status(401).json({ message: "Fen không có quyền sửa phản hồi này!" });
      }

      reply.comment = comment || reply.comment;

      await product.save();
      res.json({ message: "Đã cập nhật phản hồi thành công!" });
    } else {
      res.status(404).json({ message: "Không tìm thấy sản phẩm!" });
    }
  } catch (error) {
    res.status(500).json({ message: "Lỗi server!" });
  }
});

// delete reply  
// delete / api / reviews / :productId / :reviewId  / :replyId 
router.delete("/:productId/:reviewId/replies/:replyId", protect, async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId);

    if (product) {
      const review = product.reviews.id(req.params.reviewId);
      if (!review) return res.status(404).json({ message: "Không tìm thấy đánh giá!" });

      const reply = review.replies.id(req.params.replyId);
      if (!reply) return res.status(404).json({ message: "Không tìm thấy phản hồi!" });

      // Xác thực chủ sở hữu hoặc Admin
      if (
        reply.user.toString() !== req.user._id.toString() &&
        req.user.role !== "admin"
      ) {
        return res.status(401).json({ message: "Fen không có quyền xóa phản hồi này!" });
      }

      // Xóa phản hồi ra khỏi mảng
      review.replies.pull(req.params.replyId);

      await product.save();
      res.json({ message: "Đã xóa phản hồi thành công!" });
    } else {
      res.status(404).json({ message: "Không tìm thấy sản phẩm!" });
    }
  } catch (error) {
    res.status(500).json({ message: "Lỗi server!" });
  }
});

module.exports = router
