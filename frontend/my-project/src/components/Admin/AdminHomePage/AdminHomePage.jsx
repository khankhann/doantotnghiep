import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { useEffect, useState, useMemo } from "react"; 
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

  // ==========================================
  // LOGIC 1: DATA DYNAMIC CHO BIỂU ĐỒ DOANH THU
  // ==========================================
  const currentChartData = useMemo(() => {
    if (!orders || orders.length === 0) return [];
    
    const daysToGenerate = timeFilter === '7days' ? 7 : 30;
    const data = [];
    const today = new Date();

    // Tạo mảng N ngày gần nhất
    for (let i = daysToGenerate - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const dateString = `${day}/${month}`; // Định dạng: DD/MM

      // Tính tổng doanh thu của ngày đó (Có thể filter thêm điều kiện order.isPaid nếu cần)
      const dailyRevenue = orders.reduce((sum, order) => {
        const orderDate = new Date(order.createdAt);
        const orderDay = String(orderDate.getDate()).padStart(2, '0');
        const orderMonth = String(orderDate.getMonth() + 1).padStart(2, '0');
        
        if (`${orderDay}/${orderMonth}` === dateString) {
          return sum + (order.totalPrice || 0);
        }
        return sum;
      }, 0);

      data.push({ name: dateString, revenue: dailyRevenue });
    }
    return data;
  }, [orders, timeFilter]);

  // ==========================================
  // LOGIC 2: DATA DYNAMIC CHO BIỂU ĐỒ TRÒN (DANH MỤC SP)
  // ==========================================
  const dynamicCategoryData = useMemo(() => {
    if (!products || products.length === 0) return [];

    // Đếm số lượng sản phẩm theo từng Category
    const categoryCount = products.reduce((acc, product) => {
      const category = product.category || 'Khác';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});

    // Chuyển object thành mảng cho Recharts
    return Object.entries(categoryCount).map(([name, value]) => ({
      name,
      value
    }));
  }, [products]);

  // Bảng màu cho Pie Chart (Thêm nhiều màu lỡ có nhiều danh mục)
  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6'];

  // ==========================================
  // LOGIC 3: TÌM SẢN PHẨM SẮP HẾT / TỒN NHIỀU
  // ==========================================
  const lowStockProducts = products?.filter(product => product.countInStock < 10) || [];
  const highStockProducts = products?.filter(product => product.countInStock > 50 ) || [];

  useEffect(() => {
    dispatch(fetchAdminProducts());
    dispatch(fetchAllOrders());
  }, [dispatch]);

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
              <p className="text-3xl font-bold text-gray-900 mt-2"> {totalOrders || orders?.length || 0} </p>
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
            <div className="bg-white p-6 shadow-sm rounded-xl lg:col-span-2 border border-gray-100 flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-gray-800">Doanh thu</h2>
                
                {/* NÚT LỌC THỜI GIAN */}
                <select 
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2 cursor-pointer outline-none"
                  value={timeFilter}
                  onChange={(e) => setTimeFilter(e.target.value)}
                >
                  <option value="7days">7 ngày qua</option>
                  <option value="1month">30 ngày qua</option>
                </select>
              </div>

              <div className="flex-1 w-full min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={currentChartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} dy={10} />
                    <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} tickFormatter={(value) => `$${value}`} axisLine={false} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      formatter={(value) => [`$${value.toFixed(2)}`, 'Doanh thu']}
                      labelStyle={{ fontWeight: 'bold', color: '#374151' }}
                    />
                    <Line type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={4} dot={{ r: 4, fill: '#10B981', strokeWidth: 2 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Biểu đồ tròn (Donut Chart) */}
            <div className="bg-white p-6 shadow-sm rounded-xl lg:col-span-1 border border-gray-100 flex flex-col">
              <h2 className="text-lg font-bold text-gray-800 mb-6">Sản phẩm theo Danh mục</h2>
              <div className="flex-1 w-full min-h-[300px]">
                {dynamicCategoryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie 
                        data={dynamicCategoryData} 
                        cx="50%" 
                        cy="50%" 
                        innerRadius={70} 
                        outerRadius={100} 
                        paddingAngle={5} 
                        dataKey="value"
                      >
                        {dynamicCategoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value) => [`${value} sản phẩm`, 'Số lượng']} 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '13px', paddingTop: '20px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    Chưa có sản phẩm nào
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* TẦNG 3: BẢNG ORDERS VÀ CẢNH BÁO */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* CỘT TRÁI (Chiếm 2/3): Bảng danh sách Orders */}
            <div className="bg-white shadow-sm rounded-xl p-6 border border-gray-100 lg:col-span-2">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-gray-800">Recent Orders</h2>
                <Link to="/admin/orders" className="text-sm text-blue-600 hover:underline">Xem tất cả</Link>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-gray-500 text-sm">
                  <thead className="bg-gray-50 text-xs uppercase text-gray-700 border-b">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Order ID</th>
                      <th className="py-3 px-4 font-semibold">Product</th>
                      <th className="py-3 px-4 font-semibold">User</th>
                      <th className="py-3 px-4 font-semibold">Date</th>
                      <th className="py-3 px-4 font-semibold">Total</th>
                      <th className="py-3 px-4 font-semibold text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {/* 👇 Tui dùng .slice(0, 5) để chỉ hiện 5 đơn hàng mới nhất thôi, cho bảng đỡ bị dài thòng */}
                    {orders?.length > 0 ? (
                      orders.slice(0, 5).map((order) => {
                        return (
                          <tr key={order._id} className="hover:bg-gray-50 transition-all">
                            <td className="p-4 font-bold text-gray-900 whitespace-nowrap">#{order._id.slice(-6).toUpperCase()}</td>
                            <td className="p-4 truncate max-w-[150px]" title={order?.orderItems?.[0]?.name}>
                              {order?.orderItems?.[0]?.name || 'N/A'}
                            </td>
                            <td className="p-4 font-medium">{order?.user?.name || <span className="text-red-400 text-xs">Deleted User</span>}</td>
                            <td className="p-4 text-xs text-gray-400">
                              {order?.createdAt ? new Date(order.createdAt).toLocaleDateString("vi-VN") : "N/A"}
                            </td>
                            <td className="p-4 font-black text-gray-800">${(order.totalPrice || 0).toFixed(2)}</td>
                            <td className="p-4 text-center">
                              <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                order.status === 'Delivered' ? 'bg-green-100 text-green-700' : 
                                order.status === 'Shipped' ? 'bg-blue-100 text-blue-700' :
                                order.status === 'Cancelled' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                              }`}>
                                {order.status || 'Processing'}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-gray-500 bg-gray-50/50">Chưa có đơn hàng nào.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* CỘT PHẢI (Chiếm 1/3): Cảnh báo hàng hoá */}
            <div className="lg:col-span-1 flex flex-col gap-6">
              
              {/* 1. Cảnh báo hàng SẮP HẾT */}
              <div className="bg-white shadow-sm rounded-xl p-6 border border-gray-100 flex-1">
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
                            <span className="text-[10px] text-gray-500 font-medium mt-0.5">SKU: {product.sku}</span>
                          </div>
                          <div className="flex flex-col items-end w-1/3">
                            <span className="text-lg font-black text-red-600">{product.countInStock}</span>
                            <span className="text-[9px] text-red-400 uppercase font-bold">Còn lại</span>
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

              {/* 2. Cảnh báo hàng TỒN NHIỀU */}
              <div className="bg-white shadow-sm rounded-xl p-6 border border-gray-100 flex-1">
                <div className="flex items-center gap-2 mb-4">
                  <h2 className="text-lg font-bold text-blue-600">📦 Tồn kho nhiều</h2>
                  <span className="bg-blue-100 text-blue-600 text-xs font-bold px-2 py-0.5 rounded-full">
                    {highStockProducts.length}
                  </span>
                </div>
                
                <div className="max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                  {highStockProducts.length > 0 ? (
                    <ul className="space-y-3">
                      {highStockProducts.map(product => (
                        <li key={product._id} className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border border-blue-100">
                          <div className="flex flex-col overflow-hidden w-2/3">
                            <span className="text-sm font-semibold text-gray-800 truncate" title={product.name}>
                              {product.name}
                            </span>
                            <span className="text-[10px] text-gray-500 font-medium mt-0.5">SKU: {product.sku}</span>
                          </div>
                          <div className="flex flex-col items-end w-1/3">
                            <span className="text-lg font-black text-blue-600">{product.countInStock}</span>
                            <span className="text-[9px] text-blue-400 uppercase font-bold">Còn lại</span>
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