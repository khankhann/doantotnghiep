import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { fetchAdminProducts } from "@redux/slices/adminProductSlice";
import { fetchAllOrders } from "@redux/slices/adminOrderSlice";
import { fetchSensorData } from "@redux/slices/iotSensorSlice";

// Helper function để định dạng tiền VNĐ
const formatPrice = (price) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);
};

function AdminHomePage() {
  const dispatch = useDispatch();
  const {
    products,
    loading: productsLoading,
    error: productsError,
  } = useSelector((state) => state.adminProducts);
  const {
    orders,
    totalOrders,
    totalSales,
    loading: ordersLoading,
    error: ordersError,
  } = useSelector((state) => state.adminOrders);

  const [timeFilter, setTimeFilter] = useState("7days");

  // ==========================================
  // LOGIC IOT: NHẬN DỮ LIỆU TỪ ESP32
  // ==========================================
  const { data: sensorData } = useSelector((state) => state.iotSensor);
  const [iotHistory, setIotHistory] = useState([]);
  // Thêm state này để lưu giá trị lần gần nhất
  const [lastValue, setLastValue] = useState({ temp: null, hum: null });

  useEffect(() => {
    const interval = setInterval(() => {
      dispatch(fetchSensorData());
    }, 3000);

    return () => clearInterval(interval);
  }, [dispatch]);

  useEffect(() => {
    if (sensorData && sensorData.temperature !== undefined) {
      // Chỉ cập nhật history khi giá trị thay đổi so với lần ghi gần nhất
      const isChanged = 
        sensorData.temperature !== lastValue.temp || 
        sensorData.humidity !== lastValue.hum;

      if (isChanged) {
        setIotHistory((prev) => {
          const newHistory = [
            ...prev,
            {
              time: sensorData.updatedAt || new Date().toLocaleTimeString("vi-VN"),
              temp: sensorData.temperature,
              humidity: sensorData.humidity,
            },
          ];
          return newHistory.length > 15 ? newHistory.slice(1) : newHistory;
        });
        
        // Lưu lại giá trị vừa cập nhật
        setLastValue({ temp: sensorData.temperature, hum: sensorData.humidity });
      }
    }
  }, [sensorData, lastValue]);
  // ==========================================
  // LOGIC 1: DỮ LIỆU BIỂU ĐỒ DOANH THU
  // ==========================================
  const currentChartData = useMemo(() => {
    if (!orders || orders.length === 0) return [];

    const data = [];
    const today = new Date();
    const daysToScan =
      timeFilter === "7days" ? 7 : timeFilter === "1month" ? 30 : 365;

    for (let i = daysToScan - 1; i >= 0; i--) {
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() - i);

      const d = String(targetDate.getDate()).padStart(2, "0");
      const m = String(targetDate.getMonth() + 1).padStart(2, "0");
      const y = targetDate.getFullYear();

      const label = timeFilter === "1year" ? `${m}/${y}` : `${d}/${m}`;
      const fullDateStr = `${d}/${m}/${y}`;

      const dailyRevenue = orders.reduce((sum, order) => {
        const orderDate = new Date(order.createdAt);
        const od = String(orderDate.getDate()).padStart(2, "0");
        const om = String(orderDate.getMonth() + 1).padStart(2, "0");
        const oy = orderDate.getFullYear();
        const orderDateStr = `${od}/${om}/${oy}`;

        if (timeFilter === "1year") {
          return om === m && oy === y ? sum + (order.totalPrice || 0) : sum;
        }
        return orderDateStr === fullDateStr
          ? sum + (order.totalPrice || 0)
          : sum;
      }, 0);

      if (timeFilter === "1year") {
        const existingMonth = data.find((item) => item.name === label);
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
      const categoryName = product.category?.name; // Lấy tên danh mục

      if (categoryName) {
        acc[categoryName] = (acc[categoryName] || 0) + 1;
      }

      return acc;
    }, {});

    return Object.entries(categoryCount).map(([name, value]) => ({
      name,
      value,
    }));
  }, [products]);

  const COLORS = [
    "#3B82F6",
    "#10B981",
    "#F59E0B",
    "#EF4444",
    "#8B5CF6",
    "#EC4899",
    "#14B8A6",
  ];

  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
  }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos((-midAngle * Math.PI) / 180);
    const y = cy + radius * Math.sin((-midAngle * Math.PI) / 180);
    return percent > 0.05 ? (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        fontSize={14}
        fontWeight="bold">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    ) : null;
  };

  // ==========================================
  // LOGIC 3: TÌM SẢN PHẨM SẮP HẾT / TỒN NHIỀU
  // ==========================================
  const lowStockProducts =
    products?.filter((product) => product.countInStock < 10) || [];
  const highStockProducts =
    products?.filter((product) => product.countInStock > 50) || [];

  useEffect(() => {
    dispatch(fetchAdminProducts());
    dispatch(fetchAllOrders());
  }, [dispatch]);

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        {" "}
        Admin Dashboard{" "}
      </h1>

      {productsLoading || ordersLoading ? (
        <p className="text-center text-gray-500 py-10">Đang tải dữ liệu... </p>
      ) : productsError || ordersError ? (
        <p className="text-center text-red-500 py-10">
          Lỗi: {productsError || ordersError}
        </p>
      ) : (
        <>
          {/* PHẦN IOT MỚI THAY THẾ CHO IotDashboard */}
          <div className="mb-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="flex flex-col gap-6 lg:col-span-1">
              <div className="p-6 shadow-sm rounded-xl bg-white border-l-4 border-red-500 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                    Nhiệt độ kho
                  </h2>
                  <p className="text-4xl font-bold text-gray-900 mt-2">
                    {sensorData.temperature > 0 ? sensorData.temperature : "--"}
                    <span className="text-2xl text-gray-400 font-medium ml-1">
                      °C
                    </span>
                  </p>
                </div>
              </div>
              <div className="p-6 shadow-sm rounded-xl bg-white border-l-4 border-blue-500 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                    Độ ẩm kho
                  </h2>
                  <p className="text-4xl font-bold text-gray-900 mt-2">
                    {sensorData.humidity}
                    <span className="text-2xl text-gray-400 font-medium ml-1">
                      %
                    </span>
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 shadow-sm rounded-xl lg:col-span-2 border border-gray-100">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
                Theo dõi Môi trường (Real-time)
              </h2>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={iotHistory}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#f0f0f0"
                      vertical={false}
                    />
                    <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                    <YAxis
                      yAxisId="left"
                      tick={{ fontSize: 10 }}
                      domain={["dataMin - 5", "dataMax + 5"]}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      tick={{ fontSize: 10 }}
                      domain={["dataMin - 5", "dataMax + 5"]}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "8px",
                        border: "none",
                        boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                      }}
                    />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="temp"
                      name="Nhiệt độ (°C)"
                      stroke="#EF4444"
                      strokeWidth={3}
                      dot={{ r: 3 }}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="humidity"
                      name="Độ ẩm (%)"
                      stroke="#3B82F6"
                      strokeWidth={3}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* TẦNG 1: 3 THẺ TỔNG KẾT */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className="p-6 shadow-sm rounded-xl bg-white border-l-4 border-green-500 flex flex-col justify-between hover:shadow-md transition-shadow">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                {" "}
                Total Revenue{" "}
              </h2>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {" "}
                {formatPrice(totalSales || 0)}{" "}
              </p>
            </div>

            <div className="p-6 shadow-sm rounded-xl bg-white border-l-4 border-blue-500 flex flex-col justify-between hover:shadow-md transition-shadow">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                {" "}
                Total Orders{" "}
              </h2>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {" "}
                {totalOrders || orders?.length || 0}{" "}
              </p>
              <Link
                to="/admin/orders"
                className="text-sm text-blue-600 hover:text-blue-800 mt-2 font-medium">
                {" "}
                Manage Orders →{" "}
              </Link>
            </div>

            <div className="p-6 shadow-sm rounded-xl bg-white border-l-4 border-yellow-500 flex flex-col justify-between hover:shadow-md transition-shadow">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                {" "}
                Total Products{" "}
              </h2>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {" "}
                {products?.length || 0}{" "}
              </p>
              <Link
                to="/admin/products"
                className="text-sm text-blue-600 hover:text-blue-800 mt-2 font-medium">
                {" "}
                Manage Products →{" "}
              </Link>
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
                  onChange={(e) => setTimeFilter(e.target.value)}>
                  <option value="7days">7 ngày qua</option>
                  <option value="1month">30 ngày qua</option>
                  <option value="1year">1 năm qua</option>
                </select>
              </div>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={currentChartData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#f0f0f0"
                      vertical={false}
                    />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis
                      tickFormatter={(val) => val.toLocaleString("vi-VN")}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip
                      formatter={(val) => [formatPrice(val), "Doanh thu"]}
                      contentStyle={{
                        borderRadius: "8px",
                        border: "none",
                        boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#10B981"
                      strokeWidth={4}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-6 shadow-sm rounded-xl lg:col-span-1 border border-gray-100">
              <h2 className="text-lg font-bold text-gray-800 mb-6">
                Sản phẩm theo Danh mục
              </h2>
              <div className="h-[300px]">
                {dynamicCategoryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={dynamicCategoryData}
                        innerRadius={60}
                        outerRadius={110}
                        paddingAngle={5}
                        dataKey="value"
                        labelLine={false}
                        label={renderCustomizedLabel}>
                        {dynamicCategoryData.map((_, index) => (
                          <Cell
                            key={index}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value, name) => [`${value} Sản phẩm`, name]}
                        contentStyle={{
                          borderRadius: "8px",
                          border: "none",
                          boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                        }}
                      />
                      <Legend
                        verticalAlign="bottom"
                        height={36}
                        iconType="circle"
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    Chưa có dữ liệu
                  </div>
                )}
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
                        <td className="p-4 font-bold">
                          #{order._id.slice(-6).toUpperCase()}
                        </td>
                        <td className="p-4 truncate max-w-[150px]">
                          {order?.orderItems?.[0]?.name || "N/A"}
                        </td>
                        <td className="p-4">
                          {new Date(order.createdAt).toLocaleDateString(
                            "vi-VN",
                          )}
                        </td>
                        <td className="p-4 font-black text-green-700">
                          {formatPrice(order.totalPrice || 0)}
                        </td>
                        <td className="p-4 text-center">
                          <span
                            className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                              order.status === "Delivered"
                                ? "bg-green-100 text-green-700"
                                : "bg-orange-100 text-orange-700"
                            }`}>
                            {order.status || "Processing"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* PHẦN CẢNH BÁO TỒN KHO (ĐÃ FIX UI "TỔNG") */}
            <div className="lg:col-span-1 flex flex-col gap-6">
              {/* Sắp hết hàng */}
              <div className="bg-white shadow-sm rounded-xl p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-50">
                  <h2 className="text-lg font-bold text-red-600 flex items-center gap-2">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                    </svg>
                    Sắp hết hàng
                  </h2>
                  <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-1 rounded-lg">
                    {lowStockProducts.length} SP
                  </span>
                </div>
                <div className="max-h-[300px] overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                  {lowStockProducts.map((p) => (
                    <Link
                      to={`/admin/products/${p._id}/edit`}
                      key={p._id}
                      className="block p-3 bg-red-50 hover:bg-red-100 border border-red-100 transition-colors rounded-lg group">
                      {/* FIX: Tách Flex để chữ Tổng không bị ép xuống dòng */}
                      <div className="flex justify-between items-center mb-2">
                        <span
                          className="text-sm font-semibold truncate flex-1 mr-2 group-hover:text-red-700 transition-colors"
                          title={p.name}>
                          {p.name}
                        </span>
                        <span className="whitespace-nowrap px-2.5 py-1 bg-white border border-red-200 text-red-600 text-xs font-bold rounded-md shadow-sm">
                          Tổng: {p.countInStock}
                        </span>
                      </div>
                      {/* Chi tiết từng Size/Color */}
                      {p.variants && p.variants.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {p.variants.map((v, idx) => (
                            <span
                              key={idx}
                              className={`text-[10px] px-1.5 py-0.5 rounded border ${v.stock === 0 ? "bg-red-200 border-red-300 text-red-800 font-bold" : "bg-white border-red-200 text-gray-600"}`}>
                              {v.variantName}:{" "}
                              <strong
                                className={`${v.stock === 0 ? "text-red-700" : "text-black"}`}>
                                {v.stock}
                              </strong>
                            </span>
                          ))}
                        </div>
                      )}
                    </Link>
                  ))}
                  {lowStockProducts.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-4">
                      Kho đang ổn định, không có SP sắp hết.
                    </p>
                  )}
                </div>
              </div>

              {/* Tồn kho nhiều */}
              <div className="bg-white shadow-sm rounded-xl p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-50">
                  <h2 className="text-lg font-bold text-blue-600 flex items-center gap-2">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"></path>
                    </svg>
                    Tồn kho nhiều
                  </h2>
                  <span className="bg-blue-100 text-blue-600 text-xs font-bold px-2 py-1 rounded-lg">
                    {highStockProducts.length} SP
                  </span>
                </div>
                <div className="max-h-[300px] overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                  {highStockProducts.map((p) => (
                    <Link
                      to={`/admin/products/${p._id}/edit`}
                      key={p._id}
                      className="block p-3 bg-blue-50 hover:bg-blue-100 border border-blue-100 transition-colors rounded-lg group">
                      {/* FIX TƯƠNG TỰ BÊN DƯỚI */}
                      <div className="flex justify-between items-center mb-2">
                        <span
                          className="text-sm font-semibold truncate flex-1 mr-2 group-hover:text-blue-700 transition-colors"
                          title={p.name}>
                          {p.name}
                        </span>
                        <span className="whitespace-nowrap px-2.5 py-1 bg-white border border-blue-200 text-blue-600 text-xs font-bold rounded-md shadow-sm">
                          Tổng: {p.countInStock}
                        </span>
                      </div>
                      {/* Chi tiết từng Size/Color */}
                      {p.variants && p.variants.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {p.variants.map((v, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] bg-white border border-blue-200 text-gray-600 px-1.5 py-0.5 rounded">
                              {v.variantName}:{" "}
                              <strong className="text-blue-700">
                                {v.stock}
                              </strong>
                            </span>
                          ))}
                        </div>
                      )}
                    </Link>
                  ))}
                  {highStockProducts.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-4">
                      Không có SP nào tồn kho quá nhiều.
                    </p>
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
