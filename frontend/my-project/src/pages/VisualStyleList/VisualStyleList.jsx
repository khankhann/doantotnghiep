import { useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from 'react-redux';
import { fetchRecommendedProducts, analyzeBodyWithAI, fetchAIConsultant } from "@redux/slices/productsSlice";

const VisualStylelist = () => {
  const dispatch = useDispatch();
  
  // 1. Lấy TẤT CẢ mọi thứ từ Redux (đã có aiAdvice và consultantLoading)
  const { 
    recommendedProducts, 
    productsLoading, 
    aiLoading, 
    consultantLoading,
    bodyType, 
    aiAdvice 
  } = useSelector((state) => state.products);
  const [gender , setGender] = useState("female")
  const [age, setAge] = useState("");

  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [purpose, setPurpose] = useState("Tìm đồ mặc hàng ngày");

  // CÁCH 1: NHẬP SỐ ĐO
  const handleCalculateBMI = (e) => {
    e.preventDefault();
    if (!height || !weight) return alert("Nhập đủ thông tin đi fen!");

    // Chuyền hết trách nhiệm cho Redux lo bằng đúng 1 dòng:
    dispatch(fetchAIConsultant({ height, weight,gender,age, purpose }));
  };

  // CÁCH 2: TẢI ẢNH
  const handleAiUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      dispatch(analyzeBodyWithAI(reader.result));
    };
  };

  return (
    <div className="max-w-4xl mx-auto my-10 p-8 bg-white rounded-3xl shadow-2xl border border-gray-100">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-black text-gray-900 mb-2"> AI VIRTUAL STYLIST </h2>
        <p className="text-gray-500">Khám phá phong cách phù hợp nhất với vóc dáng của bạn</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
        {/* PHẦN 1: NHẬP SỐ ĐO */}
        <form onSubmit={handleCalculateBMI} className="space-y-5 bg-gray-50 p-6 rounded-2xl">
          <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
            📏 Chuyên gia tư vấn (Nhập số đo)
          </h3>
          <div className="space-y-3">
            <select 
      value={gender} 
      onChange={(e) => setGender(e.target.value)} 
      className="w-full p-4 border-0 ring-1 ring-gray-200 rounded-xl focus:ring-2 focus:ring-black outline-none font-medium text-gray-700 bg-white"
    >
      <option value="female">Nữ Giới </option>
      <option value="male">Nam Giới </option>
    </select>
     <input 
              type="number" 
              value={age} 
              onChange={(e) => setAge(e.target.value)} 
              placeholder="Tuổi (age)" 
              className="w-full p-4 border-0 ring-1 ring-gray-200 rounded-xl focus:ring-2 focus:ring-black outline-none" 
            />
            <input 
              type="number" 
              value={height} 
              onChange={(e) => setHeight(e.target.value)} 
              placeholder="Chiều cao (cm)" 
              className="w-full p-4 border-0 ring-1 ring-gray-200 rounded-xl focus:ring-2 focus:ring-black outline-none" 
            />
            
            <input 
              type="number" 
              value={weight} 
              onChange={(e) => setWeight(e.target.value)} 
              placeholder="Cân nặng (kg)" 
              className="w-full p-4 border-0 ring-1 ring-gray-200 rounded-xl focus:ring-2 focus:ring-black outline-none" 
            />
             <input 
              type="text" 
              value={purpose} 
              onChange={(e) => setPurpose(e.target.value)} 
              placeholder="Mục đích (VD: Đi biển, Đi làm...)" 
              className="w-full p-4 border-0 ring-1 ring-gray-200 rounded-xl focus:ring-2 focus:ring-black outline-none font-medium text-blue-700" 
            />
          </div>
          <button 
            disabled={consultantLoading}
            className={`w-full ${consultantLoading ? 'bg-gray-400' : 'bg-black hover:bg-gray-800'} text-white py-4 rounded-xl font-bold transform active:scale-95 transition-all`}
          >
            {consultantLoading ? "AI Đang suy nghĩ..." : "Phân tích BMI & Nhận lời khuyên"}
          </button>
        </form>

        {/* PHẦN 2: TẢI ẢNH AI */}
        <div className="flex flex-col justify-center items-center p-6 border-2 border-dashed border-gray-200 rounded-2xl bg-blue-50/30">
          <h3 className="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
             AI Visual Scan (Phân tích ảnh)
          </h3>
          <label className={`cursor-pointer ${aiLoading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'} text-white px-8 py-4 rounded-xl font-bold shadow-lg shadow-blue-200 transition-all text-center`}>
            {aiLoading ? "Đang quét vóc dáng..." : "Tải ảnh toàn thân"}
            <input type="file" hidden onChange={handleAiUpload} accept="image/*" disabled={aiLoading} />
          </label>
          <p className="text-xs text-gray-400 mt-4 text-center leading-relaxed">
            Hệ thống AI Gemini sẽ phân tích cấu trúc xương <br/> và tỉ lệ cơ thể để đưa ra gợi ý chính xác.
          </p>
        </div>
      </div>

      {/* KẾT QUẢ & HIỂN THỊ SẢN PHẨM */}
      {bodyType && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          
          <div className="text-center mb-10 py-6 bg-gradient-to-r from-gray-900 to-gray-700 rounded-2xl text-white shadow-xl">
            <p className="text-sm uppercase tracking-widest opacity-70">Kết quả phân tích</p>
            <h3 className="text-3xl font-black mt-1">Vóc dáng: {bodyType}</h3>
            
            {/* LỜI KHUYÊN HIỆN RA Ở ĐÂY */}
            {aiAdvice && (
              <div className="mt-5 mx-6 p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                 <p className="italic text-gray-100 text-sm leading-relaxed">
                    " {aiAdvice} "
                 </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {productsLoading || consultantLoading ? (
               <div className="col-span-full text-center py-10 text-gray-400 font-medium animate-pulse">
                  Đang tìm kiếm những Item phù hợp nhất trong kho...
               </div>
            ) : (
              recommendedProducts?.map((product) => (
                <div key={product._id} className="group bg-white border border-gray-100 rounded-2xl p-3 hover:shadow-2xl transition-all duration-300">
                  <div className="relative overflow-hidden rounded-xl">
                    <img 
                      src={product.images[0]?.url} 
                      alt={product.name}
                      className="w-full h-52 object-cover group-hover:scale-110 transition-transform duration-500" 
                    />
                    <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-[10px] font-bold shadow-sm text-black">
                      {bodyType} Fit
                    </div>
                  </div>
                  <div className="mt-4">
                    <h4 className="text-sm font-bold text-gray-800 truncate">{product.name}</h4>
                    <p className="text-gray-900 font-black mt-1">{product.price?.toLocaleString()}đ</p>
                    <Link 
                      to={`/product/${product._id}`} 
                      className="block text-center mt-4 border border-black py-2 text-xs font-bold rounded-xl hover:bg-black hover:text-white transition-all"
                    >
                      XEM CHI TIẾT
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default VisualStylelist;