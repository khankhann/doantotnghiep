import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { 
  IoScanOutline, 
  IoPricetagOutline,
  IoInformationCircleOutline
} from "react-icons/io5";

function SearchProductRFID() {
  const [rfidCode, setRfidCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [productResult, setProductResult] = useState(null);
  
  const inputRef = useRef(null);

  // Tự động focus vào ô quét thẻ ngay khi vào trang
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const handleScan = async (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (!rfidCode.trim()) return;

      setLoading(true);
      try {
        const token = localStorage.getItem("userToken");
        const { data } = await axios.get(
            `${import.meta.env.VITE_BACKEND_URL}/api/products/rfid/${rfidCode}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        setProductResult(data);
        toast.success("Đã tìm thấy sản phẩm!");
      } catch (error) {
        setProductResult(null);
        toast.error(error.response?.data?.message || "Không tìm thấy sản phẩm!");
      } finally {
        setLoading(false);
        setRfidCode(""); 
        inputRef.current?.focus(); 
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
      
      {/* HEADER */}
      <div className="mb-8">
        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Tra cứu sản phẩm bằng RFID</h2>
        <p className="text-gray-500 text-sm mt-1">Đưa thẻ vào máy quét để truy xuất dữ liệu từ kho hệ thống.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* CỘT TRÁI: MÁY QUÉT (Chiếm 1/3) */}
        <div className="w-full lg:w-1/3">
          <div className="bg-blue-600 p-10 rounded-3xl text-center relative overflow-hidden shadow-xl sticky top-8">
             <div className="absolute top-0 left-0 w-full h-full opacity-10" style={{ backgroundImage: 'radial-gradient(circle at center, white 2px, transparent 2px)', backgroundSize: '20px 20px' }}></div>
             
             <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6 text-white animate-pulse shadow-lg">
                <IoScanOutline size={48} />
             </div>
             
             <h2 className="text-2xl font-bold text-white mb-3">Sẵn Sàng Quét</h2>
             <p className="text-blue-100 text-sm mb-8 px-2">Đưa thẻ lại gần đầu đọc RFID. Hệ thống sẽ tự động nhận diện.</p>
             
             <input 
               ref={inputRef}
               type="text"
               value={rfidCode}
               onChange={(e) => setRfidCode(e.target.value)}
               onKeyDown={handleScan}
               disabled={loading}
               placeholder="Mã thẻ sẽ hiện ở đây..."
               className="w-full bg-white/10 border-2 border-white/30 text-white placeholder:text-blue-200 rounded-xl p-4 text-center text-lg focus:outline-none focus:border-white focus:bg-white/20 transition-all font-mono tracking-widest"
             />
          </div>
        </div>

        {/* CỘT PHẢI: KẾT QUẢ SẢN PHẨM (Chiếm 2/3) */}
        <div className="w-full lg:w-2/3 bg-white rounded-3xl shadow-sm border border-gray-100 p-8 md:p-12 min-h-[500px] flex flex-col justify-center">
            {loading && (
               <div className="text-center text-gray-500 flex flex-col items-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                  <p className="text-lg font-medium animate-pulse">Đang giải mã dữ liệu thẻ...</p>
               </div>
            )}
            
            {!loading && !productResult && (
               <div className="text-center text-gray-400">
                  <IoPricetagOutline size={80} className="mx-auto mb-4 opacity-20" />
                  <p className="text-lg font-medium">Kết quả sẽ hiển thị ở đây</p>
               </div>
            )}

            {!loading && productResult && (
              <div className="flex flex-col h-full animate-fade-in-up">
                 <div className="flex gap-6 mb-8 items-start">
                    <div className="shrink-0">
                      <img 
                        src={productResult.images?.[0]?.url || 'https://via.placeholder.com/150'} 
                        alt={productResult.name} 
                        className="w-48 h-48 object-cover rounded-2xl border-2 border-gray-100 shadow-md bg-white"
                      />
                    </div>

                    <div className="flex-1 mt-2">
                       <span className="text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg uppercase tracking-wider">
                         {productResult.category}
                       </span>
                       <h3 className="text-4xl font-extrabold text-gray-900 mt-4 leading-tight">{productResult.name}</h3>
                       <p className="text-lg font-mono text-gray-500 mt-3 bg-gray-100 inline-block px-3 py-1 rounded-md">SKU: {productResult.sku || 'N/A'}</p>
                    </div>
                 </div>
                 
                 <div className="mb-8 bg-gray-50 p-6 rounded-2xl border border-gray-100 flex-1">
                    <p className="text-lg text-gray-600 leading-relaxed">
                       <IoInformationCircleOutline className="inline mr-2 text-blue-500 -mt-1" size={24} />
                       <span className="font-bold text-gray-800">Mô tả chi tiết: </span>
                       <br/>
                       <span className="mt-2 block">{productResult.description || "Chưa có mô tả chi tiết cho sản phẩm này."}</span>
                    </p>
                 </div>

                 <div className="grid grid-cols-2 gap-6 mt-auto">
                    <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 flex flex-col justify-center">
                       <p className="text-sm text-gray-500 uppercase tracking-widest font-bold mb-2">Giá bán</p>
                       <p className="text-4xl font-black text-gray-900">{new Intl.NumberFormat('vi-VN').format(productResult.price)} <span className="text-2xl text-gray-500 font-bold">₫</span></p>
                    </div>
                    <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 flex flex-col justify-center">
                       <p className="text-sm text-gray-500 uppercase tracking-widest font-bold mb-2">Tồn kho</p>
                       <div className="flex items-center gap-3">
                         <div className={`w-5 h-5 rounded-full ${productResult.countInStock > 0 ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                         <p className={`text-4xl font-black ${productResult.countInStock > 0 ? 'text-green-600' : 'text-red-500'}`}>
                           {productResult.countInStock} <span className="text-xl font-semibold text-gray-500">cái</span>
                         </p>
                       </div>
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