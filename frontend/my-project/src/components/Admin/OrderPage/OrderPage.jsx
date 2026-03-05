import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchAllOrders, updateOrderStatus } from '@redux/slices/adminOrderSlice';

function OrderPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { orders, loading, error } = useSelector((state) => state.adminOrders);

  // STATE: Lưu trữ tháng đang được chọn để lọc
  const [selectedMonth, setSelectedMonth] = useState("All");

  useEffect(() => {
    // SỬA LỖI LOGIC TẠI ĐÂY: Dùng || thay vì && để tránh lỗi null
    if (!user || user.role !== "admin") {
      navigate("/");
    } else {
      dispatch(fetchAllOrders());
    }
  }, [navigate, dispatch, user]);

  const handleStatusChange = (orderId, status) => {
    dispatch(updateOrderStatus({ id: orderId, status }));
  };

  // ==========================================
  // LOGIC LỌC ĐƠN HÀNG THEO THÁNG
  // ==========================================
  // 1. Hàm lấy định dạng tháng/năm (VD: "2024-05")
  const getMonthYear = (dateString) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  };

  // 2. Tự động gom các tháng có đơn hàng (Loại bỏ trùng lặp và sắp xếp mới nhất lên đầu)
  const uniqueMonths = [...new Set(orders?.map(o => getMonthYear(o.createdAt)))]
    .filter(Boolean)
    .sort()
    .reverse();

  // 3. Lọc danh sách đơn hàng dựa trên tháng đang chọn
  const filteredOrders = selectedMonth === "All" 
    ? orders 
    : orders?.filter((order) => getMonthYear(order.createdAt) === selectedMonth);

    const formatPrice = (price)=>{
      return new Intl.NumberFormat("vi-VN", {
        style : "currency",
        currency : "VND"
      }).format(price)
    }
  if (loading) return <p className="text-center p-10 font-bold text-gray-600">Đang tải dữ liệu...</p>;
  if (error) return <p className="text-center p-10 text-red-500">Lỗi: {error}</p>;

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 min-h-[70vh]">
      
      {/* HEADER & BỘ LỌC THÁNG */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Order Management</h2>
        
        {/* Dropdown Lọc Tháng */}
        <div className="flex items-center gap-2 bg-white p-2 rounded-lg shadow-sm border border-gray-200">
          <label className="text-sm font-semibold text-gray-600">Lọc theo tháng:</label>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded focus:ring-blue-500 focus:border-blue-500 block p-1.5 font-medium outline-none"
          >
            <option value="All">Tất cả thời gian</option>
            {uniqueMonths.map((month) => {
              // Format lại thành "Tháng MM/YYYY" cho đẹp
              const [year, m] = month.split('-');
              return (
                <option key={month} value={month}>
                  Tháng {m}/{year}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto shadow-sm sm:rounded-xl border border-gray-200">
        <table className="min-w-full text-left text-sm text-gray-500">
          <thead className="bg-gray-50 text-xs uppercase text-gray-700 border-b">
            <tr>
              <th className="py-4 px-4 font-semibold">Order ID</th>
              <th className="py-4 px-4 font-semibold w-64">Products</th>
              <th className="py-4 px-4 font-semibold">Customer</th>
              <th className="py-4 px-4 font-semibold">Date Ordered</th>
              <th className="py-4 px-4 font-semibold">Total</th>
              <th className="py-4 px-4 font-semibold">Delivered At</th>
              <th className="py-4 px-4 font-semibold">Status</th>
              <th className="py-4 px-4 font-semibold text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredOrders && filteredOrders.length > 0 ? (
              filteredOrders.map((order) => {
                // Tính toán số lượng sản phẩm
                const itemsCount = order.orderItems?.length || 0;
                const firstItemName = order.orderItems?.[0]?.name || "N/A";

                return (
                  <tr
                    key={order._id}
                    className="bg-white hover:bg-blue-50/30 transition-colors"
                  >
                    <td className="py-3 px-4 font-bold text-gray-900 whitespace-nowrap">
                      #{order._id.slice(-6).toUpperCase()} {/* Rút gọn ID cho đỡ vướng */}
                    </td>
                    
                    <td className="py-3 px-4">
                      <p className="font-medium text-gray-800 truncate max-w-[200px]" title={firstItemName}>
                        {firstItemName}
                      </p>
                      {itemsCount > 1 && (
                        <span className="text-xs text-blue-600 font-semibold bg-blue-100 px-2 py-0.5 rounded-full mt-1 inline-block">
                          + {itemsCount - 1} món khác
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      {order?.user?.name ? (
                         <span className="font-medium">{order.user.name}</span>
                      ) : (
                         <span className="text-red-500 italic text-xs">Deleted User</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-gray-600">
                      {order?.createdAt ? new Date(order.createdAt).toLocaleDateString("vi-VN") : "N/A"}
                    </td>

                    <td className="py-3 px-4 font-bold text-gray-900">
                   
                      {formatPrice(order?.totalPrice?.toFixed(2))}
                    </td>

                    <td className="py-3 px-4 text-gray-600 text-xs">
                      {order?.isDelivered && order.deliveredAt 
                        ? new Date(order.deliveredAt).toLocaleDateString("vi-VN") 
                        : <span className="text-orange-500 font-semibold bg-orange-50 px-2 py-1 rounded">Chưa giao</span>
                      } 
                    </td>

                    <td className="py-3 px-4">
                      <select
                        value={order?.status || "Processing"}
                        onChange={(e) => handleStatusChange(order._id, e.target.value)}
                        className={`text-xs font-bold rounded-lg border-0 ring-1 ring-inset outline-none block p-2 cursor-pointer
                          ${order.status === 'Delivered' ? 'bg-green-50 text-green-700 ring-green-600/20' : 
                            order.status === 'Shipped' ? 'bg-blue-50 text-blue-700 ring-blue-600/20' : 
                            order.status === 'Cancelled' ? 'bg-red-50 text-red-700 ring-red-600/20' :
                            'bg-orange-50 text-orange-700 ring-orange-600/20'
                          }`}
                      >
                        <option value="Processing">Processing</option>
                        <option value="Shipped">Shipped</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <button
                        disabled={order.status === 'Delivered'}
                        onClick={() => handleStatusChange(order._id, "Delivered")}
                        className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all shadow-sm whitespace-nowrap
                          ${order.status === 'Delivered' 
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                            : 'bg-green-500 text-white hover:bg-green-600 hover:shadow-md'
                          }`}
                      >
                        {order.status === 'Delivered' ? '✓ Hoàn thành' : 'Giao ngay'}
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={8} className="py-16 text-center text-gray-500 bg-gray-50">
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-3xl">📅</span>
                    <p className="font-medium text-lg">Không có đơn hàng nào trong tháng này!</p>
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

export default OrderPage;