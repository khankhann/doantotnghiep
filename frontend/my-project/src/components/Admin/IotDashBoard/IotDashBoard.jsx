import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { fetchSensorData, fetchHistoryData, clearHistory } from "@redux/slices/iotSensorSlice";
import GaugeChart from 'react-gauge-chart';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function IotDashboard() {
  const dispatch = useDispatch();
  
  // Bóc tách data từ Redux (Có thêm historyData và isHistoryLoading)
  const { data, historyData, loading, isError, message } = useSelector((state) => state.iotSensor);
  
  // Các state giao diện
  const [showChart, setShowChart] = useState(false);
  const [timeFilter, setTimeFilter] = useState("realtime");
  
  // Bộ nhớ tạm chỉ dành riêng cho lúc xem Real-time
  const [realtimeHistory, setRealtimeHistory] = useState([]);

  // 1. GỌI DATA REAL-TIME MỖI 2 GIÂY
  useEffect(() => {
    dispatch(fetchSensorData());
    const interval = setInterval(() => {
      dispatch(fetchSensorData());
    }, 2000);
    return () => clearInterval(interval);
  }, [dispatch]);

  // 2. LOGIC GOM DATA REAL-TIME (Chỉ chạy khi đang ở chế độ Real-time)
  useEffect(() => {
    if (timeFilter === "realtime" && data && data.temperature !== 0) {
      setRealtimeHistory(prev => {
        const newDataPoint = {
          time: data.updatedAt || new Date().toLocaleTimeString('vi-VN'),
          temp: data.temperature,
          hum: data.humidity
        };
        const newHistory = [...prev, newDataPoint];
        return newHistory.length > 15 ? newHistory.slice(newHistory.length - 15) : newHistory;
      });
    }
  }, [data, timeFilter]);

  // 3. LOGIC GỌI DATA LỊCH SỬ KHI ĐỔI MENU (1h, 24h, 7d)
  useEffect(() => {
    if (timeFilter !== "realtime") {
      dispatch(fetchHistoryData(timeFilter)); // Redux đi lấy lịch sử
    } else {
      dispatch(clearHistory()); // Trở về realtime thì xóa data lịch sử trong Redux đi
    }
  }, [timeFilter, dispatch]);

  // 4. HÀM XỬ LÝ NÚT XÓA BIỂU ĐỒ
  const handleClearChart = () => {
    if (timeFilter === "realtime") {
      setRealtimeHistory([]); // Xóa bộ nhớ tạm Real-time
    } else {
      dispatch(clearHistory()); // Gọi Redux xóa bộ nhớ lịch sử
    }
  };

  // QUYẾT ĐỊNH XEM LẤY DATA NÀO ĐỂ VẼ LÊN BIỂU ĐỒ
  const chartDataToDisplay = timeFilter === "realtime" ? realtimeHistory : historyData;

  // Cấu hình đồng hồ
  const MAX_TEMP = 32;
  const MAX_HUM = 65;

  const getTempPercentage = (temp) => {
    const tempValue = parseFloat(temp);
    if (isNaN(tempValue)) return 0;
    return tempValue / 50 > 1 ? 1 : tempValue / 50; // Chia 50 cho kim vươn cao
  };

  const getHumPercentage = (hum) => {
    const humValue = parseFloat(hum);
    if (isNaN(humValue)) return 0;
    return humValue / 100;
  };

  return (
    <div className="bg-white p-8 shadow-md rounded-2xl border border-gray-100 mb-8">
      
      {/* HEADER DASHBOARD */}
      <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-800"> Quản lý nhiệt độ/ độ ẩm kho hàng</h2>
          <p className="text-sm text-gray-500 mt-1 font-medium">
            Trạng thái hệ thống: {data.temperature === 0 ? " Đang chờ kết nối..." : "Đang hoạt động"}
          </p>
        </div>
        
        {data.is_alert && (
          <div className="animate-bounce bg-red-100 text-red-600 text-sm font-bold px-4 py-2 rounded-full border-2 border-red-300 shadow-sm flex items-center gap-2">
            <span className="animate-pulse">🔴</span> ĐANG BÁO ĐỘNG
          </div>
        )}
      </div>
      
      {isError && (
        <p className="text-red-500 font-medium mb-6 bg-red-50 p-4 rounded-xl border border-red-200">
           Mất kết nối hệ thống: {message}
        </p>
      )}

      {/* KHUNG HIỂN THỊ ĐỒNG HỒ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="flex flex-col items-center bg-gray-50/50 p-6 rounded-2xl border border-gray-200 shadow-inner">
          <h3 className="text-gray-500 font-bold mb-4 text-sm uppercase tracking-widest"> Nhiệt Độ Hiện Tại</h3>
          <div className="w-full max-w-sm">
            <GaugeChart id="temp-gauge" 
              nrOfLevels={20} colors={["#10b981", "#fb923c", "#ef4444"]} arcWidth={0.25} arcPadding={0.03}
              percent={getTempPercentage(data.temperature)} textColor="#1f2937" animate={false}
              needleColor="#4b5563" needleBaseColor="#1f2937" formatTextValue={() => `${data.temperature}°C`}
            />
          </div>
          <p className={`mt-2 font-bold text-sm bg-white px-4 py-2 rounded-full shadow-sm border ${
            data.temperature > MAX_TEMP ? "text-red-600 border-red-200" : "text-emerald-600 border-emerald-200"
          }`}>{data.tempStatus}</p>
        </div>

        <div className="flex flex-col items-center bg-gray-50/50 p-6 rounded-2xl border border-gray-200 shadow-inner">
          <h3 className="text-gray-500 font-bold mb-4 text-sm uppercase tracking-widest"> Độ Ẩm Kho</h3>
          <div className="w-full max-w-sm">
            <GaugeChart id="hum-gauge" 
              nrOfLevels={20} colors={["#a7f3d0", "#10b981"]} arcWidth={0.25} arcPadding={0.03}
              percent={getHumPercentage(data.humidity)} textColor="#1f2937" animate={false}
              needleColor="#4b5563" needleBaseColor="#1f2937" formatTextValue={() => `${data.humidity}%`}
            />
          </div>
          <p className={`mt-2 font-bold text-sm bg-white px-4 py-2 rounded-full shadow-sm border ${
            data.humidity > MAX_HUM ? "text-red-600 border-red-200" : "text-emerald-600 border-emerald-200"
          }`}>{data.humStatus}</p>
        </div>
      </div>

      {/* 📈 BIỂU ĐỒ ĐƯỜNG (LINE CHART) CÓ CÔNG CỤ LỌC & XÓA */}
      <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-200 shadow-inner">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4 border-b pb-4 border-gray-200">
          <h3 className="text-gray-600 font-extrabold text-lg tracking-wide border-l-4 border-blue-500 pl-3">
              BIỂU ĐỒ BIẾN THIÊN
          </h3>
          
          <div className="flex items-center gap-3">
            {/* Lọc thời gian */}
            <select 
              value={timeFilter} 
              onChange={(e) => setTimeFilter(e.target.value)}
              className="bg-white border border-gray-300 text-gray-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block px-3 py-2 shadow-sm font-semibold outline-none"
            >
              <option value="realtime"> Real-time</option>
              <option value="1h"> 1 Giờ qua</option>
              <option value="24h"> 24 Giờ qua</option>
              <option value="7d"> 7 Ngày qua</option>
            </select>

            {/* Nút Xóa */}
            <button 
              onClick={handleClearChart}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm font-bold hover:bg-red-100 transition-colors shadow-sm"
            >
               Xóa
            </button>

            {/* Nút Ẩn/Hiện */}
            <button 
              onClick={() => setShowChart(!showChart)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition-colors shadow-sm"
            >
              {showChart ? " Ẩn" : " Xem"}
            </button>
          </div>
        </div>

        {/* Khung chứa biểu đồ */}
        {showChart && (
          <div className="w-full h-80 animate-fade-in-down">
            {loading ? (
              <div className="flex h-full items-center justify-center text-gray-500 font-bold border-2 border-dashed border-gray-300 rounded-xl bg-white">
                 Đang tải dữ liệu từ Server...
              </div>
            ) : chartDataToDisplay.length === 0 ? (
              <div className="flex h-full items-center justify-center text-gray-400 font-medium border-2 border-dashed border-gray-300 rounded-xl bg-white">
                Chưa có dữ liệu để hiển thị
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartDataToDisplay} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="time" tick={{fontSize: 12, fill: '#6b7280'}} />
                  <YAxis yAxisId="left" tick={{fill: '#ef4444'}} domain={[0, 50]} />
                  <YAxis yAxisId="right" orientation="right" tick={{fill: '#10b981'}} domain={[0, 100]} />
                  
                  <Tooltip contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}/>
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  
                  <Line yAxisId="left" type="monotone" dataKey="temp" name="Nhiệt độ (°C)" stroke="#ef4444" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} animationDuration={300} />
                  <Line yAxisId="right" type="monotone" dataKey="hum" name="Độ ẩm (%)" stroke="#10b981" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} animationDuration={300} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        )}
      </div>

    </div>
  );
}

export default IotDashboard;