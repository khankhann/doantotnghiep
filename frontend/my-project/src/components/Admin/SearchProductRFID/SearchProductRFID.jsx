import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Html5QrcodeScanner } from "html5-qrcode";

import {
  IoScanOutline,
  IoPricetagOutline,
  IoHardwareChipOutline,
  IoWifiOutline,
  IoPersonOutline,
  IoMailOutline,
  IoQrCodeOutline,
  IoCameraOutline,
  IoCloseCircleOutline,
} from "react-icons/io5";

function SearchProductRFID() {
  const [scanResult, setScanResult] = useState(null);
  const [lastScannedCode, setLastScannedCode] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // 👉 STATE BẬT/TẮT CAMERA QR
  const [isScanningQR, setIsScanningQR] = useState(false);

  const currentScannedRef = useRef("");
  const scannerRef = useRef(null);

  // ==========================================
  // 1. LOGIC LẮNG NGHE RFID (CŨ)
  // ==========================================
  useEffect(() => {
    let intervalId;

    const checkLatestRFID = async () => {
      // Tạm dừng nghe RFID nếu đang bật camera để tiết kiệm tài nguyên
      if (isScanningQR) return;

      try {
        const token = localStorage.getItem("userToken");
        const { data } = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/iot/rfid/latest`,
          { headers: { Authorization: `Bearer ${token}` } },
        );

        if (
          data &&
          data.rfidTag &&
          data.rfidTag !== currentScannedRef.current
        ) {
          setLastScannedCode(data.rfidTag);
          currentScannedRef.current = data.rfidTag;

          const resultData =
            data.userData || data.productData || data.resultData;

          if (resultData) {
            setScanResult(resultData);
            setErrorMessage("");
            toast.success("Quét thẻ RFID thành công!");
          } else {
            setScanResult(null);
            setErrorMessage(
              data.error || "Thẻ này chưa được đăng ký trong hệ thống!",
            );
            toast.error("Thẻ trống hoặc chưa được gán!");
          }
        }
      } catch (error) {
        console.error("Lỗi khi lắng nghe RFID:", error);
      }
    };

    intervalId = setInterval(checkLatestRFID, 1500);
    return () => clearInterval(intervalId);
  }, [isScanningQR]);

  // ==========================================
  // 2. LOGIC QUÉT MÃ QR BẰNG CAMERA (ĐÃ FIX DELAY 200MS)
  // ==========================================
  useEffect(() => {
    if (isScanningQR) {
      // Ép hệ thống đợi 200ms để React chắc chắn đã vẽ xong cái <div id="qr-reader">
      const timer = setTimeout(() => {
        if (!scannerRef.current) {
          try {
            scannerRef.current = new Html5QrcodeScanner(
              "qr-reader",
              {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                rememberLastUsedCamera: true,
              },
              false,
            );

            scannerRef.current.render(
              async (decodedText) => {
                // Tắt camera khi quét xong
                if (scannerRef.current) {
                  scannerRef.current.clear().catch((e) => console.log(e));
                  scannerRef.current = null;
                }
                setIsScanningQR(false);

                // Lấy ID từ link và gọi API
                const parts = decodedText.split("/");
                const productId = parts[parts.length - 1];

                try {
                  const { data } = await axios.get(
                    `${import.meta.env.VITE_BACKEND_URL}/api/products/${productId}`,
                  );
                  setScanResult(data);
                  setLastScannedCode("QR: " + productId);
                  setErrorMessage("");
                  toast.success("Quét mã QR thành công!");
                } catch (err) {
                  setScanResult(null);
                  setErrorMessage(
                    "Mã QR không hợp lệ hoặc sản phẩm không tồn tại!",
                  );
                  toast.error("Quét QR thất bại!");
                }
              },
              (err) => {
                // Bỏ qua lỗi dò tìm
              },
            );
          } catch (error) {
            console.error("Lỗi khởi tạo thư viện QR:", error);
          }
        }
      }, 200);

      // Dọn dẹp timer nếu user đổi ý bấm tắt ngay
      return () => clearTimeout(timer);
    } else {
      // Khi đóng camera -> dọn dẹp sạch sẽ
      if (scannerRef.current) {
        scannerRef.current.clear().catch((e) => console.log(e));
        scannerRef.current = null;
      }
    }
  }, [isScanningQR]);

  // ==========================================
  // HÀM LÀM SẠCH MÀN HÌNH
  // ==========================================
  const handleClearScreen = async () => {
    setLastScannedCode("");
    setScanResult(null);
    setErrorMessage("");
    currentScannedRef.current = "";
    setIsScanningQR(false); // Tắt luôn camera nếu đang bật

    try {
      const token = localStorage.getItem("userToken");
      await axios.delete(
        `${import.meta.env.VITE_BACKEND_URL}/api/iot/rfid/clear`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      toast.success("Đã dọn dẹp màn hình.");
    } catch (err) {
      console.log(err);
    }
  };

  const isUser = scanResult && scanResult.email !== undefined;

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
      <div className="mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Hệ thống Quét Truy Xuất
          </h2>
          <p className="text-gray-500 text-sm mt-1 flex items-center gap-2">
            <IoWifiOutline className="text-green-500 animate-pulse" size={18} />
            Hỗ trợ cả thẻ phần cứng RFID và Camera quét QR
          </p>
        </div>
        <button
          onClick={handleClearScreen}
          className="px-4 py-2 bg-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-300 transition shadow-sm">
          Làm mới màn hình
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* ========================================== */}
        {/* CỘT TRÁI: BẢNG ĐIỀU KHIỂN MÁY QUÉT */}
        {/* ========================================== */}
        <div className="w-full lg:w-1/3">
          {/* NẾU ĐANG BẬT CAMERA QUÉT QR */}
          {isScanningQR ? (
            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-lg relative min-h-[350px]">
              <button
                onClick={() => setIsScanningQR(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-red-500 z-10 transition-colors"
                title="Tắt Camera">
                <IoCloseCircleOutline size={32} />
              </button>
              <h3 className="text-center font-bold text-gray-800 mb-4 flex justify-center items-center gap-2">
                <IoCameraOutline size={24} /> Camera Đang Bật
              </h3>

              {/* Khu vực vẽ Camera */}
              <div
                id="qr-reader"
                className="w-full overflow-hidden rounded-xl border-2 border-dashed border-blue-400"></div>
            </div>
          ) : (
            /* NẾU ĐANG CHỜ RFID (Mặc định) */
            <div className="bg-blue-600 p-8 rounded-3xl text-center relative overflow-hidden shadow-xl sticky top-8 flex flex-col justify-center transition-all duration-300">
              <div
                className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at center, white 2px, transparent 2px)",
                  backgroundSize: "20px 20px",
                }}></div>

              <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 text-white animate-pulse shadow-lg">
                <IoScanOutline size={48} />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Đợi thẻ RFID...
              </h2>
              <p className="text-blue-100 text-sm px-2 mb-8">
                Đưa thẻ vào đầu đọc phần cứng để quét tự động.
              </p>

              <div className="border-t border-blue-400/50 pt-6">
                <p className="text-blue-100 text-xs uppercase tracking-widest font-bold mb-3">
                  Hoặc quét mã trên bao bì
                </p>
                <button
                  onClick={() => {
                    console.log("Bật camera quét QR");
                    setIsScanningQR(true)}
                  }
                  className="w-full relative z-10 bg-white cursor-pointer text-blue-700 font-bold py-3 rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 shadow-md">
                  <IoQrCodeOutline size={20} /> Mở Camera Web
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ========================================== */}
        {/* CỘT PHẢI: HIỂN THỊ KẾT QUẢ */}
        {/* ========================================== */}
        <div className="w-full lg:w-2/3 bg-white rounded-3xl shadow-sm border border-gray-100 p-8 md:p-12 min-h-[500px] flex flex-col justify-center relative">
          {lastScannedCode && (
            <div className="absolute top-6 right-6 bg-gray-100 border border-gray-200 px-4 py-2 rounded-xl flex items-center gap-2 shadow-sm">
              <IoHardwareChipOutline className="text-gray-500" size={20} />
              <span className="text-sm text-gray-500 font-medium">
                Mã nhận diện:
              </span>
              <span className="text-base font-mono font-bold text-blue-600 tracking-widest">
                {lastScannedCode}
              </span>
            </div>
          )}

          {!scanResult && (
            <div className="text-center text-gray-400">
              <IoPricetagOutline
                size={80}
                className="mx-auto mb-4 opacity-20"
              />
              {errorMessage ? (
                <>
                  <p className="text-xl font-bold text-red-500 mt-4">
                    Không tìm thấy dữ liệu
                  </p>
                  <p className="text-sm mt-2 text-gray-600">{errorMessage}</p>
                </>
              ) : (
                <p className="text-lg font-medium mt-4">
                  Kết quả sẽ hiển thị tự động ở đây
                </p>
              )}
            </div>
          )}

          {scanResult && isUser && (
            <div className="flex flex-col items-center justify-center h-full animate-fade-in-up">
              <div className="w-full max-w-md bg-gray-50 rounded-3xl p-8 border border-gray-100 text-center shadow-sm">
                <div className="w-24 h-24 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center text-4xl font-black mx-auto mb-6 shadow-inner">
                  {scanResult.name ? (
                    scanResult.name.charAt(0).toUpperCase()
                  ) : (
                    <IoPersonOutline />
                  )}
                </div>

                <h3 className="text-3xl font-extrabold text-gray-900 mb-2">
                  {scanResult.name}
                </h3>

                <div className="flex items-center justify-center gap-2 text-gray-500 mb-6">
                  <IoMailOutline size={18} />
                  <span className="font-medium">{scanResult.email}</span>
                </div>

                <div
                  className={`inline-block px-6 py-2 rounded-full font-bold tracking-widest uppercase text-sm ${scanResult.isAdmin || scanResult.role === "admin" ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"}`}>
                  {scanResult.isAdmin || scanResult.role === "admin"
                    ? "QUẢN TRỊ VIÊN"
                    : "CUSTOMER"}
                </div>
              </div>
            </div>
          )}

      {/* TRƯỜNG HỢP LÀ SẢN PHẨM (PRODUCT) */}
           {/* TRƯỜNG HỢP LÀ SẢN PHẨM (PRODUCT) */}
            {scanResult && !isUser && (
              <div className="flex flex-col h-full animate-fade-in-up mt-8">
                 
                 {/* 👉 BƯỚC 1: Đổi thành flex-col trên Mobile, flex-row trên Desktop (sm) */}
                 <div className="flex flex-col sm:flex-row gap-6 mb-8 items-center sm:items-start text-center sm:text-left">
                    
                    {/* Ảnh thu nhỏ một xíu trên mobile */}
                    <img 
                      src={scanResult.images?.[0]?.url || 'https://via.placeholder.com/150'} 
                      alt="product" 
                      className="w-full  max-w-[200px] sm:max-w-none h-auto sm:w-48 sm:h-48 object-cover rounded-2xl border shadow-md bg-white shrink-0"
                    />
                    
                    <div className="flex-1 mt-2 w-full">
                       <span className="text-xs sm:text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg uppercase tracking-wider">
                         {scanResult.category || "Sản phẩm"}
                       </span>
                       <h3 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mt-4 leading-tight">
                         {scanResult.name}
                       </h3>
                       
                       {/* 👉 BƯỚC 2: Cho SKU và Nút tự động rớt dòng hoặc full width trên Mobile */}
                       <div className="flex flex-col xl:flex-row items-center sm:items-start xl:items-center gap-3 mt-5">
                          <p className="text-sm sm:text-lg font-mono text-gray-500 bg-gray-100 inline-block px-3 py-1.5 rounded-md">
                            SKU: {scanResult.sku || 'N/A'}
                          </p>
                          
                          <a 
                             href={`/product/${scanResult._id}`} 
                             target="_blank" 
                             rel="noopener noreferrer"
                             // Thêm whitespace-nowrap và w-full trên mobile
                             className="inline-flex items-center justify-center gap-2 bg-black text-white px-5 py-2.5 rounded-lg font-bold hover:bg-gray-800 transition-colors shadow-sm cursor-pointer whitespace-nowrap w-full sm:w-auto mt-2 xl:mt-0"
                          >
                             Xem trên Shop
                             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                          </a>
                       </div>
                    </div>
                 </div>
                 
                 {/* 👉 BƯỚC 3: Hạ size chữ Giá/Tồn kho một xíu trên Mobile cho đỡ tràn */}
                 <div className="grid grid-cols-2 gap-4 sm:gap-6 mt-auto">
                    <div className="bg-gray-50 p-4 sm:p-6 rounded-2xl border text-center sm:text-left">
                       <p className="text-xs sm:text-sm font-bold text-gray-500 uppercase tracking-widest mb-2">Giá bán</p>
                       <p className="text-2xl sm:text-4xl font-black">{new Intl.NumberFormat('vi-VN').format(scanResult.price || 0)} ₫</p>
                    </div>
                    <div className="bg-gray-50 p-4 sm:p-6 rounded-2xl border text-center sm:text-left">
                       <p className="text-xs sm:text-sm font-bold text-gray-500 uppercase tracking-widest mb-2">Tồn kho</p>
                       <p className={`text-2xl sm:text-4xl font-black ${scanResult.countInStock > 0 ? 'text-green-600' : 'text-red-500'}`}>
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
