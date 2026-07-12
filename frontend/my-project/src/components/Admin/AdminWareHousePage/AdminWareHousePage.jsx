import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { fetchAdminProducts, updateProduct } from "@redux/slices/adminProductSlice";
import { fetchSensorData } from "@redux/slices/iotSensorSlice";
import { toast } from "sonner";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  IoArrowDownOutline, IoArrowUpOutline, IoCloseOutline,
  IoSearchOutline, IoTimeOutline, IoPersonOutline,
  IoHardwareChipOutline, IoWarningOutline
} from "react-icons/io5";

function AdminWareHousePage() {
  const dispatch = useDispatch();
  const { products, loading } = useSelector((state) => state.adminProducts);
  const { userInfo } = useSelector((state) => state.auth || state.user || {});

  // ==========================================
  // 1. STATE IOT & ĐIỀU KHIỂN THIẾT BỊ
  // ==========================================
  const { data: sensorDataReal } = useSelector((state) => state.iotSensor);
  const [isIotConnected, setIsIotConnected] = useState(false);
  const [iotHistory, setIotHistory] = useState([]);

  // State Nút gạt điều khiển
  const [isFireSystemActive, setIsFireSystemActive] = useState(true);
  const [isSecurityActive, setIsSecurityActive] = useState(true);
  const [intruderImage, setIntruderImage] = useState(null);

  // 👉 FETCH DATA & ĐỒNG BỘ NÚT BẤM KHI VỪA VÀO TRANG
  useEffect(() => {
    dispatch(fetchAdminProducts());
    
    // Hỏi Backend xem nút đang bật hay tắt để đồng bộ
    const fetchControlState = async () => {
      try {
        const { data } = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/iot/control`);
        if (data) {
          setIsFireSystemActive(data.fireSystem);
          setIsSecurityActive(data.securitySystem);
        }
      } catch (error) {
        console.log("Lấy trạng thái điều khiển thất bại");
      }
    };
    fetchControlState();

    // Gọi API lấy nhiệt độ mỗi 3 giây
    const interval = setInterval(() => dispatch(fetchSensorData()), 3000);
    return () => clearInterval(interval);
  }, [dispatch]);

  // 👉 BỘ LỌC KẾT NỐI: CHỈ VẼ BIỂU ĐỒ KHI ESP32 GỬI DATA THẬT
  useEffect(() => {
    if (sensorDataReal && sensorDataReal.temperature > 0) {
      setIsIotConnected(true);
      setIotHistory(prev => {
        const newHistory = [...prev, {
          time: new Date().toLocaleTimeString('vi-VN'),
          temp: sensorDataReal.temperature,
          hum: sensorDataReal.humidity
        }];
        return newHistory.length > 15 ? newHistory.slice(1) : newHistory;
      });
      
      // Kích hoạt báo động có trộm nếu ESP32 gửi cờ báo
      if (sensorDataReal.securityAlarm && isSecurityActive) {
        triggerCameraMock();
      }
    } else {
      setIsIotConnected(false);
    }
  }, [sensorDataReal, isSecurityActive]);

  // 👉 HÀM GẠT NÚT CẢM BIẾN CHÁY (Bắn API POST)
  const toggleFireSystem = async () => {
    const newState = !isFireSystemActive;
    setIsFireSystemActive(newState); // Cập nhật UI ngay lập tức cho mượt
    try {
      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/iot/control`, { fireSystem: newState });
      if (newState) toast.success("Đã BẬT hệ thống Cảm biến cháy & Nhiệt độ");
      else toast.error("Đã TẮT hệ thống Cảm biến cháy");
    } catch (error) {
      toast.error("Lỗi mạng! Không thể gửi lệnh.");
      setIsFireSystemActive(!newState); // Lỗi thì gạt trả lại
    }
  };

  // 👉 HÀM GẠT NÚT AN NINH (Bắn API POST)
  const toggleSecurity = async () => {
    const newState = !isSecurityActive;
    setIsSecurityActive(newState);
    try {
      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/iot/control`, { securitySystem: newState });
      if (newState) toast.success("Đã KÍCH HOẠT hệ thống An ninh chống trộm");
      else toast.warning("Hệ thống An ninh đã BỊ VÔ HIỆU HÓA");
    } catch (error) {
      toast.error("Lỗi mạng! Không thể gửi lệnh.");
      setIsSecurityActive(!newState);
    }
  };

  // Hàm hiển thị hình ảnh camera báo động
  const triggerCameraMock = () => {
    setIntruderImage("https://images.unsplash.com/photo-1541535881962-3bb380b08458?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80");
  };

  const closeSecurityAlert = () => {
    setIntruderImage(null);
  };


  // ==========================================
  // 2. STATE KHO & MODAL QUẢN LÝ TỒN KHO
  // ==========================================
  const [searchTerm, setSearchTerm] = useState("");
  const [modalType, setModalType] = useState(null); 
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [tempStockChanges, setTempStockChanges] = useState({});

  const filteredProducts = products?.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase()))
  ) || [];

  const openModal = (product, type) => {
    setSelectedProduct(product);
    setModalType(type);
    setTempStockChanges({});
  };

  const closeModal = () => {
    setSelectedProduct(null);
    setModalType(null);
    setTempStockChanges({});
  };

  const handleStockChange = (variantName, value) => {
    const numValue = parseInt(value) || 0;
    setTempStockChanges(prev => ({ ...prev, [variantName]: numValue }));
  };

  const handleSubmitStock = async () => {
    if (!selectedProduct) return;
    let totalChanged = 0;
    const changeDetails = [];
    
    const updatedVariants = selectedProduct.variants.map(variant => {
      const changeAmount = tempStockChanges[variant.variantName] || 0;
      let newStock = variant.stock;
      if (changeAmount > 0) {
        totalChanged += changeAmount;
        changeDetails.push(`${variant.variantName}: ${changeAmount}`);
      }
      if (modalType === 'IMPORT') newStock += changeAmount;
      else if (modalType === 'EXPORT') newStock = Math.max(0, newStock - changeAmount);
      return { ...variant, stock: newStock };
    });

    const newTotalStock = updatedVariants.reduce((sum, v) => sum + v.stock, 0);
    const newHistoryEntry = {
      action: modalType, 
      amount: totalChanged,
      note: changeDetails.join(", ") || "Điều chỉnh hệ thống",
      userName: userInfo?.name || "Admin",
      date: new Date().toISOString()
    };

    try {
      await dispatch(updateProduct({ 
        id: selectedProduct._id, 
        productData: { variants: updatedVariants, countInStock: newTotalStock, newHistoryEntry } 
      })).unwrap();
      toast.success(`${modalType === 'IMPORT' ? 'Nhập' : 'Xuất'} kho thành công!`);
      closeModal(); 
      dispatch(fetchAdminProducts());
    } catch (error) {
      toast.error("Lỗi cập nhật tồn kho!");
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen font-sans text-gray-800">
      
      {/* HEADER TỐI GIẢN */}
      <div className="flex justify-between items-end mb-6 border-b border-gray-200 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Bảng điều khiển Nhà kho</h2>
          <p className="text-gray-500 text-sm mt-1">Quản lý phần cứng IoT và Xuất nhập tồn</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold uppercase text-gray-400">Kết nối phần cứng</p>
          {isIotConnected ? (
            <p className="text-sm font-bold text-green-600 flex items-center justify-end gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> ONLINE
            </p>
          ) : (
            <p className="text-sm font-bold text-red-500 flex items-center justify-end gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-red-500"></span> OFFLINE
            </p>
          )}
        </div>
      </div>

      {/* 4 Ô IOT VỚI NÚT ĐIỀU KHIỂN (STYLE FLATTEN) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        
        {/* Nhiệt độ */}
        <div className={`p-5 rounded-sm border transition-all ${!isFireSystemActive || !isIotConnected ? 'bg-gray-100 border-gray-200 opacity-60' : 'bg-white border-gray-200 shadow-sm'}`}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Nhiệt độ</p>
              <p className="text-2xl font-bold">
                {isIotConnected && isFireSystemActive ? sensorDataReal.temperature : "--"}
                {isIotConnected && isFireSystemActive && <span className="text-sm font-normal text-gray-500 ml-1">°C</span>}
              </p>
            </div>
          </div>
          {!isFireSystemActive && <p className="text-[10px] text-red-500 mt-2 font-bold uppercase">Bị ngắt bởi công tắc</p>}
        </div>
        
        {/* Độ ẩm */}
        <div className={`p-5 rounded-sm border transition-all ${!isIotConnected ? 'bg-gray-100 border-gray-200 opacity-60' : 'bg-white border-gray-200 shadow-sm'}`}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Độ ẩm</p>
              <p className="text-2xl font-bold">
                {isIotConnected ? sensorDataReal.humidity : "--"}
                {isIotConnected && <span className="text-sm font-normal text-gray-500 ml-1">%</span>}
              </p>
            </div>
          </div>
        </div>

        {/* Nút Báo cháy */}
        <div className="bg-white p-5 rounded-sm border border-gray-200 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <IoHardwareChipOutline className={isFireSystemActive ? "text-red-500" : "text-gray-400"} size={16} />
              <p className="text-xs font-bold text-gray-600 uppercase">Cảm biến Cháy</p>
            </div>
            {/* Toggle Button Clean UI */}
            <button onClick={toggleFireSystem} className={`relative w-10 h-5 rounded-full transition-colors focus:outline-none ${isFireSystemActive ? 'bg-blue-600' : 'bg-gray-300'}`}>
              <span className={`absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full transition-transform ${isFireSystemActive ? 'translate-x-5' : 'translate-x-0'}`}></span>
            </button>
          </div>
          <p className={`text-sm font-bold ${!isFireSystemActive ? "text-gray-400" : "text-gray-800"}`}>
            {!isFireSystemActive ? "Đã ngắt điện" : "Đang giám sát"}
          </p>
        </div>

        {/* Nút An ninh */}
        <div className="bg-white p-5 rounded-sm border border-gray-200 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <IoHardwareChipOutline className={isSecurityActive ? "text-blue-500" : "text-gray-400"} size={16} />
              <p className="text-xs font-bold text-gray-600 uppercase">Hệ thống An ninh</p>
            </div>
            <button onClick={toggleSecurity} className={`relative w-10 h-5 rounded-full transition-colors focus:outline-none ${isSecurityActive ? 'bg-blue-600' : 'bg-gray-300'}`}>
              <span className={`absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full transition-transform ${isSecurityActive ? 'translate-x-5' : 'translate-x-0'}`}></span>
            </button>
          </div>
          <div className="flex items-end justify-between">
            <p className={`text-sm font-bold ${!isSecurityActive ? "text-gray-400" : "text-gray-800"}`}>
              {!isSecurityActive ? "Vô hiệu hóa" : "Khóa chặt"}
            </p>
            {/* Nút Test Camera */}
            <button onClick={triggerCameraMock} disabled={!isSecurityActive} className="text-[10px] bg-red-50 text-red-600 border border-red-200 font-bold px-2 py-1 rounded-sm disabled:opacity-50">
              Test CAM
            </button>
          </div>
        </div>
      </div>

      {/* BIỂU ĐỒ REAL-TIME CHUẨN ERP */}
      <div className="bg-white p-6 rounded-sm shadow-sm border border-gray-200 mb-8">
        <h3 className="font-bold text-gray-800 text-sm mb-4">BIỂU ĐỒ MÔI TRƯỜNG {isIotConnected ? "" : "(OFFLINE)"}</h3>
        <div className="h-[220px] w-full">
          {isIotConnected && iotHistory.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={iotHistory} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="time" hide />
                <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '4px', border: '1px solid #e5e7eb' }} />
                <Line type="monotone" dataKey="temp" name="Nhiệt độ" stroke="#ef4444" strokeWidth={2} dot={false} isAnimationActive={false} />
                <Line type="monotone" dataKey="hum" name="Độ ẩm" stroke="#3b82f6" strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
             <div className="w-full h-full flex items-center justify-center border-2 border-dashed border-gray-200 text-gray-400 text-sm font-medium">
                Chưa nhận tín hiệu cảm biến
             </div>
          )}
        </div>
      </div>

      {/* BẢNG XUẤT NHẬP KHO CHUYÊN NGHIỆP */}
      <div className="bg-white rounded-sm shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50">
          <h3 className="font-bold text-gray-800 text-sm">QUẢN LÝ TỒN KHO</h3>
          <div className="relative w-full sm:w-72">
            <input 
              type="text" placeholder="Tìm tên hoặc SKU..." 
              className="w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded-sm outline-none focus:border-blue-500 text-xs"
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            />
            <IoSearchOutline className="absolute left-2.5 top-2 text-gray-400" size={14} />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 text-gray-500 border-b border-gray-200 text-[10px] uppercase">
              <tr>
                <th className="px-6 py-3 font-bold">Sản phẩm</th>
                <th className="px-6 py-3 font-bold text-center">Tồn kho</th>
                <th className="px-6 py-3 font-bold text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredProducts.map((product) => (
                <tr key={product._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      <img src={product.images?.[0]?.url} className="w-10 h-10 rounded-sm object-cover border border-gray-200" />
                      <div>
                        <p className="font-bold text-gray-800 truncate max-w-[250px] text-xs">{product.name}</p>
                        <p className="text-[10px] text-gray-500 font-mono mt-0.5">SKU: {product.sku || "N/A"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-3 text-center">
                    <span className={`px-2 py-1 rounded-sm font-bold text-xs ${product.countInStock > 0 ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                      {product.countInStock || 0}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => openModal(product, 'IMPORT')} className="flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-300 text-gray-700 font-bold rounded-sm hover:bg-gray-50 text-xs">
                        <IoArrowDownOutline /> Nhập
                      </button>
                      <button onClick={() => openModal(product, 'EXPORT')} className="flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-300 text-gray-700 font-bold rounded-sm hover:bg-gray-50 text-xs">
                        <IoArrowUpOutline /> Xuất
                      </button>
                      <button onClick={() => openModal(product, 'HISTORY')} className="flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-300 text-gray-700 font-bold rounded-sm hover:bg-gray-50 text-xs">
                        <IoTimeOutline /> Lịch sử
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================== */}
      {/* MODAL NHẬP/XUẤT/LỊCH SỬ KHO (Giao diện phẳng) */}
      {/* ========================================== */}
      {modalType && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="absolute inset-0" onClick={closeModal}></div>
          <div className="relative bg-white w-full max-w-lg rounded-sm shadow-xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
              <h3 className="text-sm font-bold text-gray-800 uppercase">
                {modalType === 'IMPORT' ? 'Phiếu Nhập kho' : modalType === 'EXPORT' ? 'Phiếu Xuất kho' : 'Lịch sử Giao dịch'}
              </h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-800"><IoCloseOutline size={20} /></button>
            </div>

            <div className="p-6">
              <div className="flex gap-4 mb-4 pb-4 border-b border-gray-100">
                <img src={selectedProduct.images?.[0]?.url} className="w-12 h-12 rounded-sm object-cover border border-gray-200" />
                <div>
                  <h4 className="font-bold text-gray-800 text-sm mb-1">{selectedProduct.name}</h4>
                  <p className="text-xs text-gray-500">Tồn kho hiện tại: <span className="font-bold text-gray-900">{selectedProduct.countInStock}</span></p>
                </div>
              </div>

              {(modalType === 'IMPORT' || modalType === 'EXPORT') && (
                <div className="space-y-2 max-h-[40vh] overflow-y-auto">
                  <p className="text-[10px] font-bold text-gray-500 uppercase mb-2">Tùy chỉnh số lượng</p>
                  {selectedProduct.variants?.length > 0 ? (
                    selectedProduct.variants.map((v, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 border border-gray-200 rounded-sm bg-gray-50">
                        <div>
                          <p className="font-bold text-gray-800 text-xs">{v.variantName}</p>
                          <p className="text-[10px] text-gray-500">Đang có: {v.stock}</p>
                        </div>
                        <input 
                          type="number" min="0" placeholder="0"
                          className="w-16 p-1 bg-white border border-gray-300 rounded-sm text-center text-xs outline-none focus:border-blue-500"
                          value={tempStockChanges[v.variantName] || ""}
                          onChange={(e) => handleStockChange(v.variantName, e.target.value)}
                        />
                      </div>
                    ))
                  ) : <p className="text-xs text-red-500">Sản phẩm chưa cấu hình phân loại</p>}
                </div>
              )}

              {modalType === 'HISTORY' && (
                <div className="max-h-[40vh] overflow-y-auto space-y-3">
                  {selectedProduct.stockHistory?.length > 0 ? (
                    selectedProduct.stockHistory.slice().reverse().map((history, idx) => (
                      <div key={idx} className="p-3 border border-gray-200 rounded-sm text-sm">
                        <div className="flex justify-between items-center mb-1">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm uppercase ${history.action === 'IMPORT' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                            {history.action === 'IMPORT' ? 'NHẬP' : 'XUẤT'}
                          </span>
                          <span className="text-[10px] text-gray-500">{new Date(history.date).toLocaleString("vi-VN")}</span>
                        </div>
                        <p className="text-xs text-gray-700 font-medium my-1">{history.note}</p>
                        <div className="flex justify-between text-[10px] text-gray-500 border-t border-gray-100 pt-1 mt-1">
                          <span className="flex items-center gap-1"><IoPersonOutline/> {history.userName}</span>
                          <span className={`font-bold ${history.action === 'IMPORT' ? 'text-blue-600' : 'text-orange-600'}`}>
                            {history.action === 'IMPORT' ? '+' : '-'}{history.amount}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : <p className="text-xs text-center text-gray-400 py-4">Chưa có lịch sử giao dịch</p>}
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-2">
              <button onClick={closeModal} className="px-4 py-2 text-xs text-gray-700 font-bold bg-white border border-gray-300 rounded-sm hover:bg-gray-100">Đóng</button>
              {modalType !== 'HISTORY' && (
                <button 
                  onClick={handleSubmitStock} disabled={Object.keys(tempStockChanges).length === 0}
                  className="px-4 py-2 text-xs text-white font-bold bg-blue-600 rounded-sm hover:bg-blue-700 disabled:opacity-50"
                >
                  Xác nhận lưu
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL CẢNH BÁO ĐỘT NHẬP (CCTV STYLE) */}
      {/* ========================================== */}
      {intruderImage && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/90">
          <div className="bg-black border border-red-500 w-full max-w-2xl rounded-sm">
            <div className="bg-red-600 px-4 py-2 flex items-center gap-2">
              <IoWarningOutline className="text-white" size={20} />
              <h3 className="text-sm font-bold text-white uppercase tracking-widest">CẢNH BÁO ĐỘT NHẬP KHO HÀNG</h3>
            </div>
            <div className="p-4 relative">
              <p className="text-red-400 font-mono text-xs mb-2">LIVE CAM_01 - {new Date().toLocaleTimeString()}</p>
              <div className="relative border border-red-500/50">
                <img src={intruderImage} className="w-full h-auto object-cover grayscale brightness-110 contrast-125" />
                <div className="absolute top-2 right-2 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                  <span className="text-red-500 font-mono font-bold text-[10px]">REC</span>
                </div>
              </div>
            </div>
            <div className="px-4 py-3 bg-gray-900 border-t border-gray-800 flex justify-end">
              <button onClick={closeSecurityAlert} className="px-4 py-2 bg-gray-700 text-white text-xs font-bold rounded-sm hover:bg-gray-600">ĐÃ XỬ LÝ (TẮT BÁO ĐỘNG)</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminWareHousePage;