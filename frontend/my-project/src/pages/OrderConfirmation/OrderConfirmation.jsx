import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import { clearCart, deleteCart } from "@redux/slices/cartSlice";
import api from "../../api/axiosClients";

function OrderConfirmation() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // State lưu dữ liệu đơn hàng
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true); // Thêm loading

  const { checkout } = useSelector((state) => state.checkout);
const {user , guestId } = useSelector((state)=> state.auth)
  const momoOrderId = searchParams.get("orderId");
  const orderInfo = searchParams.get("orderInfo");
  const extractedId = orderInfo ? orderInfo.split(" ").pop() : momoOrderId;

  useEffect(() => {
    const fetchOrder = async (id) => {
      try {
        const response = await api.get(`/api/checkout/${id}`);
        setOrder(response.data);
      } catch (error) {
        console.error("Lỗi fetch đơn hàng:", error);
      } finally {
        setLoading(false);
      }
    };

    if (checkout && checkout._id) {
      // TH1: Có sẵn trong Redux
      setOrder(checkout);
      setLoading(false);
       dispatch(clearCart())
    dispatch(deleteCart({userId: user._id , guestId}))
      localStorage.removeItem("cart");
    } else if (extractedId) {
      // TH2: Gọi API lấy lại (MoMo)
      fetchOrder(extractedId);
       dispatch(clearCart())
    dispatch(deleteCart({userId: user._id , guestId}))
   
      localStorage.removeItem("cart");
    } else {
      setLoading(false);
    }
  }, [checkout, dispatch, extractedId]);

  const calculateEstimateDelivery = (createdAt) => {
    if (!createdAt) return "";
    const orderDate = new Date(createdAt);
    orderDate.setDate(orderDate.getDate() + 10);
    return orderDate.toLocaleDateString();
  };
  
  // Màn hình chờ
  if (loading) return <div className="p-10 text-center">Đang tải dữ liệu...</div>;
  if (!order) return <div className="p-10 text-center text-red-500">Không tìm thấy đơn hàng</div>;
console.log(order.checkoutItem)

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
          </div>
          <div>
            <p className="text-emerald-700 text-sm">
              Estimated Delivery: {calculateEstimateDelivery(order.createdAt)}
            </p>
          </div>
        </div>

        {/* --- DANH SÁCH SẢN PHẨM Ở ĐÂY --- */}
        <div className="mb-20">
          {order?.checkoutItem && order?.checkoutItem.length > 0 ? (
            order?.checkoutItem.map((item) => (
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
                  <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                </div>
              </div>
            ))
          ) : (
            <p>Không có sản phẩm nào trong đơn hàng.</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-8">
          <div>
            <h4 className="text-lg font-semibold mb-2">Payment</h4>
            <p className="text-gray-600">
               {order.paymentMethod === 'paypal' ? 'PayPal' : 'MoMo / Online Payment'}
            </p>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-2">Delivery</h4>

            <p className="text-gray-600">
              {order.shippingAddress?.address}
            </p>
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