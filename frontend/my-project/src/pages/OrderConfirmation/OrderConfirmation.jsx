import { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { clearCart, deleteCart } from "@redux/slices/cartSlice";
import api from "../../api/axiosClients";

function OrderConfirmation() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState("Đang kiểm tra và đồng bộ đơn hàng...");
  const isProcessed = useRef(false);
  
  const { checkout } = useSelector((state) => state.checkout);
  const { user, guestId } = useSelector((state) => state.auth);

  // --- LOGIC LẤY ID TỪ URL (Giữ nguyên) ---
  const momoOrderId = searchParams.get("orderId");
  const orderInfo = searchParams.get("orderInfo");
  const resultCode = searchParams.get("resultCode");
  
  const extractedId = orderInfo ? orderInfo.split(" ").pop() : momoOrderId;

  useEffect(() => {
    const handleOrder = async () => {
      if (extractedId && resultCode === "0") {
        if(isProcessed.current) return; 
        isProcessed.current = true;
        
        try {
          setStatusMessage("Đang cập nhật trạng thái thanh toán...");
          
          await api.put(`/api/checkout/${extractedId}/pay`, {
             paymentStatus: "paid",
             paymentDetails: { method: "MoMo", resultCode: resultCode }
          });

          const res = await api.post(`/api/checkout/${extractedId}/finalize`);
          
          setOrder(res.data); 
          
          dispatch(clearCart());
          dispatch(deleteCart({ userId: user?._id, guestId }));
          localStorage.removeItem("cart");
          
        } catch (error) {
          console.error("Lỗi cập nhật:", error);
          try {
             const res = await api.get(`/api/checkout/${extractedId}`);
             setOrder(res.data);
          } catch (e) {
             setStatusMessage("Lỗi: Không tìm thấy đơn hàng");
          }
        } finally {
          setLoading(false);
        }
      } 
      else if (checkout && checkout._id) {
        setOrder(checkout);
        setLoading(false);
      } 
      else if (extractedId) {
        try {
           const res = await api.get(`/api/checkout/${extractedId}`);
           setOrder(res.data);
        } catch (error) {
           console.error(error);
        } finally {
           setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    handleOrder();
  }, [extractedId, resultCode, dispatch, user, guestId, checkout]); 

  // Format tiền tệ
  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const calculateEstimateDelivery = (createdAt) => {
    if (!createdAt) return "";
    const orderDate = new Date(createdAt);
    orderDate.setDate(orderDate.getDate() + 3); // Giao hàng thường mất 3-5 ngày thay vì 10 ngày cho thực tế
    return orderDate.toLocaleDateString("vi-VN");
  };

  // --- TRẠNG THÁI LOADING & LỖI ---
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="w-12 h-12 border-4 border-gray-200 border-t-black rounded-full animate-spin mb-4"></div>
        <p className="text-lg font-medium text-gray-600 animate-pulse">{statusMessage}</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
        <div className="text-red-500 mb-4">
          <svg className="w-20 h-20 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Không tìm thấy đơn hàng</h2>
        <p className="text-gray-500 mb-6 text-center">Giao dịch của bạn có thể đã thất bại hoặc mã đơn hàng không tồn tại.</p>
        <button onClick={() => navigate("/")} className="bg-black text-white px-6 py-3 rounded-xl hover:bg-gray-800 transition">
          Quay lại trang chủ
        </button>
      </div>
    );
  }

  const displayItems = order.orderItems || order.checkoutItem || [];

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans flex justify-center">
      <div className="max-w-3xl w-full">
        
        {/* HEADER: SUCCESS MESSAGE */}
        <div className="text-center mb-10 animate-fade-in-up">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight mb-2">
            Cảm ơn bạn đã đặt hàng!
          </h1>
          <p className="text-gray-500 text-lg">
            Đơn hàng của bạn đã được hệ thống ghi nhận và đang được xử lý.
          </p>
        </div>

        {/* MAIN INVOICE CARD */}
        <div className="bg-white p-6 sm:p-10 rounded-3xl shadow-sm border border-gray-100 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          
          {/* Top Info (Mã ĐH & Ngày) */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 border-b border-gray-100 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">Mã đơn hàng</p>
              <p className="text-xl font-bold text-gray-900">#{order._id.substring(order._id.length - 8).toUpperCase()}</p>
            </div>
            <div className="sm:text-right">
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">Ngày đặt</p>
              <p className="text-lg font-medium text-gray-900">
                {new Date(order.createdAt).toLocaleDateString("vi-VN")}
              </p>
            </div>
          </div>

          {/* Payment Status & Delivery Date */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-6 border-b border-gray-100 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Trạng thái thanh toán</p>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                order.isPaid ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
              }`}>
                {order.isPaid ? "✓ Đã thanh toán thành công" : "⚠ Chờ thanh toán"}
              </span>
            </div>
            <div className="sm:text-right">
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">Dự kiến giao hàng</p>
              <p className="text-lg font-bold text-[#A50064]">
                {calculateEstimateDelivery(order.createdAt)}
              </p>
            </div>
          </div>

          {/* Product List */}
          <div className="py-8">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Chi tiết sản phẩm</h3>
            <div className="space-y-6">
              {displayItems.length > 0 ? (
                displayItems.map((item) => (
                  <div key={item.productId || item._id} className="flex items-center gap-4">
                    <div className="w-20 h-24 shrink-0 overflow-hidden rounded-xl bg-gray-100 border border-gray-200">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover object-center" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-base font-semibold text-gray-900 line-clamp-1">{item.name}</h4>
                      <p className="text-sm text-gray-500 mt-1">
                        Màu: {item.color} | Size: {item.size}
                      </p>
                      <p className="text-sm font-medium text-gray-500 mt-1">SL: {item.quantity || item.qty}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-bold text-gray-900">{formatPrice(item.price)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 italic">Không có dữ liệu sản phẩm.</p>
              )}
            </div>
          </div>

          {/* Customer Details & Total */}
          <div className="bg-gray-50 rounded-2xl p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h4 className="text-sm font-bold text-gray-900 uppercase mb-3">Phương thức thanh toán</h4>
              <p className="text-gray-600">
                {order.paymentMethod === 'paypal' ? 'Thẻ quốc tế / PayPal' : 'Ví điện tử MoMo'}
              </p>
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-900 uppercase mb-3">Thông tin nhận hàng</h4>
              <p className="text-gray-900 font-medium mb-1">
                {order.shippingAddress?.firstName} {order.shippingAddress?.lastName}
              </p>
              <p className="text-gray-600 leading-relaxed">
                {order.shippingAddress?.address} <br />
                {order.shippingAddress?.city} - {order.shippingAddress?.postalCode} <br />
                ĐT: {order.shippingAddress?.phone}
              </p>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200 flex justify-between items-center">
            <span className="text-xl font-bold text-gray-900">Tổng thanh toán</span>
            <span className="text-2xl font-extrabold text-gray-900">{formatPrice(order.totalPrice)}</span>
          </div>

        </div>

        {/* ACTION BUTTON */}
        <div className="mt-8 text-center">
          <Link 
            to="/" 
            className="inline-flex items-center justify-center px-8 py-4 text-base font-bold text-white bg-black hover:bg-gray-800 rounded-xl shadow-md transition-all duration-300"
          >
            ← Tiếp tục mua sắm
          </Link>
        </div>

      </div>
    </div>
  );
}

export default OrderConfirmation;