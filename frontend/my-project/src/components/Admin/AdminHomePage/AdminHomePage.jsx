import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { useEffect, useState, useMemo } from "react"; 
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { fetchAdminProducts } from "@redux/slices/adminProductSlice"; 
import { fetchAllOrders } from "@redux/slices/adminOrderSlice";
import IotDashboard from '../IotDashBoard/IotDashBoard';

// Helper function để định dạng tiền VNĐ  
const formatPrice = (price) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);
};

function AdminHomePage() {
  const dispatch = useDispatch();
  const { products, loading: productsLoading, error: productsError } = useSelector((state) => state.adminProducts);
  const { orders, totalOrders, totalSales, loading: ordersLoading, error: ordersError } = useSelector((state) => state.adminOrders);

  const [timeFilter, setTimeFilter] = useState('7days');

  // ==========================================
  // LOGIC 1: DỮ LIỆU BIỂU ĐỒ DOANH THU (ĐÃ FIX LỖI CỘNG CHUỖI)
  // ==========================================
  const currentChartData = useMemo(() => {
    if (!orders || orders.length === 0) return [];
    
    const data = [];
    const today = new Date();
    const daysToScan = timeFilter === '7days' ? 7 : (timeFilter === '1month' ? 30 : 365);

    for (let i = daysToScan - 1; i >= 0; i--) {
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() - i);
      
      const d = String(targetDate.getDate()).padStart(2, '0');
      const m = String(targetDate.getMonth() + 1).padStart(2, '0');
      const y = targetDate.getFullYear();
      
      const label = timeFilter === '1year' ? `${m}/${y}` : `${d}/${m}`;
      const fullDateStr = `${d}/${m}/${y}`;

      const dailyRevenue = orders.reduce((sum, order) => {
        const orderDate = new Date(order.createdAt);
        const od = String(orderDate.getDate()).padStart(2, '0');
        const om = String(orderDate.getMonth() + 1).padStart(2, '0');
        const oy = orderDate.getFullYear();
        const orderDateStr = `${od}/${om}/${oy}`;

        if (timeFilter === '1year') {
           return (om === m && oy === y) ? sum + (order.totalPrice || 0) : sum;
        }
        return orderDateStr === fullDateStr ? sum + (order.totalPrice || 0) : sum;
      }, 0);

      if (timeFilter === '1year') {
        const existingMonth = data.find(item => item.name === label);
        if (existingMonth) {
          existingMonth.revenue += dailyRevenue;
        } else {
          data.push({ name: label, revenue: dailyRevenue });
        }
      } else {
        data.push({ name: label, revenue: dailyRevenue });
      }
    }
    return data;
  }, [orders, timeFilter]);

  // ==========================================
  // LOGIC 2: DỮ LIỆU BIỂU ĐỒ TRÒN
  // ==========================================
  const dynamicCategoryData = useMemo(() => {
    if (!products || products.length === 0) return [];
    const categoryCount = products.reduce((acc, product) => {
      const category = product.category || 'Khác';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(categoryCount).map(([name, value]) => ({ name, value }));
  }, [products]);

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6'];

  // ==========================================
  // LOGIC 3: TÌM SẢN PHẨM SẮP HẾT / TỒN NHIỀU (GIỮ LẠI THEO YÊU CẦU)
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
        <div className='mb-8'>
          <IotDashboard />
        </div>
          {/* TẦNG 1: 3 THẺ TỔNG KẾT */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className="p-6 shadow-sm rounded-xl bg-white border-l-4 border-green-500 flex flex-col justify-between hover:shadow-md transition-shadow">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide"> Total Revenue </h2>
              <p className="text-2xl font-bold text-gray-900 mt-2"> {formatPrice(totalSales || 0)}  </p> 
            </div>

            <div className="p-6 shadow-sm rounded-xl bg-white border-l-4 border-blue-500 flex flex-col justify-between hover:shadow-md transition-shadow">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide"> Total Orders </h2>
              <p className="text-3xl font-bold text-gray-900 mt-2"> {totalOrders || orders?.length || 0} </p>
              <Link to="/admin/orders" className="text-sm text-blue-600 hover:text-blue-800 mt-2 font-medium"> Manage Orders → </Link>
            </div>

            <div className="p-6 shadow-sm rounded-xl bg-white border-l-4 border-yellow-500 flex flex-col justify-between hover:shadow-md transition-shadow">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide"> Total Products </h2>
              <p className="text-3xl font-bold text-gray-900 mt-2"> {products?.length || 0} </p>
              <Link to="/admin/products" className="text-sm text-blue-600 hover:text-blue-800 mt-2 font-medium"> Manage Products → </Link>
            </div>
          </div>

          {/* TẦNG 2: CÁC BIỂU ĐỒ THỐNG KÊ */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 shadow-sm rounded-xl lg:col-span-2 border border-gray-100">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-gray-800">Doanh thu</h2>
                <select 
                  className="bg-gray-50 border border-gray-300 text-sm rounded-lg p-2 outline-none"
                  value={timeFilter}
                  onChange={(e) => setTimeFilter(e.target.value)}
                >
                  <option value="7days">7 ngày qua</option>
                  <option value="1month">30 ngày qua</option>
                  <option value="1year">1 năm qua</option>
                </select>
              </div>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={currentChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tickFormatter={(val) => val.toLocaleString('vi-VN')} tick={{ fontSize: 12 }} />
                    <Tooltip 
                      formatter={(val) => [formatPrice(val), 'Doanh thu']}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                    />
                    <Line type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={4} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-6 shadow-sm rounded-xl lg:col-span-1 border border-gray-100">
              <h2 className="text-lg font-bold text-gray-800 mb-6">Sản phẩm theo Danh mục</h2>
              <div className="h-[300px]">
                {dynamicCategoryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={dynamicCategoryData} innerRadius={70} outerRadius={100} paddingAngle={5} dataKey="value">
                        {dynamicCategoryData.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <div className="flex items-center justify-center h-full text-gray-400">Chưa có dữ liệu</div>}
              </div>
            </div>
          </div>

          {/* TẦNG 3: BẢNG ORDERS VÀ CẢNH BÁO TỒN KHO */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white shadow-sm rounded-xl p-6 border border-gray-100 lg:col-span-2">
              <h2 className="text-lg font-bold mb-4">Recent Orders</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-gray-50 text-gray-700 border-b">
                    <tr>
                      <th className="py-3 px-4">Order ID</th>
                      <th className="py-3 px-4">Product</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Total</th>
                      <th className="py-3 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders?.slice(0, 5).map((order) => (
                      <tr key={order._id} className="hover:bg-gray-50 border-b">
                        <td className="p-4 font-bold">#{order._id.slice(-6).toUpperCase()}</td>
                        <td className="p-4 truncate max-w-[150px]">{order?.orderItems?.[0]?.name || 'N/A'}</td>
                        <td className="p-4">{new Date(order.createdAt).toLocaleDateString("vi-VN")}</td>
                        <td className="p-4 font-black text-green-700">{formatPrice(order.totalPrice || 0)}</td>
                        <td className="p-4 text-center">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                            order.status === 'Delivered' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                          }`}>
                            {order.status || 'Processing'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* PHẦN CẢNH BÁO TỒN KHO (ĐÃ GIỮ LẠI) */}
            <div className="lg:col-span-1 flex flex-col gap-6">
              <div className="bg-white shadow-sm rounded-xl p-6 border border-gray-100">
                <div className="flex items-center gap-2 mb-4">
                  <h2 className="text-lg font-bold text-red-600"> Sắp hết hàng</h2>
                  <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">{lowStockProducts.length}</span>
                </div>
                <div className="max-h-[250px] overflow-y-auto space-y-3">
                  {lowStockProducts.map(p => (
                    <div key={p._id} className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                      <span className="text-sm font-semibold truncate w-2/3">{p.name}</span>
                      <span className="text-lg font-black text-red-600">{p.countInStock}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white shadow-sm rounded-xl p-6 border border-gray-100">
                <div className="flex items-center gap-2 mb-4">
                  <h2 className="text-lg font-bold text-blue-600">Tồn kho nhiều</h2>
                  <span className="bg-blue-100 text-blue-600 text-xs font-bold px-2 py-0.5 rounded-full">{highStockProducts.length}</span>
                </div>
                <div className="max-h-[250px] overflow-y-auto space-y-3">
                  {highStockProducts.map(p => (
                    <div key={p._id} className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                      <span className="text-sm font-semibold truncate w-2/3">{p.name}</span>
                      <span className="text-lg font-black text-blue-600">{p.countInStock}</span>
                    </div>
                  ))}
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