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
const formatPrice = (price) =>{
return new Intl.NumberFormat("vi-VN",{
  style : "currency",
  currency : "VND"
}).format(price)
}
  if (loading) return <p className="text-center p-10 font-medium">Đang tải dữ liệu...</p>;
  if (error) return <p className="text-center p-10 text-red-500">Lỗi: {error}</p>;

  return (
    <div className="w-full min-h-[50vh]">
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800">My Orders</h2>
      </div>

      <div className="relative shadow-md sm:rounded-xl overflow-x-auto border border-gray-100 bg-white">
        <table className="min-w-full text-left text-gray-500 text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-700 border-b whitespace-nowrap">
            <tr>
              <th className="py-4 px-4 font-semibold">Products</th>
              <th className="py-4 px-4 font-semibold">Order ID</th>
              <th className="py-4 px-4 font-semibold">Created</th>
              <th className="py-4 px-4 font-semibold hidden md:table-cell">Shipping Address</th>
              <th className="py-4 px-4 font-semibold text-center">Items</th>
              <th className="py-4 px-4 font-semibold">Total</th>
              <th className="py-4 px-4 font-semibold text-center">Status</th>
              <th className="py-4 px-4 font-semibold text-center">Actions</th>
            </tr>
          </thead>
          
          <tbody className="divide-y divide-gray-100">
            {orders && orders.length > 0 ? (
              orders.map((order) => {
                const products = order.checkoutItem || order.orderItems || [];
                const totalQuantity = products.reduce((total, product)=> {
                  return total + (product.quantity || product.qty || 1); 
                }, 0);

                return (
                  <tr
                    key={order._id}
                    onClick={() => handleRowClick(order._id)}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="flex -space-x-2 overflow-hidden">
                        {products.length > 0 ? (
                          products.slice(0, 4).map((item, index) => (
                            <img
                              key={index}
                              src={item.image}
                              alt={item.name}
                              className="inline-block h-10 w-10 object-cover border-2 border-white rounded-full shadow-sm" 
                              title={item.name}
                            />
                          ))
                        ) : (
                          <span className="text-xs text-gray-400">No items</span>
                        )}
                        {products.length > 4 && (
                          <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600 border-2 border-white z-10">
                            + {products.length - 4}
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4 font-bold text-gray-900 whitespace-nowrap">
                      #{order._id.slice(-6).toUpperCase()}
                    </td>
                    
                    <td className="py-3 px-4 text-gray-600">
                      {order.createdAt ? new Date(order.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
                    </td>
                    
                    <td className="py-3 px-4 text-gray-600 max-w-[150px] truncate hidden md:table-cell">
                      {order.shippingAddress
                        ? `${order.shippingAddress.city}, ${order.shippingAddress.country}`
                        : "N/A"}
                    </td>
                    
                    <td className="py-3 px-4 font-bold text-gray-800 text-center">
                      {totalQuantity}
                    </td>
                    
                    <td className="py-3 px-4 font-black text-gray-900">
                      
                      {formatPrice(order.totalPrice)}
                    </td>
                    
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`${
                          order.isPaid
                            ? "bg-green-100 text-green-700"
                            : "bg-orange-100 text-orange-700"
                        } px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider`}
                      >
                        {order.isPaid ? "Paid" : "Pending"}
                      </span>
                    </td>

                    <td 
                      className="py-3 px-4"
                      onClick={(e) => e.stopPropagation()} 
                    >
                      <div className="flex items-center justify-center gap-2">
                        {order.isPaid && (
                          <button 
                            onClick={() => navigate(`/order/${order._id}`)} 
                            className="text-white bg-black hover:bg-gray-800 px-3 py-1.5 rounded-md text-[11px] font-semibold transition-colors flex items-center gap-1 shadow-sm whitespace-nowrap"
                            title="Đánh giá sản phẩm trong đơn hàng"
                          >
                          Đánh giá
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                {/* Đã cập nhật colSpan xuống còn 8 vì đã bỏ cột checkbox */}
                <td colSpan={8} className="py-16 text-center text-gray-500 bg-gray-50/50">
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-4xl">📦</span>
                    <p className="font-medium">Bạn chưa có đơn hàng nào.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default MyOrderPage;