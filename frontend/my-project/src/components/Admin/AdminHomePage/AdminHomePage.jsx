import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { useEffect, useState } from "react"; 
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { fetchAdminProducts } from "@redux/slices/adminProductSlice"; 
import { fetchAllOrders } from "@redux/slices/adminOrderSlice";

function AdminHomePage() {
  const dispatch = useDispatch();
  const { products, loading: productsLoading, error: productsError } = useSelector((state) => state.adminProducts);
  const { orders, totalOrders, totalSales, loading: ordersLoading, error: ordersError } = useSelector((state) => state.adminOrders);

  // 1. STATE CHO BỘ LỌC THỜI GIAN
  const [timeFilter, setTimeFilter] = useState('7days');

  // Dữ liệu giả 7 ngày
  const revenueData7Days = [
    { name: 'Thứ 2', revenue: 120 }, { name: 'Thứ 3', revenue: 300 },
    { name: 'Thứ 4', revenue: 250 }, { name: 'Thứ 5', revenue: 450 },
    { name: 'Thứ 6', revenue: 390 }, { name: 'Thứ 7', revenue: 600 }, { name: 'CN', revenue: 800 },
  ];

  // Dữ liệu giả 1 tháng (để demo khi đổi Filter)
  const revenueData1Month = [
    { name: 'Tuần 1', revenue: 1500 }, { name: 'Tuần 2', revenue: 2300 },
    { name: 'Tuần 3', revenue: 1800 }, { name: 'Tuần 4', revenue: 3200 },
  ];

  // Chọn data để vẽ dựa vào Filter
  const currentChartData = timeFilter === '7days' ? revenueData7Days : revenueData1Month;

  // Dữ liệu Pie Chart
  const categoryData = [
    { name: 'Top Wear', value: 4500 }, { name: 'Bottom Wear', value: 3200 }, { name: 'Accessories', value: 1200 },
  ];
  const COLORS = ['#3B82F6', '#10B981', '#F59E0B'];

  // 2. LOGIC TÌM SẢN PHẨM SẮP HẾT HÀNG (Tồn kho dưới 10 cái)
  const lowStockProducts = products?.filter(product => product.countInStock < 10) || [];
  const highStockProducts = products?.filter(product => product.countInStock > 50 ) || [];
  useEffect(() => {
    dispatch(fetchAdminProducts());
    dispatch(fetchAllOrders());
  }, [dispatch]);
console.log(orders[0])
  return (
    <div className="max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800 mb-6"> Admin Dashboard </h1>
      
      {productsLoading || ordersLoading ? (
        <p className="text-center text-gray-500 py-10">Đang tải dữ liệu... </p>
      ) : productsError || ordersError ? (
        <p className="text-center text-red-500 py-10">Lỗi: {productsError || ordersError}</p>
      ) : (
        <>
          {/* TẦNG 1: 3 THẺ TỔNG KẾT */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className="p-6 shadow-sm rounded-xl bg-white border-l-4 border-green-500 flex flex-col justify-between hover:shadow-md transition-shadow">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide"> Total Revenue </h2>
              <p className="text-3xl font-bold text-gray-900 mt-2"> ${(totalSales || 0).toFixed(2)} </p> 
            </div>

            <div className="p-6 shadow-sm rounded-xl bg-white border-l-4 border-blue-500 flex flex-col justify-between hover:shadow-md transition-shadow">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide"> Total Orders </h2>
              <p className="text-3xl font-bold text-gray-900 mt-2"> {totalOrders} </p>
              <Link to="/admin/orders" className="text-sm text-blue-600 hover:text-blue-800 mt-2 font-medium">
                Manage Orders →
              </Link>
            </div>

            <div className="p-6 shadow-sm rounded-xl bg-white border-l-4 border-yellow-500 flex flex-col justify-between hover:shadow-md transition-shadow">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide"> Total Products </h2>
              <p className="text-3xl font-bold text-gray-900 mt-2"> {products?.length || 0} </p>
              <Link to="/admin/products" className="text-sm text-blue-600 hover:text-blue-800 mt-2 font-medium">
                Manage Products →
              </Link>
            </div>
          </div>

          {/* TẦNG 2: CÁC BIỂU ĐỒ THỐNG KÊ */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            
            {/* Biểu đồ đường (Line Chart) */}
            <div className="bg-white p-6 shadow-sm rounded-xl lg:col-span-2 border border-gray-100">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-gray-800">Doanh thu</h2>
                
                {/* NÚT LỌC THỜI GIAN */}
                <select 
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2 cursor-pointer outline-none"
                  value={timeFilter}
                  onChange={(e) => setTimeFilter(e.target.value)}
                >
                  <option value="7days">7 ngày qua</option>
                  <option value="1month">Tháng này</option>
                </select>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={currentChartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} dy={10} />
                    <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} tickFormatter={(value) => `$${value}`} axisLine={false} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      formatter={(value) => [`$${value}`, 'Revenue']}
                    />
                    <Line type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={4} dot={{ r: 4, fill: '#10B981', strokeWidth: 2 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Biểu đồ tròn (Donut Chart) */}
            <div className="bg-white p-6 shadow-sm rounded-xl lg:col-span-1 border border-gray-100">
              <h2 className="text-lg font-bold text-gray-800 mb-6">Tỷ trọng Danh mục</h2>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={categoryData} cx="50%" cy="50%" innerRadius={65} outerRadius={90} paddingAngle={5} dataKey="value">
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `$${value}`} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '13px', paddingTop: '10px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

          {/* TẦNG 3: BẢNG ORDERS VÀ CẢNH BÁO */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* CỘT TRÁI (Chiếm 2/3): Bảng danh sách Orders */}
            <div className="bg-white shadow-sm rounded-xl p-6 border border-gray-100 lg:col-span-2">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Recent Orders</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-gray-500 text-sm">
                  <thead className="bg-gray-50 text-xs uppercase text-gray-700">
                    <tr>
                      <th className="py-3 px-4 rounded-tl-lg">Order ID</th>
                      <th className="py-3 px-4">Product name</th>
                   


                      <th className="py-3 px-4">User</th>
                      <th className="py-3 px-4">Order At</th>
                      <th className="py-3 px-4">Delivered At</th>

                      <th className="py-3 px-4">Total Price</th>
                      <th className="py-3 px-4 rounded-tr-lg">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders?.length > 0 ? (
                      orders.map((order) => {
                        return (
                          <tr key={order._id} className="border-b hover:bg-gray-50 transition-all">
                            <td className="p-4 font-bold text-gray-900 truncate max-w-[100px]">{order._id}</td>
                            <td className="p-4">{order?.orderItems[0]?.name}</td>

                        

                            <td className="p-4">{order?.user?.name || "Deleted User"}</td>
                            <td className="p-4">{order?.paidAt ? (<span> {new Date(order?.paidAt).toLocaleString("vi-VN")} </span>) : "" }</td>
                            <td className="p-4">{order?.isDelivered ? (<span> {new Date(order?.deliveredAt).toLocaleString("vi-VN")} </span>) : "" }</td>
                            <td className="p-4 font-semibold">${(order.totalPrice || 0).toFixed(2)}</td>
                            <td className="p-4">
                              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                                order.status === 'Delivered' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                              }`}>
                                {order.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-gray-500">No recent orders found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* CỘT PHẢI (Chiếm 1/3): Gói 2 cục Cảnh báo vào chung 1 cột dọc */}
            <div className="lg:col-span-1 flex flex-col gap-6">
              
              {/* 1. Cảnh báo hàng SẮP HẾT (Màu đỏ) */}
              <div className="bg-white shadow-sm rounded-xl p-6 border border-gray-100">
                <div className="flex items-center gap-2 mb-4">
                  <h2 className="text-lg font-bold text-red-600">⚠️ Sắp hết hàng</h2>
                  <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">
                    {lowStockProducts.length}
                  </span>
                </div>
                
                <div className="max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                  {lowStockProducts.length > 0 ? (
                    <ul className="space-y-3">
                      {lowStockProducts.map(product => (
                        <li key={product._id} className="flex justify-between items-center p-3 bg-red-50 rounded-lg border border-red-100">
                          <div className="flex flex-col overflow-hidden w-2/3">
                            <span className="text-sm font-semibold text-gray-800 truncate" title={product.name}>
                              {product.name}
                            </span>
                            <span className="text-xs text-gray-500">SKU: {product.sku}</span>
                          </div>
                          <div className="flex flex-col items-end w-1/3">
                            <span className="text-lg font-bold text-red-600">{product.countInStock}</span>
                            <span className="text-[10px] text-red-400 uppercase font-bold">Còn lại</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center py-6">
                      <span className="text-3xl mb-2">✅</span>
                      <p className="text-gray-500 text-sm">Kho hàng đang đầy đủ!</p>
                    </div>
                  )}
                </div>
              </div>

              {/* 2. Cảnh báo hàng TỒN NHIỀU (Màu xanh dương) */}
              <div className="bg-white shadow-sm rounded-xl p-6 border border-gray-100">
                <div className="flex items-center gap-2 mb-4">
                  <h2 className="text-lg font-bold text-blue-600">📦 Tồn kho nhiều</h2>
                  <span className="bg-blue-100 text-blue-600 text-xs font-bold px-2 py-0.5 rounded-full">
                    {highStockProducts.length}
                  </span>
                </div>
                
                <div className="max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                  {/* ĐÃ FIX LOGIC: Chỉ cần .length > 0 là render */}
                  {highStockProducts.length > 0 ? (
                    <ul className="space-y-3">
                      {highStockProducts.map(product => (
                        <li key={product._id} className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border border-blue-100">
                          <div className="flex flex-col overflow-hidden w-2/3">
                            <span className="text-sm font-semibold text-gray-800 truncate" title={product.name}>
                              {product.name}
                            </span>
                            <span className="text-xs text-gray-500">SKU: {product.sku}</span>
                          </div>
                          <div className="flex flex-col items-end w-1/3">
                            <span className="text-lg font-bold text-blue-600">{product.countInStock}</span>
                            <span className="text-[10px] text-blue-400 uppercase font-bold">Còn lại</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center py-6">
                      <span className="text-3xl mb-2">🎯</span>
                      <p className="text-gray-500 text-sm">Không có hàng tồn đọng quá nhiều!</p>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default AdminHomePage;