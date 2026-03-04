import  { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { toast } from "sonner";
// NHỚ ĐỔI ĐƯỜNG DẪN NÀY CHO KHỚP VỚI PROJECT CỦA FEN (productsSlice hoặc reviewsSlice)
import {
  createProductReview,
  deleteProductReview,
  createReviewReply,
  deleteReviewReply,
} from "@redux/slices/reviewsSlice";
import {fetchProductDetails} from "@redux/slices/productsSlice"

function ProductReviews ({ productId, reviews }) {
  const dispatch = useDispatch();

  // State cho Form Đánh giá chính
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  // State cho Form Phản hồi (Reply)
  const [replyingTo, setReplyingTo] = useState(null); // Lưu ID của review đang được bấm reply
  const [replyComment, setReplyComment] = useState("");

  // Lấy user từ Redux để phân quyền (Hiện nút Xóa/Reply)
  const { user } = useSelector((state) => state.auth);
  // Lấy trạng thái loading để disable nút lúc đang gửi API
  const { loadingReview } = useSelector((state) => state.products);

  // ==========================================
  // 1. HÀM GỬI ĐÁNH GIÁ MỚI
  // ==========================================
  const submitReviewHandler = async (e) => {
    e.preventDefault();
    if (rating === 0) return toast.error("Fen vui lòng chọn số sao nhé!");
    if (!comment.trim()) return toast.error("Fen chưa nhập nội dung bình luận!");

    try {
      await dispatch(createProductReview({ productId, rating, comment })).unwrap();
      toast.success("Đã gửi đánh giá thành công!");
      setRating(0);
      setComment("");
      dispatch(fetchProductDetails(productId)); // Kéo data mới về để update UI
    } catch (error) {
      toast.error(error || "Có lỗi xảy ra khi gửi đánh giá");
    }
  };

  // ==========================================
  // 2. HÀM XÓA ĐÁNH GIÁ
  // ==========================================
  const deleteReviewHandler = async (reviewId) => {
    if (window.confirm("Fen có chắc chắn muốn xóa đánh giá này không?")) {
      try {
        await dispatch(deleteProductReview({ productId, reviewId })).unwrap();
        toast.success("Đã xóa đánh giá!");
        dispatch(fetchProductDetails(productId)); // Kéo data mới
      } catch (error) {
        toast.error(error || "Lỗi khi xóa đánh giá");
      }
    }
  };

  // ==========================================
  // 3. HÀM GỬI PHẢN HỒI (REPLY)
  // ==========================================
  const submitReplyHandler = async (reviewId) => {
    if (!replyComment.trim()) return toast.error("Vui lòng nhập nội dung phản hồi!");

    try {
      await dispatch(createReviewReply({ productId, reviewId, comment: replyComment })).unwrap();
      toast.success("Đã gửi phản hồi!");
      setReplyingTo(null); // Đóng form reply lại
      setReplyComment("");
      dispatch(fetchProductDetails(productId)); // Kéo data mới
    } catch (error) {
      toast.error(error || "Lỗi khi gửi phản hồi");
    }
  };

  // ==========================================
  // 4. HÀM XÓA PHẢN HỒI
  // ==========================================
  const deleteReplyHandler = async (reviewId, replyId) => {
    if (window.confirm("Fen có chắc muốn xóa phản hồi này?")) {
      try {
        await dispatch(deleteReviewReply({ productId, reviewId, replyId })).unwrap();
        toast.success("Đã xóa phản hồi!");
        dispatch(fetchProductDetails(productId)); // Kéo data mới
      } catch (error) {
        toast.error(error || "Lỗi khi xóa phản hồi");
      }
    }
  };

  // Hàm vẽ ngôi sao
  const renderStars = (starCount) => {
    return [...Array(5)].map((_, index) => (
      <svg
        key={index}
        className={`w-4 h-4 ${index < starCount ? "text-yellow-400" : "text-gray-300"}`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ));
  };

  return (
    <div className="mt-12 pt-8 border-t border-gray-200">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Đánh giá sản phẩm</h2>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* =========================================
            CỘT TRÁI: DANH SÁCH BÌNH LUẬN & PHẢN HỒI
        ============================================= */}
        <div className="lg:col-span-7">
          <h3 className="text-lg font-semibold mb-4 border-b pb-2">
            Khách hàng nói gì ({reviews?.length || 0})
          </h3>
          
          {reviews?.length === 0 ? (
            <div className="bg-gray-50 p-6 rounded-md text-gray-500 text-sm text-center border border-dashed">
              Chưa có đánh giá nào. Hãy là người đầu tiên nhận xét sản phẩm này!
            </div>
          ) : (
            <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {reviews?.map((review) => (
                <div key={review._id} className="bg-white p-5 rounded-lg border shadow-sm">
                  {/* --- Phần Header Của Review --- */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center font-bold text-gray-600">
                        {review.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <strong className="text-gray-900 block text-sm">{review.name}</strong>
                        <div className="flex mt-1">{renderStars(review.rating)}</div>
                      </div>
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(review.createdAt).toLocaleDateString("vi-VN")}
                    </span>
                  </div>

                  {/* --- Nội dung Review --- */}
                  <p className="text-gray-700 text-sm mt-3">{review.comment}</p>

                  {/* --- Nút Hành động (Reply / Delete) --- */}
                  <div className="mt-3 flex items-center space-x-4 text-xs">
                    {user && (
                      <button 
                        onClick={() => setReplyingTo(replyingTo === review._id ? null : review._id)}
                        className="text-blue-600 hover:underline font-medium"
                      >
                        {replyingTo === review._id ? "Hủy trả lời" : "Trả lời"}
                      </button>
                    )}
                    
                    {/* Nút Xóa (Chỉ hiện nếu là chủ comment hoặc admin) */}
                    {user && (user._id === review.user || user.role === "admin") && (
                      <button 
                        onClick={() => deleteReviewHandler(review._id)}
                        className="text-red-500 hover:text-red-700 hover:underline font-medium"
                      >
                        Xóa
                      </button>
                    )}
                  </div>

                  {/* --- Form Trả lời (Bấm vào nút Trả lời mới xổ ra) --- */}
                  {replyingTo === review._id && (
                    <div className="mt-4 flex gap-2">
                      <input 
                        type="text" 
                        value={replyComment}
                        onChange={(e) => setReplyComment(e.target.value)}
                        placeholder="Viết phản hồi..." 
                        className="flex-1 border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500"
                        autoFocus
                      />
                      <button 
                        onClick={() => submitReplyHandler(review._id)}
                        disabled={loadingReview}
                        className="bg-blue-600 text-white px-4 py-1.5 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                      >
                        Gửi
                      </button>
                    </div>
                  )}

                  {/* --- Danh sách Phản hồi (Replies) --- */}
                  {review.replies && review.replies.length > 0 && (
                    <div className="mt-4 ml-6 pl-4 border-l-2 border-gray-200 space-y-3">
                      {review.replies.map((reply) => (
                        <div key={reply._id} className="bg-gray-50 p-3 rounded-md text-sm">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-semibold text-gray-800">{reply.name}</span>
                              {/* Badge hiển thị nếu là Admin trả lời */}
                              {reply.isAdmin && (
                                <span className="bg-red-100 text-red-700 text-[10px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">
                                  Shop
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-gray-400">
                              {new Date(reply.createdAt).toLocaleDateString("vi-VN")}
                            </span>
                          </div>
                          <p className="text-gray-600">{reply.comment}</p>
                          
                          {/* Nút xóa Phản hồi */}
                          {user && (user._id === reply.user || user.role === "admin") && (
                            <button 
                              onClick={() => deleteReplyHandler(review._id, reply._id)}
                              className="text-red-400 hover:text-red-600 text-[11px] mt-1 hover:underline"
                            >
                              Xóa
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* =========================================
            CỘT PHẢI: FORM VIẾT ĐÁNH GIÁ MỚI
        ============================================= */}
        <div className="lg:col-span-5">
          <h3 className="text-lg font-semibold mb-4 border-b pb-2">Viết đánh giá của bạn</h3>

          {user ? (
            <form onSubmit={submitReviewHandler} className="bg-white p-6 rounded-lg shadow-sm border sticky top-20">
              {/* Chọn số sao */}
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-2">Đánh giá chất lượng <span className="text-red-500">*</span></label>
                <select
                  value={rating}
                  onChange={(e) => setRating(Number(e.target.value))}
                  className="w-full border-gray-300 rounded-md shadow-sm p-2.5 focus:ring-black focus:border-black border outline-none transition"
                >
                  <option value="">Chọn số sao...</option>
                  <option value="5">⭐⭐⭐⭐⭐ - Tuyệt vời</option>
                  <option value="4">⭐⭐⭐⭐ - Rất tốt</option>
                  <option value="3">⭐⭐⭐ - Bình thường</option>
                  <option value="2">⭐⭐ - Kém</option>
                  <option value="1">⭐ - Quá tệ</option>
                </select>
              </div>

              {/* Nhập nội dung */}
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-2">Chia sẻ cảm nhận <span className="text-red-500">*</span></label>
                <textarea
                  rows="4"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Sản phẩm có giống mô tả không? Chất liệu thế nào?..."
                  className="w-full border-gray-300 rounded-md shadow-sm p-3 focus:ring-black focus:border-black border outline-none transition resize-none"
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={loadingReview}
                className={`w-full bg-black text-white py-3 px-4 rounded uppercase font-semibold tracking-wider transition-colors ${
                  loadingReview ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-800"
                }`}
              >
                {loadingReview ? "Đang gửi..." : "Gửi Đánh Giá"}
              </button>
            </form>
          ) : (
            <div className="bg-blue-50 border border-blue-100 p-6 rounded-lg text-center">
              <svg className="w-12 h-12 text-blue-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"></path></svg>
              <h4 className="text-gray-800 font-medium mb-2">Bạn chưa đăng nhập</h4>
              <p className="text-sm text-gray-500 mb-4">
                Vui lòng đăng nhập để có thể để lại đánh giá và nhận xét cho sản phẩm này nhé.
              </p>
              <Link to="/login" className="inline-block bg-blue-600 text-white px-6 py-2 rounded font-medium hover:bg-blue-700 transition">
                Đăng nhập ngay
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductReviews;