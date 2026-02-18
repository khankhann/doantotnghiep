import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from 'react-redux';
import { fetchUserOrder } from '@redux/slices/orderSlice';

function MyOrderPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  // Lấy danh sách đơn hàng từ Redux
  const { orders, loading, error } = useSelector((state) => state.orders);

  useEffect(() => {
    dispatch(fetchUserOrder());
  }, [dispatch]);

  const handleRowClick = (orderId) => {
    navigate(`/order/${orderId}`);
  };

  if (loading) return <p className="text-center p-10">Loading...</p>;
  if (error) return <p className="text-center p-10 text-red-500">Error: {error}</p>;

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6">
      <h2 className="text-xl sm:text-2xl font-bold mb-6">My Orders</h2>
      <div className="relative shadow-md sm:rounded-lg overflow-hidden border">
        <table className="min-w-full text-left text-gray-500">
          <thead className="bg-gray-100 text-xs uppercase text-gray-700">
            <tr>
              <th className="py-3 px-4">Products</th> {/* Đổi tên cột cho đúng nghĩa */}
              <th className="py-3 px-4">Order ID</th>
              <th className="py-3 px-4">Created</th>
              <th className="py-3 px-4">Shipping Address</th>
              <th className="py-3 px-4">Items</th>

              <th className="py-3 px-4">Total</th>
              <th className="py-3 px-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {orders && orders.length > 0 ? (
              orders.map((order) => {
                // QUAN TRỌNG: Lấy đúng mảng sản phẩm dù Backend trả về tên gì
                const products = order.checkoutItem || order.orderItems || [];
                const totalQuantity = products.reduce((total, product)=> {
                  return total + ( product.quantity)
                },0)
                return (
                  <tr
                    key={order._id}
                    onClick={() => handleRowClick(order._id)}
                    className="border-b hover:bg-gray-50 cursor-pointer transition"
                  >
                    {/* CỘT SẢN PHẨM: Map ra danh sách hình ảnh */}
                    <td className="py-4 px-4">
                      <div className="flex -space-x-2 overflow-hidden">
                        {products.length > 0 ? (
                          products.slice(0, 4).map((item, index) => (
                            <img
                              key={index}
                              src={item.image}
                              alt={item.name}
                              className="inline-block h-10 w-10 object-cover border"
                              title={item.name} // Di chuột vào sẽ hiện tên sản phẩm
                            />
                          ))
                        ) : (
                          <span className="text-xs text-gray-400">No items</span>
                        )}
                        {/* Nếu có nhiều hơn 4 món thì hiện số cộng thêm */}
                        {products.length > 4 && (
                          <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-500 ring-2 ring-white">
                            +{products.length - 4}
                          </div>
                        )}
                      </div>
                      {/* Hiện tên sản phẩm đầu tiên và số lượng còn lại (nếu muốn) */}
                      {products.length > 0 && (
                         <p className="text-xs text-gray-500 mt-1">
                            {products[0].name} {products.length > 1 && `+ ${products.length - 1} more`}
                         </p>
                      )}
                    </td>

                    <td className="py-4 px-4 font-medium text-gray-900 whitespace-nowrap">
                      #{order._id.slice(-6).toUpperCase()}
                    </td>
                    
                    <td className="py-4 px-4 text-sm">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    
                    <td className="py-4 px-4 text-sm max-w-[200px] truncate">
                      {order.shippingAddress
                        ? `${order.shippingAddress.city}, ${order.shippingAddress.country}`
                        : "N/A"}
                    </td>
                   <td className="py-4 px-4 font-bold text-gray-800">
                      {totalQuantity}
                    </td>
                    <td className="py-4 px-4 font-bold text-gray-800">
                      ${order.totalPrice}
                    </td>
                    
                    <td className="py-4 px-4">
                      <span
                        className={`${
                          order.isPaid
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        } px-2 py-1 rounded-full text-xs font-bold`}
                      >
                        {order.isPaid ? "Paid" : "Pending"}
                      </span>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} className="py-8 text-center text-gray-500">
                  You have no orders.
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