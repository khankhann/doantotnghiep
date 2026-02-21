import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import { clearCart, deleteCart } from "@redux/slices/cartSlice"; // Check lại path import này
import api from "../../api/axiosClients";
import { useRef } from "react";

function OrderConfirmation() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState("Đang kiểm tra đơn hàng...");
const isProcessed = useRef(false)
  const { checkout } = useSelector((state) => state.checkout);
  const { user, guestId } = useSelector((state) => state.auth);

  // --- 1. LOGIC LẤY ID CỦA CODE CŨ (Rất quan trọng) ---
  const momoOrderId = searchParams.get("orderId");
  const orderInfo = searchParams.get("orderInfo");
  const resultCode = searchParams.get("resultCode");
  
  // Lấy ID thật từ orderInfo (nếu có) hoặc dùng momoOrderId
  // Code cũ của bạn xử lý cái này rất tốt, giữ nguyên logic này
  const extractedId = orderInfo ? orderInfo.split(" ").pop() : momoOrderId;

  useEffect(() => {
    const handleOrder = async () => {
      // TH1: Redirect từ MoMo về (Có resultCode = 0)
      if (extractedId && resultCode === "0") {
        if(isProcessed.current) return isProcessed.current = true
        try {
          setStatusMessage("Đang cập nhật trạng thái thanh toán...");
          
          // --- 2. LOGIC CẬP NHẬT CỦA CODE MỚI ---
          // Gọi API báo đã thanh toán (PUT)
          await api.put(`/api/checkout/${extractedId}/pay`, {
             paymentStatus: "paid",
             paymentDetails: { method: "MoMo", resultCode: resultCode }
          });

          // Gọi API chốt đơn (POST Finalize)
          const res = await api.post(`/api/checkout/${extractedId}/finalize`);
          
          setOrder(res.data); // Hiện đơn hàng đã finalize
          
          // Xóa giỏ hàng
          dispatch(clearCart());
          dispatch(deleteCart({ userId: user?._id, guestId }));
          localStorage.removeItem("cart");
          
        } catch (error) {
          console.error("Lỗi cập nhật:", error);
          // Nếu lỗi update, vẫn thử get lại xem sao (fallback về code cũ)
          try {
             const res = await api.get(`/api/checkout/${extractedId}`);
             setOrder(res.data);
          } catch (e) {
             setStatusMessage("Lỗi không tìm thấy đơn hàng");
          }
        } finally {
          setLoading(false);
        }
      } 
      // TH2: Đã có sẵn trong Redux (Vừa bấm checkout xong nhưng chưa redirect - ít xảy ra với MoMo)
      else if (checkout && checkout._id) {
        setOrder(checkout);
        setLoading(false);
      } 
      // TH3: Vào lại link cũ hoặc MoMo lỗi
      else if (extractedId) {
        // Chỉ lấy dữ liệu xem thôi (như code cũ)
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
  }, [extractedId, resultCode, dispatch, user, guestId]); // Bỏ 'checkout' ra để tránh loop

  // --- PHẦN RENDER (GIỮ NGUYÊN CODE CŨ CỦA BẠN) ---
  const calculateEstimateDelivery = (createdAt) => {
    if (!createdAt) return "";
    const orderDate = new Date(createdAt);
    orderDate.setDate(orderDate.getDate() + 10);
    return orderDate.toLocaleDateString();
  };

  if (loading) return <div className="p-10 text-center">{statusMessage}</div>;
  if (!order) return <div className="p-10 text-center text-red-500">Không tìm thấy đơn hàng hoặc thanh toán thất bại.</div>;

  // Xử lý hiển thị item: Order đã finalize dùng 'orderItems', Checkout dùng 'checkoutItem'
  const displayItems = order.orderItems || order.checkoutItem || [];

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white">
      <h1 className="text-4xl font-bold text-center text-emerald-700 mb-8">
        Thank You for Your Order
      </h1>

      <div className="p-6 rounded-lg border">
        <div className="flex justify-between mb-20">
          <div>
            <h2 className="text-xl font-semibold">Order ID: {order._id}</h2>
            <p className="text-gray-500">
              Order date: {new Date(order.createdAt).toLocaleDateString()}
            </p>
            {/* Hiển thị trạng thái thanh toán để check */}
            <p className={order.isPaid ? "text-green-600 font-bold" : "text-red-500 font-bold"}>
               {order.isPaid ? "ĐÃ THANH TOÁN" : "CHƯA THANH TOÁN"}
            </p>
          </div>
          <div>
            <p className="text-emerald-700 text-sm">
              Estimated Delivery: {calculateEstimateDelivery(order.createdAt)}
            </p>
          </div>
        </div>

        {/* --- LIST ITEM --- */}
        <div className="mb-20">
          {displayItems.length > 0 ? (
            displayItems.map((item) => (
              <div key={item.productId || item._id} className="flex items-center mb-4">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-16 h-16 object-cover rounded-md mr-4"
                />
                <div>
                  <h4 className="text-md font-semibold">{item.name}</h4>
                  <p className="text-sm text-gray-500">
                    {item.color} | {item.size}
                  </p>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-md">${item.price}</p>
                  <p className="text-sm text-gray-500">Quantity: {item.quantity || item.qty}</p>
                </div>
              </div>
            ))
          ) : (
            <p>Không có sản phẩm nào.</p>
          )}
        </div>

        {/* ... Phần Payment và Delivery giữ nguyên ... */}
        <div className="grid grid-cols-2 gap-8">
          <div>
            <h4 className="text-lg font-semibold mb-2">Payment</h4>
            <p className="text-gray-600">
               {order.paymentMethod === 'paypal' ? 'PayPal' : 'MoMo / Online Payment'}
            </p>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-2">Delivery</h4>
            <p className="text-gray-600">{order.shippingAddress?.address}</p>
            <p className="text-gray-600">
              {order.shippingAddress?.city} <br />
              {order.shippingAddress?.country}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrderConfirmation;