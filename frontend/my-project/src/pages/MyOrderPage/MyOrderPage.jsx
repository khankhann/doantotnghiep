import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from 'react-redux';
import { fetchUserOrder } from '../../redux/slices/orderSlice'; 

function MyOrderPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { orders, loading, error } = useSelector((state) => state.orders);

  useEffect(() => {
    dispatch(fetchUserOrder());
  }, [dispatch]);

  const handleRowClick = (orderId) => {
    navigate(`/order/${orderId}`);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND"
    }).format(price);
  };

  // --- LOADING STATE ĐỒNG BỘ ---
  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center bg-gray-50/30">
        <div className="w-10 h-10 border-4 border-gray-200 border-t-black rounded-full animate-spin mb-4"></div>
        <p className="text-gray-500 font-medium animate-pulse">Đang tải lịch sử đơn hàng...</p>
      </div>
    );
  }

  // --- ERROR STATE ---
  if (error) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center bg-gray-50/30">
        <div className="text-red-500 mb-2">
          <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </div>
        <p className="text-red-600 font-medium text-lg">Đã xảy ra lỗi khi tải dữ liệu</p>
        <p className="text-gray-500 text-sm mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8 font-sans min-h-[60vh]">
      
      {/* HEADER */}
      <div className="mb-8 animate-fade-in-up">
        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Lịch sử đơn hàng</h2>
        <p className="text-gray-500 mt-2 text-sm">Theo dõi và quản lý các đơn hàng bạn đã thực hiện.</p>
      </div>

      {/* BẢNG ĐƠN HÀNG */}
      <div className="bg-white shadow-sm border border-gray-200 rounded-2xl overflow-hidden animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm whitespace-nowrap">
            
            <thead className="bg-gray-50/80 border-b border-gray-200">
              <tr>
                <th className="py-4 px-6 font-semibold text-gray-600 uppercase tracking-wider text-xs">Sản phẩm</th>
                <th className="py-4 px-6 font-semibold text-gray-600 uppercase tracking-wider text-xs">Mã đơn</th>
                <th className="py-4 px-6 font-semibold text-gray-600 uppercase tracking-wider text-xs">Ngày đặt</th>
                <th className="py-4 px-6 font-semibold text-gray-600 uppercase tracking-wider text-xs hidden md:table-cell">Giao đến</th>
                <th className="py-4 px-6 font-semibold text-gray-600 uppercase tracking-wider text-xs text-center">SL</th>
                <th className="py-4 px-6 font-semibold text-gray-600 uppercase tracking-wider text-xs text-right">Tổng tiền</th>
                <th className="py-4 px-6 font-semibold text-gray-600 uppercase tracking-wider text-xs text-center">Trạng thái</th>
                <th className="py-4 px-6 font-semibold text-gray-600 uppercase tracking-wider text-xs text-center">Thao tác</th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-gray-100">
              {orders && orders.length > 0 ? (
                orders.map((order) => {
                  const products = order.checkoutItem || order.orderItems || [];
                  const totalQuantity = products.reduce((total, product) => {
                    return total + (product.quantity || product.qty || 1); 
                  }, 0);

                  return (
                    <tr
                      key={order._id}
                      onClick={() => handleRowClick(order._id)}
                      className="hover:bg-gray-50/80 cursor-pointer transition-colors duration-200 group"
                    >
                      {/* CỘT 1: SẢN PHẨM (AVATAR XẾP CHỒNG) */}
                      <td className="py-4 px-6">
                        <div className="flex -space-x-3 overflow-hidden">
                          {products.length > 0 ? (
                            products.slice(0, 3).map((item, index) => (
                              <img
                                key={index}
                                src={item.image}
                                alt={item.name}
                                className="inline-block h-10 w-10 object-cover rounded-full border-2 border-white shadow-sm group-hover:scale-105 transition-transform" 
                                title={item.name}
                              />
                            ))
                          ) : (
                            <span className="text-xs text-gray-400 italic">Trống</span>
                          )}
                          {products.length > 3 && (
                            <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600 border-2 border-white z-10 shadow-sm">
                              +{products.length - 3}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* CỘT 2: MÃ ĐƠN HÀNG */}
                      <td className="py-4 px-6">
                        <span className="font-bold text-gray-900 bg-gray-100 px-2.5 py-1 rounded-md text-xs">
                          #{order._id.slice(-8).toUpperCase()}
                        </span>
                      </td>
                      
                      {/* CỘT 3: NGÀY ĐẶT */}
                      <td className="py-4 px-6 text-gray-600 font-medium">
                        {order.createdAt ? new Date(order.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
                      </td>
                      
                      {/* CỘT 4: ĐỊA CHỈ (ẨN TRÊN MOBILE) */}
                      <td className="py-4 px-6 text-gray-500 hidden md:table-cell max-w-[180px] truncate">
                        {order.shippingAddress
                          ? `${order.shippingAddress.city}, ${order.shippingAddress.country}`
                          : "N/A"}
                      </td>
                      
                      {/* CỘT 5: SỐ LƯỢNG */}
                      <td className="py-4 px-6 font-bold text-gray-700 text-center">
                        {totalQuantity}
                      </td>
                      
                      {/* CỘT 6: TỔNG TIỀN */}
                      <td className="py-4 px-6 font-extrabold text-gray-900 text-right">
                        {formatPrice(order.totalPrice)}
                      </td>
                      
                      {/* CỘT 7: TRẠNG THÁI */}
                      <td className="py-4 px-6 text-center">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            order.isPaid
                              ? "bg-green-100 text-green-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {order.isPaid ? "Đã thanh toán" : "Chờ xử lý"}
                        </span>
                      </td>

                      {/* CỘT 8: THAO TÁC (NÚT ĐÁNH GIÁ) */}
                      <td 
                        className="py-4 px-6"
                        onClick={(e) => e.stopPropagation()} 
                      >
                        <div className="flex items-center justify-center">
                          {order.isPaid ? (
                            <button 
                              onClick={() => navigate(`/order/${order._id}`)} 
                              className="text-white bg-black hover:bg-gray-800 px-4 py-2 rounded-lg text-xs font-semibold transition-all shadow-sm active:scale-95"
                              title="Đánh giá sản phẩm trong đơn hàng"
                            >
                              Đánh giá
                            </button>
                          ) : (
                            <span className="text-gray-400 text-xs italic">-</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                /* TRẠNG THÁI TRỐNG (EMPTY STATE) */
                <tr>
                  <td colSpan={8} className="py-24 text-center bg-gray-50/30">
                    <div className="flex flex-col items-center justify-center space-y-3 animate-fade-in">
                      <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                        <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
                        </svg>
                      </div>
                      <p className="font-semibold text-gray-900 text-lg">Bạn chưa có đơn hàng nào</p>
                      <p className="text-gray-500 text-sm">Hãy khám phá thêm các sản phẩm tuyệt vời của chúng tôi.</p>
                      <button 
                        onClick={() => navigate("/")}
                        className="mt-4 text-sm font-medium text-white bg-black hover:bg-gray-800 px-6 py-2.5 rounded-xl transition-colors"
                      >
                        Bắt đầu mua sắm
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
            
          </table>
        </div>
      </div>
      
    </div>
  );
}

export default MyOrderPage;