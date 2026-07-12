import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Html5QrcodeScanner } from "html5-qrcode";
import { 
  IoScanOutline, IoCubeOutline, IoCloseCircleOutline, IoOpenOutline, 
  IoHardwareChipOutline, IoRefreshOutline 
} from "react-icons/io5";

function SearchProductRFID() {
  const [scanResult, setScanResult] = useState(null);
  const [lastScannedCode, setLastScannedCode] = useState("");
  const [isScanningQR, setIsScanningQR] = useState(false);
  const scannerRef = useRef(null);
  const currentScannedRef = useRef("");

  const isUser = scanResult && scanResult.email !== undefined;

  // Xử lý làm mới trang (Reset toàn bộ)
  const handleRefresh = () => {
    setScanResult(null);
    setLastScannedCode("");
    currentScannedRef.current = "";
    toast.info("Đã làm mới hệ thống");
  };

  useEffect(() => {
    if (isScanningQR) {
      const timer = setTimeout(() => {
        if (!scannerRef.current) {
          scannerRef.current = new Html5QrcodeScanner("qr-reader", { fps: 10, qrbox: 200 }, false);
          scannerRef.current.render(async (decodedText) => {
            scannerRef.current.clear();
            scannerRef.current = null;
            setIsScanningQR(false);
            const productId = decodedText.split("/").pop();
            try {
              const { data } = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/products/${productId}`);
              setScanResult(data);
              setLastScannedCode("QR: " + productId);
            } catch {
              toast.error("Không tìm thấy sản phẩm");
            }
          });
        }
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isScanningQR]);

  return (
    <div className="max-w-6xl mx-auto p-4 bg-white min-h-screen font-sans">
      {/* Header tối giản + Nút Refresh */}
      <div className="mb-6 border-b border-gray-200 pb-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Hệ thống Quét Truy Xuất</h1>
          <p className="text-sm text-gray-500">RFID & QR Scanner Module</p>
        </div>
        <button 
          onClick={handleRefresh}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 text-xs font-bold rounded-sm transition"
        >
          <IoRefreshOutline size={14}/> Làm mới
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Cột Camera */}
        <div className="lg:col-span-4 space-y-4">
          <div className="border border-gray-200 bg-gray-50 p-3 rounded-sm">
            {isScanningQR ? (
              <div className="relative">
                <button onClick={() => setIsScanningQR(false)} className="absolute top-2 right-2 z-10 text-gray-600"><IoCloseCircleOutline size={20}/></button>
                <div id="qr-reader" className="rounded-sm"></div>
              </div>
            ) : (
              <div className="flex flex-col items-center py-10 border border-dashed border-gray-300">
                <IoScanOutline size={32} className="text-gray-400 mb-2" />
                <button onClick={() => setIsScanningQR(true)} className="px-4 py-2 bg-slate-800 text-white text-xs font-bold rounded-sm hover:bg-black transition">
                  Mở Camera QR
                </button>
              </div>
            )}
          </div>
          
          <div className="p-4 border border-blue-200 bg-blue-50/50 rounded-sm">
            <div className="flex items-center gap-2 mb-2">
              <IoHardwareChipOutline className="text-blue-600" />
              <p className="text-[10px] font-bold text-blue-800 uppercase">Trạng thái RFID Reader</p>
            </div>
            <p className="text-xs text-gray-600 font-mono bg-white p-2 border border-gray-200 rounded-sm break-all">
              {lastScannedCode || "Đang chờ thẻ..."}
            </p>
          </div>
        </div>

        {/* Cột Kết quả */}
        <div className="lg:col-span-8">
          {!scanResult ? (
            <div className="h-full min-h-[300px] flex flex-col items-center justify-center border border-gray-200 rounded-sm text-gray-400">
              <IoCubeOutline size={32} className="mb-2 opacity-50" />
              <p className="text-sm">Đang chờ tín hiệu quét...</p>
            </div>
          ) : isUser ? (
            <div className="border border-gray-200 p-6 rounded-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-100 flex items-center justify-center rounded-sm text-gray-600 font-bold">{scanResult.name?.charAt(0)}</div>
                <div>
                  <h2 className="font-bold text-gray-900">{scanResult.name}</h2>
                  <p className="text-xs text-gray-500">{scanResult.email}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="border border-gray-200 rounded-sm overflow-hidden">
              <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                <h3 className="font-bold text-gray-700 text-sm">Thông tin Sản phẩm</h3>
                <span className="text-xs font-mono text-gray-400">SKU: {scanResult.sku}</span>
              </div>
              
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex gap-4">
                  <img src={scanResult.images?.[0]?.url} className="w-20 h-20 object-cover border border-gray-200" />
                  <div>
                    <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">{scanResult.category?.name}</p>
                    <p className="font-bold text-gray-900 mb-2">{scanResult.name}</p>
                    <a 
                      href={`/product/${scanResult._id}`} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 text-[10px] font-bold rounded-sm"
                    >
                      <IoOpenOutline size={12}/> Xem chi tiết
                    </a>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm py-1 border-b border-gray-100">
                    <span className="text-gray-500">Giá bán</span>
                    <span className="font-bold">{new Intl.NumberFormat('vi-VN').format(scanResult.price)} đ</span>
                  </div>
                  <div className="flex justify-between text-sm py-1 border-b border-gray-100">
                    <span className="text-gray-500">Tồn kho</span>
                    <span className={`font-bold ${scanResult.countInStock > 0 ? 'text-blue-600' : 'text-red-500'}`}>{scanResult.countInStock}</span>
                  </div>
                </div>
              </div>

              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 uppercase text-[10px]">
                  <tr>
                    <th className="px-6 py-3 text-left">Phân loại</th>
                    <th className="px-6 py-3 text-right">Số lượng</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {scanResult.variants?.map((v, i) => (
                    <tr key={i}>
                      <td className="px-6 py-3">{v.variantName}</td>
                      <td className="px-6 py-3 text-right font-bold">{v.stock}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SearchProductRFID;