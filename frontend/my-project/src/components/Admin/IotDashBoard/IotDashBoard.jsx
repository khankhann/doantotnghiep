import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchSensorData, fetchHistoryData, clearHistory } from "@redux/slices/iotSensorSlice";
import GaugeChart from 'react-gauge-chart';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { IoWifiOutline, IoCubeOutline, IoRefreshOutline } from "react-icons/io5";

function IotDashboard() {
  const dispatch = useDispatch();
  const { data, historyData, loading, isError } = useSelector((state) => state.iotSensor);
  
  // Trạng thái kết nối phần cứng
  const [isIotConnected, setIsIotConnected] = useState(false);
  const [showChart, setShowChart] = useState(true);
  const [timeFilter, setTimeFilter] = useState("realtime");
  const [realtimeHistory, setRealtimeHistory] = useState([]);

  // 1. Kiểm tra kết nối khi khởi động
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const result = await dispatch(fetchSensorData()).unwrap();
        // Giả sử server trả về nhiệt độ 0 khi chưa kết nối
        if (result && result.temperature > 0) {
          setIsIotConnected(true);
        }
      } catch (e) {
        console.log("Đang chờ ESP32...");
      }
    };
    checkConnection();
  }, [dispatch]);

  // 2. Fetch dữ liệu real-time (Chỉ chạy khi đã có kết nối)
  useEffect(() => {
    if (!isIotConnected) return;

    const interval = setInterval(() => {
      dispatch(fetchSensorData());
    }, 2000);
    return () => clearInterval(interval);
  }, [dispatch, isIotConnected]);

  // 3. Logic vẽ biểu đồ Real-time
  useEffect(() => {
    if (timeFilter === "realtime" && data && isIotConnected) {
      setRealtimeHistory(prev => {
        const newDataPoint = {
          time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          temp: data.temperature,
          hum: data.humidity
        };
        const newHistory = [...prev, newDataPoint];
        return newHistory.length > 15 ? newHistory.slice(1) : newHistory;
      });
    }
  }, [data, timeFilter, isIotConnected]);

  const chartDataToDisplay = timeFilter === "realtime" ? realtimeHistory : historyData;

  return (
    <div className="bg-white p-6 shadow-sm border border-gray-200 rounded-sm mb-8">
      
      {/* HEADER */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Quản lý Môi trường Kho</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className={`w-2 h-2 rounded-full ${isIotConnected ? "bg-green-500 animate-pulse" : "bg-gray-400"}`}></span>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {isIotConnected ? "ESP32 Đã kết nối" : "Chờ kết nối ESP32..."}
            </p>
          </div>
        </div>
        {!isIotConnected && (
            <button onClick={() => window.location.reload()} className="text-xs px-3 py-1 border border-gray-300 rounded-sm hover:bg-gray-50">
               Thử kết nối lại
            </button>
        )}
      </div>
      
      {/* NỘI DUNG CHÍNH (Chỉ hiển thị khi kết nối thành công) */}
      {isIotConnected ? (
        <>
          {/* Gauge Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="border border-gray-100 p-6 rounded-sm bg-gray-50">
              <h3 className="text-gray-500 font-bold text-[10px] uppercase mb-4">Nhiệt độ hiện tại</h3>
              <GaugeChart nrOfLevels={20} colors={["#3b82f6", "#10b981", "#ef4444"]} arcWidth={0.2} percent={data.temperature / 50} 
                formatTextValue={() => `${data.temperature}°C`} textColor="#111827" animate={false} />
            </div>
            <div className="border border-gray-100 p-6 rounded-sm bg-gray-50">
              <h3 className="text-gray-500 font-bold text-[10px] uppercase mb-4">Độ ẩm hiện tại</h3>
              <GaugeChart nrOfLevels={20} colors={["#a7f3d0", "#10b981"]} arcWidth={0.2} percent={data.humidity / 100} 
                formatTextValue={() => `${data.humidity}%`} textColor="#111827" animate={false} />
            </div>
          </div>

          {/* Biểu đồ */}
          <div className="border border-gray-200 p-6 rounded-sm">
            <div className="flex flex-col sm:flex-row justify-between mb-6 gap-4">
              <h3 className="font-bold text-gray-700 text-sm">BIỂU ĐỒ BIẾN THIÊN</h3>
              <div className="flex gap-2">
                <select onChange={(e) => setTimeFilter(e.target.value)} className="text-xs border border-gray-300 px-2 py-1 rounded-sm outline-none">
                  <option value="realtime">Real-time</option>
                  <option value="1h">1 Giờ</option>
                </select>
                <button onClick={() => setShowChart(!showChart)} className="text-xs px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-sm">
                  {showChart ? "Ẩn" : "Xem biểu đồ"}
                </button>
              </div>
            </div>

            {showChart && (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartDataToDisplay}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="time" tick={{fontSize: 10}} />
                    <YAxis tick={{fontSize: 10}} />
                    <Tooltip />
                    <Line type="monotone" dataKey="temp" name="Nhiệt độ" stroke="#ef4444" strokeWidth={2} dot={false}/>
                    <Line type="monotone" dataKey="hum" name="Độ ẩm" stroke="#10b981" strokeWidth={2} dot={false}/>
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </>
      ) : (
        /* UI khi chưa kết nối */
        <div className="h-64 flex flex-col items-center justify-center border border-dashed border-gray-300 rounded-sm text-gray-400">
           <IoHardwareChipOutline size={40} className="mb-2 opacity-30"/>
           <p className="text-sm font-medium">Hệ thống đang offline. Vui lòng kiểm tra ESP32.</p>
        </div>
      )}
    </div>
  );
}

export default IotDashboard;