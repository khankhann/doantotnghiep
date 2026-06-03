import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { toast } from "sonner";
import { 
  IoScanOutline, 
  IoPricetagOutline,
  IoHardwareChipOutline,
  IoWifiOutline,
  IoPersonOutline,
  IoMailOutline
} from "react-icons/io5";

function SearchProductRFID() {
  const [scanResult, setScanResult] = useState(null);
  const [lastScannedCode, setLastScannedCode] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  
  const currentScannedRef = useRef(""); 

  useEffect(() => {
    let intervalId;

    const checkLatestRFID = async () => {
      try {
        const token = localStorage.getItem("userToken");
        const { data } = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/iot/rfid/latest`, 
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (data && data.rfidTag && data.rfidTag !== currentScannedRef.current) {
            
            setLastScannedCode(data.rfidTag);
            currentScannedRef.current = data.rfidTag; 
            
            // Lấy data bất kể Backend trả về tên biến là gì (userData, productData, resultData)
            const resultData = data.userData || data.productData || data.resultData;

            if (resultData) {
                setScanResult(resultData); 
                setErrorMessage("");
                toast.success("Quét thẻ thành công!");
            } else {
                setScanResult(null);
                setErrorMessage(data.error || "Thẻ này chưa được đăng ký trong hệ thống!");
                toast.error("Thẻ trống hoặc chưa được gán!");
            }
        }
      } catch (error) {
        console.error("Lỗi khi lắng nghe RFID:", error);
      }
    };

    intervalId = setInterval(checkLatestRFID, 1500);
    return () => clearInterval(intervalId);
  }, []);

  const handleClearScreen = async () => {
      setLastScannedCode("");
      setScanResult(null);
      setErrorMessage("");
      currentScannedRef.current = "";
      
      try {
          const token = localStorage.getItem("userToken");
          await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/api/iot/rfid/clear`, {
              headers: { Authorization: `Bearer ${token}` }
          });
          toast.success("Đã dọn dẹp màn hình.");
      } catch(err) {
          console.log(err);
      }
  };

  // KIỂM TRA XEM DATA TRẢ VỀ LÀ USER HAY PRODUCT
  const isUser = scanResult && scanResult.email !== undefined;

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
      <div className="mb-8 flex justify-between items-end">
        <div>
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Hệ thống RFID Real-time</h2>
            <p className="text-gray-500 text-sm mt-1 flex items-center gap-2">
                <IoWifiOutline className="text-green-500 animate-pulse" size={18} />
                Đang lắng nghe dữ liệu từ máy quét ESP32...
            </p>
        </div>
        <button 
            onClick={handleClearScreen}
            className="px-4 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition"
        >
            Làm mới màn hình
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* CỘT TRÁI: MÁY QUÉT */}
        <div className="w-full lg:w-1/3">
          <div className="bg-blue-600 p-10 rounded-3xl text-center relative overflow-hidden shadow-xl sticky top-8 min-h-[350px] flex flex-col justify-center">
             <div className="absolute top-0 left-0 w-full h-full opacity-10" style={{ backgroundImage: 'radial-gradient(circle at center, white 2px, transparent 2px)', backgroundSize: '20px 20px' }}></div>
             <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6 text-white animate-pulse shadow-lg">
                <IoScanOutline size={48} />
             </div>
             <h2 className="text-2xl font-bold text-white mb-3">Sẵn Sàng Quét</h2>
             <p className="text-blue-100 text-sm px-2">Đưa thẻ vào đầu đọc RC522, dữ liệu sẽ tự động đẩy lên màn hình này.</p>
          </div>
        </div>

        {/* CỘT PHẢI: KẾT QUẢ */}
        <div className="w-full lg:w-2/3 bg-white rounded-3xl shadow-sm border border-gray-100 p-8 md:p-12 min-h-[500px] flex flex-col justify-center relative">
            
            {lastScannedCode && (
                <div className="absolute top-6 right-6 bg-gray-100 border border-gray-200 px-4 py-2 rounded-xl flex items-center gap-2 shadow-sm">
                    <IoHardwareChipOutline className="text-gray-500" size={20} />
                    <span className="text-sm text-gray-500 font-medium">UID Thẻ:</span>
                    <span className="text-base font-mono font-bold text-blue-600 tracking-widest">{lastScannedCode}</span>
                </div>
            )}
            
            {/* TRƯỜNG HỢP CHƯA QUÉT HOẶC LỖI */}
            {!scanResult && (
               <div className="text-center text-gray-400">
                  <IoPricetagOutline size={80} className="mx-auto mb-4 opacity-20" />
                  {errorMessage ? (
                     <>
                        <p className="text-xl font-bold text-red-500 mt-4">Không tìm thấy dữ liệu</p>
                        <p className="text-sm mt-2 text-gray-600">{errorMessage}</p>
                     </>
                  ) : (
                     <p className="text-lg font-medium mt-4">Kết quả sẽ hiển thị tự động ở đây</p>
                  )}
               </div>
            )}

            {/* TRƯỜNG HỢP LÀ KHÁCH HÀNG (USER) */}
            {scanResult && isUser && (
              <div className="flex flex-col items-center justify-center h-full animate-fade-in-up">
                 <div className="w-full max-w-md bg-gray-50 rounded-3xl p-8 border border-gray-100 text-center shadow-sm">
                    <div className="w-24 h-24 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center text-4xl font-black mx-auto mb-6 shadow-inner">
                        {scanResult.name ? scanResult.name.charAt(0).toUpperCase() : <IoPersonOutline />}
                    </div>
                    
                    <h3 className="text-3xl font-extrabold text-gray-900 mb-2">{scanResult.name}</h3>
                    
                    <div className="flex items-center justify-center gap-2 text-gray-500 mb-6">
                        <IoMailOutline size={18} />
                        <span className="font-medium">{scanResult.email}</span>
                    </div>

                    <div className="inline-block px-6 py-2 rounded-full font-bold tracking-widest uppercase text-sm
                        ${scanResult.isAdmin || scanResult.role === 'admin' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}">
                        {scanResult.isAdmin || scanResult.role === 'admin' ? 'QUẢN TRỊ VIÊN' : 'CUSTOMER'}
                    </div>
                 </div>
              </div>
            )}

            {/* TRƯỜNG HỢP LÀ SẢN PHẨM (PRODUCT) */}
            {scanResult && !isUser && (
              <div className="flex flex-col h-full animate-fade-in-up mt-8">
                 <div className="flex gap-6 mb-8 items-start">
                    <img src={scanResult.images?.[0]?.url || 'https://via.placeholder.com/150'} alt="product" className="w-48 h-48 object-cover rounded-2xl border shadow-md bg-white"/>
                    <div className="flex-1 mt-2">
                       <span className="text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg uppercase tracking-wider">{scanResult.category || "Sản phẩm"}</span>
                       <h3 className="text-4xl font-extrabold text-gray-900 mt-4 leading-tight">{scanResult.name}</h3>
                       <p className="text-lg font-mono text-gray-500 mt-3 bg-gray-100 inline-block px-3 py-1 rounded-md">SKU: {scanResult.sku || 'N/A'}</p>
                    </div>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-6 mt-auto">
                    <div className="bg-gray-50 p-6 rounded-2xl border">
                       <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-2">Giá bán</p>
                       <p className="text-4xl font-black">{new Intl.NumberFormat('vi-VN').format(scanResult.price || 0)} ₫</p>
                    </div>
                    <div className="bg-gray-50 p-6 rounded-2xl border">
                       <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-2">Tồn kho</p>
                       <p className={`text-4xl font-black ${scanResult.countInStock > 0 ? 'text-green-600' : 'text-red-500'}`}>
                         {scanResult.countInStock || 0} cái
                       </p>
                    </div>
                 </div>
              </div>
            )}
            
        </div>
      </div>
    </div>
  );
}

export default SearchProductRFID;