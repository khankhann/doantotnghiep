import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { createProduct } from "@redux/slices/adminProductSlice";
import api from "../../../api/axiosClients";
import { toast } from "sonner"; 

function CreateProductPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.products);
  const [uploading, setUploading] = useState(false);
  
  // 🔥 STATE MỚI ĐỂ CHỨA URL ẢNH NGƯỜI DÙNG NHẬP VÀO
  const [imageUrlInput, setImageUrlInput] = useState("");

  const [productData, setProductData] = useState({
    name: "",
    description: "",
    price: 0,
    countInStock: 0,
    sku: "",
    category: "",
    brand: "",
    sizes: [],
    colors: [],
    collections: "",
    material: "",
    gender: "",
    images: [],
    rfid: "", 
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "price" || name === "countInStock") {
      const rawValue = value.replace(/\D/g, "");
      setProductData((prev) => ({
        ...prev,
        [name]: Number(rawValue),
      }));
    } else {
      setProductData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleRFIDKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault(); 
      if (productData.rfid.trim() !== "") {
        toast.success(`Đã nhận mã thẻ: ${productData.rfid}`);
      }
    }
  };

  // --- XỬ LÝ UPLOAD ẢNH TỪ FILE (CŨ) ---
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("image", file);

    try {
      setUploading(true);
      const { data } = await api.post(`/api/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setProductData((prev) => ({
        ...prev,
        images: [...prev.images, { url: data.imageUrl, altText: "" }],
      }));
      setUploading(false);
    } catch (error) {
      console.error(error);
      setUploading(false);
      toast.error("Lỗi upload ảnh!");
    }
  };

  // 🔥 XỬ LÝ THÊM ẢNH TỪ URL (MỚI) ---
  const handleAddImageUrl = (e) => {
    if (e) e.preventDefault(); // Chặn reload form nếu bấm nút
    
    if (!imageUrlInput.trim()) {
      toast.error("Vui lòng nhập link ảnh!");
      return;
    }

    // Đẩy link ảnh mới vào mảng images hiện tại
    setProductData((prev) => ({
      ...prev,
      images: [...prev.images, { url: imageUrlInput.trim(), altText: "" }],
    }));
    
    setImageUrlInput(""); // Xóa trắng ô input sau khi thêm xong
    toast.success("Đã thêm ảnh từ URL!");
  };

  const handleRemoveImage = (indexImage) => {
    setProductData((prev) => ({
      ...prev,
      images: prev.images.filter((_, index) => index !== indexImage),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(createProduct(productData));
    toast.success("Tạo sản phẩm thành công!");
    navigate("/admin/products");
  };

  if (loading) return <div className="flex justify-center mt-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div></div>;
  if (error) return <p className="text-center text-red-500 mt-10">Error: {error}</p>;

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Create Product</h2>
        <p className="text-gray-500 text-sm mt-1">Thêm sản phẩm mới và gắn thẻ RFID để quản lý kho.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row gap-8">
        
        {/* CỘT TRÁI: FORM NHẬP THÔNG TIN */}
        <div className="w-full lg:w-2/3 bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
          <h3 className="text-lg font-bold border-b pb-4">Thông tin cơ bản</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-2">Product Name *</label>
              <input type="text" name="name" value={productData.name} onChange={handleChange} required className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-black outline-none transition-all" />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-2">Description *</label>
              <textarea name="description" value={productData.description} onChange={handleChange} rows={4} required className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-black outline-none transition-all" />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Price (VNĐ) *</label>
              <input type="text" name="price" value={new Intl.NumberFormat('vi-VN').format(productData.price || 0)} onChange={handleChange} className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-black outline-none transition-all" />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Count in Stock</label>
              <input type="number" name="countInStock" value={productData.countInStock} onChange={handleChange} className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-black outline-none transition-all" />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Category *</label>
              <input type="text" name="category" value={productData.category} onChange={handleChange} required className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-black outline-none transition-all" />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Brand *</label>
              <input type="text" name="brand" value={productData.brand} onChange={handleChange} required className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-black outline-none transition-all" />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">SKU</label>
              <input type="text" name="sku" value={productData.sku} onChange={handleChange} className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-black outline-none transition-all" />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Gender *</label>
              <select name="gender" value={productData.gender} onChange={handleChange} required className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-black outline-none transition-all bg-white">
                <option value="">-- Chọn giới tính --</option>
                <option value="Men">Men</option>
                <option value="Women">Women</option>
                <option value="Unisex">Unisex</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Sizes (Ngăn cách bởi dấu phẩy)</label>
              <input type="text" name="sizes" value={productData.sizes.join(",")} onChange={(e) => setProductData({ ...productData, sizes: e.target.value.split(",").map((s) => s.trim()) })} className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-black outline-none transition-all" />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Color (Ngăn cách bởi dấu phẩy)</label>
              <input type="text" name="color" value={productData.colors.join(",")} onChange={(e) => setProductData({ ...productData, colors: e.target.value.split(",").map((c) => c.trim()) })} className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-black outline-none transition-all" />
            </div>
          </div>

          {/* 🔥 KHU VỰC UPLOAD VÀ THÊM ẢNH TỪ URL */}
          <div className="pt-6 border-t mt-8">
            <label className="block text-sm font-bold text-gray-700 mb-4">Hình ảnh sản phẩm</label>
            
            <div className="flex flex-col xl:flex-row gap-4 items-start xl:items-center bg-gray-50 p-4 rounded-xl border border-gray-200">
               
               {/* Nút tải file */}
               <label className="cursor-pointer bg-white hover:bg-gray-100 text-gray-700 font-bold py-2.5 px-4 rounded-xl transition-colors border border-gray-300 flex items-center justify-center shrink-0 shadow-sm">
                  Tải ảnh từ máy
                  <input type="file" onChange={handleImageUpload} className="hidden" />
               </label>

               <span className="text-gray-400 font-bold text-xs uppercase hidden xl:block">Hoặc</span>

               {/* Ô nhập URL */}
               <div className="flex-1 flex gap-2 w-full">
                  <input 
                    type="text" 
                    value={imageUrlInput}
                    onChange={(e) => setImageUrlInput(e.target.value)}
                    onKeyDown={(e) => {
                       if (e.key === "Enter") {
                         e.preventDefault(); // Quan trọng: Ngăn gõ Enter bị văng Form
                         handleAddImageUrl();
                       }
                    }}
                    placeholder="Dán đường dẫn ảnh (URL) vào đây..." 
                    className="w-full border border-gray-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-black outline-none transition-all"
                  />
                  <button 
                    type="button" 
                    onClick={handleAddImageUrl}
                    className="bg-black text-white px-5 py-2.5 rounded-xl font-bold hover:bg-gray-800 transition-colors shrink-0 text-sm shadow-md"
                  >
                    Thêm
                  </button>
               </div>
            </div>

            {uploading && <span className="text-sm text-blue-600 font-bold animate-pulse mt-3 block">Đang tải ảnh lên máy chủ...</span>}
            
            {/* Vùng hiển thị ảnh đã thêm */}
            <div className="flex gap-4 mt-6 flex-wrap">
              {productData.images.map((img, index) => (
                <div key={index} className="relative group">
                  <img src={img.url} alt="Product" className="w-24 h-24 object-cover rounded-xl shadow-sm border border-gray-200" />
                  <button type="button" onClick={() => handleRemoveImage(index)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 shadow-md opacity-0 group-hover:opacity-100 transition-opacity">
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CỘT PHẢI: KHU VỰC RFID & SUBMIT */}
        <div className="w-full lg:w-1/3 space-y-6">
           <div className="bg-white p-6 rounded-2xl shadow-sm border-2 border-blue-100 sticky top-8">
              <div className="flex flex-col items-center text-center">
                 <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                 </div>
                 <h3 className="text-xl font-bold text-gray-900 mb-2">Quẹt thẻ RFID</h3>
                 <p className="text-sm text-gray-500 mb-6">Click vào ô bên dưới, sau đó dùng máy quét để quét thẻ sản phẩm.</p>
                 
                 <div className="w-full relative">
                    <input 
                      type="text" 
                      name="rfid" 
                      value={productData.rfid} 
                      onChange={handleChange}
                      onKeyDown={handleRFIDKeyDown}
                      placeholder="Mã RFID sẽ hiện ở đây..." 
                      className="w-full border-2 border-blue-200 rounded-xl p-4 text-center font-mono text-lg font-bold text-blue-700 bg-blue-50/50 focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all placeholder:font-sans placeholder:text-sm placeholder:font-normal"
                    />
                    {productData.rfid && (
                       <span className="absolute right-3 top-1/2 -translate-y-1/2 flex h-3 w-3">
                         <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                         <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                       </span>
                    )}
                 </div>
                 {productData.rfid && <p className="text-xs text-green-600 font-bold mt-3">Đã gán mã thẻ thành công!</p>}
              </div>

              <hr className="my-6 border-gray-100" />

              <button
                type="submit"
                className="w-full bg-gray-900 text-white font-bold py-4 rounded-xl hover:bg-black active:scale-[0.98] transition-all shadow-lg shadow-gray-900/20 text-lg flex justify-center items-center gap-2"
              >
                Lưu Sản Phẩm
              </button>
           </div>
        </div>

      </form>
    </div>
  );
}

export default CreateProductPage;