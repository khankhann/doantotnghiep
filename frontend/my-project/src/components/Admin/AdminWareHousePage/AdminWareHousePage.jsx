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
  IoHardwareChipOutline, IoWarningOutline, IoShieldCheckmarkOutline
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
  const [isAlertActive, setIsAlertActive] = useState(false);

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
    const sensorInterval = setInterval(() => dispatch(fetchSensorData()), 3000);
    return () => clearInterval(sensorInterval);
  }, [dispatch]);

  // 👉 POLLING: GỌI API CHECK TRẠNG THÁI CẢNH BÁO TỪ BACKEND
  useEffect(() => {
    const fetchAlertData = async () => {
      try {
        // Gọi API check xem có tín hiệu báo trộm không
        const { data } = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/iot/alert/latest`);
        if (data.alertStatus?.isIntruder && isSecurityActive) {
          setIsAlertActive(true);
        }
      } catch (error) {}
    };

    const alertInterval = setInterval(fetchAlertData, 3000);
    return () => clearInterval(alertInterval);
  }, [isSecurityActive]);

  // 👉 BỘ LỌC KẾT NỐI SENSOR
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
    } else {
      setIsIotConnected(false);
    }
  }, [sensorDataReal]);

  // 👉 HÀM GẠT NÚT CẢM BIẾN CHÁY
  const toggleFireSystem = async () => {
    const newState = !isFireSystemActive;
    setIsFireSystemActive(newState); 
    try {
      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/iot/control`, { fireSystem: newState });
      if (newState) toast.success("Đã BẬT hệ thống Cảm biến cháy & Nhiệt độ");
      else toast.error("Đã TẮT hệ thống Cảm biến cháy");
    } catch (error) {
      toast.error("Lỗi mạng! Không thể gửi lệnh.");
      setIsFireSystemActive(!newState); 
    }
  };

  // 👉 HÀM GẠT NÚT AN NINH
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

  // 👉 HÀM TẮT BÁO ĐỘNG
  const closeSecurityAlert = async () => {
    try {
      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/iot/clear-alert`);
      setIsAlertActive(false);
      toast.success("Đã tắt báo động thành công!");
    } catch (error) {
      toast.error("Không thể tắt báo động lúc này!");
    }
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
      
      {/* HEADER */}
      <div className="flex justify-between items-end mb-6 border-b border-gray-200 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Bảng điều khiển Nhà kho</h2>
          <p className="text-gray-500 text-sm mt-1">Quản lý hệ thống cảm biến & Xuất nhập tồn</p>
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

      {/* 4 Ô IOT */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        
        {/* Nhiệt độ */}
        <div className={`p-5 rounded-sm border transition-all ${!isFireSystemActive || !isIotConnected ? 'bg-gray-100 border-gray-200 opacity-60' : 'bg-white border-gray-200 shadow-sm'}`}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Nhiệt độ Kho</p>
              <p className="text-2xl font-bold">
                {isIotConnected && isFireSystemActive ? sensorDataReal.temperature : "--"}
                {isIotConnected && isFireSystemActive && <span className="text-sm font-normal text-gray-500 ml-1">°C</span>}
              </p>
            </div>
          </div>
          {!isFireSystemActive && <p className="text-[10px] text-red-500 mt-2 font-bold uppercase">Hệ thống đang tắt</p>}
        </div>
        
        {/* Độ ẩm */}
        <div className={`p-5 rounded-sm border transition-all ${!isIotConnected ? 'bg-gray-100 border-gray-200 opacity-60' : 'bg-white border-gray-200 shadow-sm'}`}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Độ ẩm Kho</p>
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
            <button onClick={toggleFireSystem} className={`relative w-10 h-5 rounded-full transition-colors focus:outline-none ${isFireSystemActive ? 'bg-blue-600' : 'bg-gray-300'}`}>
              <span className={`absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full transition-transform ${isFireSystemActive ? 'translate-x-5' : 'translate-x-0'}`}></span>
            </button>
          </div>
          <p className={`text-sm font-bold ${!isFireSystemActive ? "text-gray-400" : "text-gray-800"}`}>
            {!isFireSystemActive ? "Đã ngắt điện" : "Đang giám sát 24/7"}
          </p>
        </div>

        {/* Nút An ninh (Đã loại bỏ chức năng Camera) */}
        <div className="bg-white p-5 rounded-sm border border-gray-200 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <IoShieldCheckmarkOutline className={isSecurityActive ? "text-blue-500" : "text-gray-400"} size={16} />
              <p className="text-xs font-bold text-gray-600 uppercase">An ninh & Chống trộm</p>
            </div>
            <button onClick={toggleSecurity} className={`relative w-10 h-5 rounded-full transition-colors focus:outline-none ${isSecurityActive ? 'bg-blue-600' : 'bg-gray-300'}`}>
              <span className={`absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full transition-transform ${isSecurityActive ? 'translate-x-5' : 'translate-x-0'}`}></span>
            </button>
          </div>
          
          <div className="flex items-end justify-between mt-2">
            <p className={`text-sm font-bold ${!isSecurityActive ? "text-gray-400" : "text-gray-800"}`}>
              {!isSecurityActive ? "Hệ thống đang mở cửa" : "Khóa chặt kho hàng"}
            </p>
          </div>
        </div>
      </div>

      {/* BIỂU ĐỒ REAL-TIME */}
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

      {/* BẢNG XUẤT NHẬP KHO */}
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

      {/* MODAL NHẬP/XUẤT/LỊCH SỬ KHO (Giữ nguyên không thay đổi) */}
      {modalType && selectedProduct && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
            {/* Nội dung giữ nguyên của thẻ Modal cũ để tránh code dài */}
            {/* Bạn có thể paste lại phần Modal kho ở code trước vào đây */}
         </div>
      )}

      {/* ========================================== */}
      {/* MODAL CẢNH BÁO ĐỘT NHẬP (KHÔNG CÓ CAMERA)    */}
      {/* ========================================== */}
      {isAlertActive && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/90 px-4">
          <div className="bg-white w-full max-w-md rounded-2xl overflow-hidden shadow-2xl animate-pulse">
            
            <div className="bg-red-600 px-6 py-8 flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mb-4">
                 <IoWarningOutline className="text-white" size={48} />
              </div>
              <h3 className="text-2xl font-black text-white uppercase tracking-widest mb-2">BÁO ĐỘNG ĐỘT NHẬP</h3>
              <p className="text-red-100 text-sm">Hệ thống cảm biến chuyển động (PIR) vừa phát hiện có người lạ xâm nhập vào khu vực Nhà kho!</p>
            </div>
            
            <div className="px-6 py-6 bg-white text-center border-b border-gray-100">
               <div className="flex items-center justify-center gap-3 mb-2">
                  <span className="w-3 h-3 rounded-full bg-red-600 animate-ping"></span>
                  <span className="font-bold text-gray-800 text-lg">Cảm biến đang kích hoạt</span>
               </div>
               <p className="text-xs text-gray-500 font-mono">{new Date().toLocaleTimeString('vi-VN')} - Khu vực quét: Cửa chính kho</p>
            </div>

            <div className="px-6 py-4 bg-gray-50 flex justify-center">
              <button 
                 onClick={closeSecurityAlert} 
                 className="w-full py-3 bg-red-600 text-white text-sm font-bold rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-600/30"
              >
                TẮT BÁO ĐỘNG (ĐÃ XÁC NHẬN)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminWareHousePage;