import { useState, useEffect } from "react";
// Nếu dùng Socket.io thì import vào đây để hứng data real-time
// import io from "socket.io-client";

function AdminWareHousePage () {
  // State giả lập dữ liệu từ cảm biến gửi lên
  const [sensorData, setSensorData] = useState({
    temperature: 28.5,
    humidity: 65,
    fireAlarm: false, // false là an toàn, true là CÓ CHÁY
    securityAlarm: false, // false là an toàn, true là CÓ TRỘM
    lastUpdated: new Date().toLocaleTimeString(),
  });

  // Chỗ này sau này fen móc Socket.io hoặc gọi API setInterval vào để update data liên tục
  useEffect(() => {
    /* Mẫu logic Socket.io sau này fen ráp vào:
    const socket = io("http://localhost:9000");
    socket.on("sensor_update", (data) => {
      setSensorData(data);
    });
    return () => socket.disconnect();
    */
  }, []);

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 min-h-screen">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Giám sát Kho hàng (IoT)</h2>
          <p className="text-gray-500 text-sm mt-1">Cập nhật dữ liệu thời gian thực từ hệ thống cảm biến.</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Cập nhật lần cuối</p>
          <p className="text-sm font-bold text-green-600 flex items-center justify-end gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            {sensorData.lastUpdated}
          </p>
        </div>
      </div>

      {/* LƯỚI THỐNG KÊ 4 Ô */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        
        {/* 1. Ô NHIỆT ĐỘ */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-orange-100 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-orange-50 rounded-bl-full -z-10 group-hover:scale-110 transition-transform"></div>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
            </div>
            <h3 className="font-bold text-gray-700">Nhiệt độ</h3>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-extrabold text-gray-900">{sensorData.temperature}</span>
            <span className="text-xl font-bold text-orange-500 mb-1">°C</span>
          </div>
          <p className="text-xs text-gray-500 mt-2 font-medium">Mức lý tưởng: 20 - 30°C</p>
        </div>

        {/* 2. Ô ĐỘ ẨM */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-blue-100 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -z-10 group-hover:scale-110 transition-transform"></div>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"></path></svg>
            </div>
            <h3 className="font-bold text-gray-700">Độ ẩm</h3>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-extrabold text-gray-900">{sensorData.humidity}</span>
            <span className="text-xl font-bold text-blue-500 mb-1">%</span>
          </div>
          <p className="text-xs text-gray-500 mt-2 font-medium">Mức lý tưởng: 40 - 60%</p>
        </div>

        {/* 3. BÁO CHÁY (CÓ HIỆU ỨNG NHÁY ĐỎ NẾU TRUE) */}
        <div className={`p-6 rounded-2xl shadow-sm border flex flex-col justify-between relative overflow-hidden transition-all duration-300 ${sensorData.fireAlarm ? "bg-red-500 border-red-600 animate-[pulse_1s_ease-in-out_infinite]" : "bg-white border-gray-200"}`}>
          <div className="flex items-center gap-4 mb-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${sensorData.fireAlarm ? "bg-red-400 text-white" : "bg-red-50 text-red-500"}`}>
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z"></path></svg>
            </div>
            <h3 className={`font-bold ${sensorData.fireAlarm ? "text-white" : "text-gray-700"}`}>Báo Cháy / Khói</h3>
          </div>
          <div>
            <span className={`text-2xl font-extrabold ${sensorData.fireAlarm ? "text-white" : "text-gray-900"}`}>
              {sensorData.fireAlarm ? "🔥 CẢNH BÁO CHÁY" : "An Toàn"}
            </span>
          </div>
          <p className={`text-xs mt-2 font-medium ${sensorData.fireAlarm ? "text-red-100" : "text-gray-500"}`}>
            {sensorData.fireAlarm ? "Kích hoạt bơm nước / Báo còi" : "Hệ thống cảm biến khói bình thường"}
          </p>
        </div>

        {/* 4. CHỐNG TRỘM / CẢM BIẾN CHUYỂN ĐỘNG */}
        <div className={`p-6 rounded-2xl shadow-sm border flex flex-col justify-between relative overflow-hidden transition-all duration-300 ${sensorData.securityAlarm ? "bg-red-500 border-red-600 animate-[pulse_1s_ease-in-out_infinite]" : "bg-white border-gray-200"}`}>
          <div className="flex items-center gap-4 mb-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${sensorData.securityAlarm ? "bg-red-400 text-white" : "bg-gray-100 text-gray-600"}`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
            </div>
            <h3 className={`font-bold ${sensorData.securityAlarm ? "text-white" : "text-gray-700"}`}>An Ninh Kho</h3>
          </div>
          <div>
            <span className={`text-2xl font-extrabold ${sensorData.securityAlarm ? "text-white" : "text-gray-900"}`}>
              {sensorData.securityAlarm ? "🚨 ĐỘT NHẬP" : "Khóa chặt"}
            </span>
          </div>
          <p className={`text-xs mt-2 font-medium ${sensorData.securityAlarm ? "text-red-100" : "text-gray-500"}`}>
            {sensorData.securityAlarm ? "Phát hiện chuyển động lạ!" : "Không có cảnh báo chuyển động"}
          </p>
        </div>

      </div>
      
      {/* KHU VỰC CHART HOẶC CAMERA SAU NÀY */}
      <div className="mt-8 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 min-h-[300px] flex items-center justify-center border-dashed">
         <p className="text-gray-400 font-bold">Khu vực hiển thị Biểu đồ Nhiệt độ hoặc Camera giám sát</p>
      </div>
    </div>
  );
}

export default AdminWareHousePage;