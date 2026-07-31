import { useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { analyzeBodyWithAI, fetchAIConsultant } from "@redux/slices/productsSlice";
import ReactMarkdown from "react-markdown";
import { IoSparkles, IoScanOutline, IoCalculatorOutline, IoArrowForward, IoCheckmarkCircle } from "react-icons/io5";

const VisualStylelist = () => {
  const dispatch = useDispatch();

  const { 
    recommendedProducts, 
    productsLoading, 
    aiLoading, 
    consultantLoading,
    bodyType, 
    aiAdvice 
  } = useSelector((state) => state.products);

  // Tab State: "measurements" (Số đo) hoặc "photo" (Quét ảnh)
  const [activeTab, setActiveTab] = useState("measurements");

  const [gender, setGender] = useState("female");
  const [age, setAge] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [purpose, setPurpose] = useState("");

  const handleCalculateBMI = (e) => {
    e.preventDefault();
    if (!height || !weight) return alert("Vui lòng nhập chiều cao và cân nặng!");
    dispatch(fetchAIConsultant({ height, weight, gender, age, purpose: purpose || "Mặc hàng ngày" }));
  };

  const handleAiUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      dispatch(analyzeBodyWithAI(reader.result));
    };
  };

  const isLoading = aiLoading || consultantLoading;

  return (
    <div className="max-w-5xl mx-auto my-12 px-4 sm:px-6">
      
      <div className="text-center max-w-xl mx-auto mb-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 text-slate-800 text-xs font-semibold uppercase tracking-widest mb-4">
          
          <span>Stylist Cá Nhân</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
          Định hình Vóc dáng & Phong cách
        </h2>
        <p className="text-slate-500 text-sm leading-relaxed">
          Phân tích tỷ lệ cơ thể bằng thuật toán AI tiên tiến để khám phá những Outfit tôn dáng nhất dành riêng cho bạn.
        </p>
      </div>

      {/* TAB SWITCHER SEAMLESS */}
      <div className="bg-slate-100/80 p-1.5 rounded-2xl max-w-md mx-auto flex items-center mb-10 border border-slate-200/60 shadow-inner">
        <button
          onClick={() => setActiveTab("measurements")}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === "measurements"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-900"
          }`}>
          <IoCalculatorOutline size={16} />
          <span>Nhập Chỉ Số BMI</span>
        </button>
        <button
          onClick={() => setActiveTab("photo")}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === "photo"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-900"
          }`}>
          <IoScanOutline size={16} />
          <span>Phân Tích Ảnh</span>
        </button>
      </div>

      {/* KHU VỰC DỮ LIỆU ĐẦU VÀO */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-xl shadow-slate-100/50 mb-12">
        {activeTab === "measurements" ? (
          /* FORM NHẬP CHỈ SỐ */
          <form onSubmit={handleCalculateBMI} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Giới tính</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium text-sm text-slate-800 focus:bg-white focus:border-slate-900 transition-colors">
                  <option value="female">Nữ Giới</option>
                  <option value="male">Nam Giới</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Tuổi</label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="Ví dụ: 22"
                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium text-sm text-slate-800 focus:bg-white focus:border-slate-900 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Chiều cao (cm)</label>
                <input
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  placeholder="Ví dụ: 165"
                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium text-sm text-slate-800 focus:bg-white focus:border-slate-900 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Cân nặng (kg)</label>
                <input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="Ví dụ: 52"
                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium text-sm text-slate-800 focus:bg-white focus:border-slate-900 transition-colors"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Mục đích diện đồ</label>
                <input
                  type="text"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="Ví dụ: Đi biển, Đi làm công sở, Tiệc tối..."
                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium text-sm text-slate-800 focus:bg-white focus:border-slate-900 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-slate-900 hover:bg-black text-white rounded-xl font-bold text-sm tracking-wide transition-all shadow-lg shadow-slate-900/10 flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50">
              {consultantLoading ? (
                <span>Đang phân tích vóc dáng...</span>
              ) : (
                <>
                  <span>Phân Tích BMI & Nhận Tư Vấn</span>
                  <IoArrowForward size={16} />
                </>
              )}
            </button>
          </form>
        ) : (
          /* KHU VỰC QUÉT ẢNH */
          <div className="py-8 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4 border border-blue-100">
              <IoScanOutline size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Tải ảnh toàn thân của bạn</h3>
            <p className="text-xs text-slate-500 max-w-sm mb-6 leading-relaxed">
              Thuật toán nhận diện tỷ lệ khung xương qua ảnh để đưa ra định hình vóc dáng trực quan nhất.
            </p>

            <label className={`cursor-pointer px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all ${aiLoading ? "opacity-50 pointer-events-none" : ""}`}>
              {aiLoading ? "Đang xử lý hình ảnh..." : "Chọn ảnh từ thiết bị"}
              <input type="file" hidden onChange={handleAiUpload} accept="image/*" disabled={aiLoading} />
            </label>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* KẾT QUẢ PHÂN TÍCH & LỜI KHUYÊN */}
      {/* ========================================================= */}
      {bodyType && (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
          
          {/* CARD TỔNG QUAN VÓC DÁNG (EDITORIAL LOOK) */}
          <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-6 mb-6">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Kết quả định hình</span>
                <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-white mt-1">
                  Vóc dáng: <span className="text-amber-400">{bodyType}</span>
                </h3>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-700">
                <IoCheckmarkCircle size={16} className="text-emerald-400" />
                <span>Hoàn tất phân tích</span>
              </div>
            </div>

            {/* HIỂN THỊ LỜI KHUYÊN BẰNG REACT MARKDOWN */}
            {aiAdvice && (
              <div className="bg-slate-800/60 rounded-2xl p-6 border border-slate-700/50 backdrop-blur-sm text-slate-200 text-sm leading-relaxed font-light prose prose-invert max-w-none">
                <ReactMarkdown>{aiAdvice}</ReactMarkdown>
              </div>
            )}
          </div>

          {/* SẢN PHẨM GỢI Ý */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Gợi Ý Trang Phục Phù Hợp</h3>
                <p className="text-xs text-slate-500 mt-1">Các Item được tuyển chọn riêng cho phom dáng {bodyType}</p>
              </div>
            </div>

            {productsLoading || isLoading ? (
              <div className="py-16 text-center text-slate-400 font-medium text-sm animate-pulse">
                Đang lựa chọn những món đồ chuẩn phom dáng nhất từ cửa hàng...
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {recommendedProducts?.map((product) => (
                  <div key={product._id} className="group bg-white rounded-2xl border border-slate-100 p-3 hover:border-slate-300 hover:shadow-xl transition-all duration-300 flex flex-col">
                    <div className="relative overflow-hidden rounded-xl bg-slate-50 aspect-[3/4]">
                      <img 
                        src={product.images?.[0]?.url || product.images?.[0] || "/placeholder.jpg"} 
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                      />
                      <div className="absolute top-2.5 left-2.5 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-md text-[10px] font-bold text-slate-800 shadow-sm border border-white/50">
                        {bodyType}
                      </div>
                    </div>

                    <div className="mt-3 flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 line-clamp-1 group-hover:text-blue-600 transition-colors">
                          {product.name}
                        </h4>
                        <p className="text-sm font-black text-slate-900 mt-1">
                          {product.price?.toLocaleString("vi-VN")}đ
                        </p>
                      </div>

                      <Link 
                        to={`/product/${product._id}`} 
                        className="w-full mt-4 py-2.5 bg-slate-50 hover:bg-slate-900 text-slate-800 hover:text-white text-xs font-bold rounded-xl text-center transition-all border border-slate-200 hover:border-slate-900">
                        Xem Sản Phẩm
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default VisualStylelist;