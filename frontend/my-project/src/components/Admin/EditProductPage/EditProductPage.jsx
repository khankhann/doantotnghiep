import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { fetchProductDetails } from "../../../redux/slices/productsSlice";
import { updateProduct, generateProductQR } from "../../../redux/slices/adminProductSlice";
import { fetchCategories } from "../../../redux/slices/categorySlice"; 
import api from "../../../api/axiosClients";
import { toast } from "sonner";

function EditProductPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();

  const { selectedProduct, loading: productLoading } = useSelector((state) => state.products || {});
  const { categories = [] } = useSelector((state) => state.categories || {});

  const [uploading, setUploading] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [generatingQR, setGeneratingQR] = useState(false);

  const [productData, setProductData] = useState({
    name: "",
    description: "",
    price: 0,
    sku: "",
    category: "",
    brand: "",
    gender: "", 
    variants: [{ variantName: "", stock: 0, price: 0, sku: "" }], 
    images: [],
    attributes: [],
    qrCodeUrl: "",
  });

  useEffect(() => {
    dispatch(fetchCategories());
    if (id) {
      dispatch(fetchProductDetails(id));
    }
  }, [dispatch, id]);

  useEffect(() => {
    if (selectedProduct && selectedProduct._id === id) {
      const genderAttr = selectedProduct.attributes?.find(
        (a) => a.name.toLowerCase() === "gender" || a.name.toLowerCase() === "giới tính"
      );

      setProductData({
        ...selectedProduct,
        category: typeof selectedProduct.category === 'object' ? selectedProduct.category._id : selectedProduct.category,
        gender: genderAttr ? genderAttr.value : "",
        variants: selectedProduct.variants?.length > 0 ? selectedProduct.variants : [{ variantName: "", stock: 0, price: 0, sku: "" }],
      });
    }
  }, [selectedProduct, id]);

  const parentCategories = categories.filter(cat => !cat.parentCategory);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProductData((prev) => ({ 
      ...prev, 
      [name]: name === "price" ? Number(value.replace(/\D/g, "")) : value 
    }));
  };

  const generateSKU = () => {
    if (!productData.category) return toast.error("Vui lòng chọn Danh mục trước khi tạo mã!");
    const selectedCat = categories.find(c => c._id === productData.category);
    let prefix = "SP-"; 
    if (selectedCat) {
      const catName = selectedCat.name.toLowerCase();
      if (catName.includes("top") || catName.includes("áo")) prefix = "TOP-";
      else if (catName.includes("bottom") || catName.includes("quần")) prefix = "BOT-";
    }
    const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
    setProductData(prev => ({ ...prev, sku: `${prefix}${randomStr}` }));
  };
 
  const handleVariantChange = (index, field, val) => {
    setProductData(prev => {
        const newVariants = [...prev.variants];
      newVariants[index] = {
        ...newVariants[index],
        [field]: (field === "stock" || field === "price") ? Number(val.replace(/\D/g, "")) : val
      };
      return { ...prev, variants: newVariants };
    });
  };

  const handleAddVariant = () => setProductData(prev => ({ ...prev, variants: [...prev.variants, { variantName: "", stock: 0, price: 0, sku: "" }] }));
  const handleRemoveVariant = (index) => setProductData(prev => ({ ...prev, variants: prev.variants.filter((_, i) => i !== index) }));
  
  const totalStock = productData.variants.reduce((sum, variant) => sum + (Number(variant.stock) || 0), 0);

  // Logic Ảnh
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("image", file);
    setUploading(true);
    try {
      const { data } = await api.post(`/api/upload`, formData, { headers: { "Content-Type": "multipart/form-data" } });
      setProductData((prev) => ({ ...prev, images: [...prev.images, { url: data.imageUrl, altText: "" }] }));
    } catch (error) {
      toast.error("Lỗi upload ảnh!");
    } finally { setUploading(false); }
  };
  const handleAddImageUrl = (e) => {
    if (e) e.preventDefault(); 
    if (!imageUrlInput.trim()) return toast.error("Vui lòng nhập link ảnh!");
    setProductData((prev) => ({ ...prev, images: [...prev.images, { url: imageUrlInput.trim(), altText: "" }] }));
    setImageUrlInput(""); 
  };
  const handleRemoveImage = (indexImage) => setProductData((prev) => ({ ...prev, images: prev.images.filter((_, index) => index !== indexImage) }));

  // Logic QR
  const handleGenerateQR = async () => {
    try {
      setGeneratingQR(true);
      const resultAction = await dispatch(generateProductQR({ id })).unwrap();
      setProductData((prev) => ({ ...prev, qrCodeUrl: resultAction.qrCodeUrl }));
      toast.success("Tạo QR Code thành công!");
    } catch (error) {
      toast.error("Lỗi: Không thể tạo QR Code!");
    } finally {
      setGeneratingQR(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if(!productData.category) return toast.error("Vui lòng chọn Danh Mục!");
    if(!productData.sku) return toast.error("Vui lòng nhập hoặc tạo Mã sản phẩm (SKU)!");

    const validVariants = productData.variants.filter(v => v.variantName.trim() !== "");
    if (validVariants.length === 0) return toast.error("Vui lòng thêm ít nhất 1 Phân loại hàng");

    const finalAttributes = [];
    if (productData.gender) {
      finalAttributes.push({ name: "Gender", value: productData.gender });
    }

    const finalData = { 
      ...productData, 
      attributes: finalAttributes,
      variants: validVariants,
      countInStock: totalStock 
    };
    
    dispatch(updateProduct({ id, productData: finalData }));
    toast.success("Cập nhật sản phẩm thành công!");
    navigate("/admin/products");
  };

  if (productLoading) return <div className="flex justify-center mt-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-800"></div></div>;

  const inputStyle = "w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white block p-3 transition-all duration-200 outline-none";
  const labelStyle = "block mb-2 text-sm font-medium text-gray-700";

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 min-h-screen font-sans">
      
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Chỉnh sửa sản phẩm</h2>
        <p className="text-sm text-gray-500 mt-1">Cập nhật thông tin chi tiết hoặc quản lý mã QR cho sản phẩm này.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row gap-6">
         
        <div className="w-full lg:w-2/3 space-y-6">
          
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-base font-semibold text-gray-800 mb-5 pb-4 border-b border-gray-100">Thông tin cơ bản</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
              <div className="md:col-span-2">
                <label className={labelStyle}>Tên sản phẩm *</label>
                <input type="text" name="name" value={productData.name} onChange={handleChange} required className={inputStyle} />
              </div>
              <div className="md:col-span-2">
                <label className={labelStyle}>Mô tả chi tiết *</label>
                <textarea name="description" value={productData.description} onChange={handleChange} rows={4} required className={inputStyle} />
              </div>
              
              <div>
                <label className={labelStyle}>Danh mục chính *</label>
                <select value={productData.category} onChange={(e) => setProductData({...productData, category: e.target.value})} required className={inputStyle}>
                   <option value="">-- Chọn danh mục --</option>
                   {parentCategories.map(cat => <option key={cat._id} value={cat._id}>{cat.name}</option>)}
                </select>
              </div>

              <div>
                <label className={labelStyle}>Thương hiệu *</label>
                <input type="text" name="brand" value={productData.brand} onChange={handleChange} required className={inputStyle} />
              </div>
              
              <div>
                <label className={labelStyle}>Giá bán gốc (VNĐ) *</label>
                <input type="text" name="price" value={new Intl.NumberFormat('vi-VN').format(productData.price)} onChange={handleChange} className={inputStyle} />
              </div>

              <div>
                 <label className={labelStyle}>Giới tính *</label>
                 <select name="gender" value={productData.gender} onChange={handleChange} required className={inputStyle}>
                   <option value="">-- Phân loại giới tính --</option>
                   <option value="Men">Nam (Men)</option>
                   <option value="Women">Nữ (Women)</option>
                   <option value="Unisex">Unisex (Cả nam và nữ)</option>
                 </select>
              </div>

              <div className="md:col-span-2">
                <label className={labelStyle}>Mã sản phẩm (SKU) *</label>
                <div className="flex shadow-sm rounded-lg">
                  <input type="text" name="sku" value={productData.sku} onChange={handleChange} required 
                    className="flex-1 min-w-0 block w-full px-4 py-3 rounded-none rounded-l-lg bg-gray-50 border border-gray-200 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-colors outline-none font-mono uppercase" 
                  />
                  <button type="button" onClick={generateSKU} 
                    className="inline-flex items-center px-4 py-3 bg-white border border-l-0 border-gray-200 rounded-r-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors whitespace-nowrap outline-none focus:ring-2 focus:ring-blue-500/20">
                    Tạo lại mã
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Card: Phân loại & Tồn kho */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-5 pb-4 border-b border-gray-100">
              <div>
                <h3 className="text-base font-semibold text-gray-800">Quản lý Kho & Phân loại</h3>
                <p className="text-xs text-gray-500 mt-1">Tổng sản phẩm: <span className="font-bold text-blue-600">{totalStock}</span></p>
              </div>
              <button type="button" onClick={handleAddVariant} className="text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors">
                + Thêm tùy chọn
              </button>
            </div>
            
            <div className="space-y-3">
              <div className="hidden md:flex gap-3 text-xs font-medium text-gray-500 uppercase px-1">
                <div className="flex-[2]">Tên phân loại</div>
                <div className="flex-1 text-center">Tồn kho</div>
                <div className="flex-1 text-right">Giá bán (Tùy chọn)</div>
                <div className="w-12"></div>
              </div>

              {productData.variants.map((variant, index) => (
                <div key={index} className="flex flex-col md:flex-row gap-3 items-start md:items-center p-3 md:p-0 bg-gray-50 md:bg-transparent rounded-lg border border-gray-100 md:border-none">
                  <div className="w-full md:flex-[2]">
                    <span className="md:hidden text-xs font-medium text-gray-500 mb-1 block">Tên phân loại</span>
                    {/* BÂY GIỜ GÕ VÀO ĐÂY LÀ CHẠY MƯỢT MÀ */}
                    <input placeholder="VD: Size L - Màu Đen" value={variant.variantName} onChange={(e) => handleVariantChange(index, "variantName", e.target.value)} required className={inputStyle} />
                  </div>
                  <div className="w-full md:flex-1">
                    <span className="md:hidden text-xs font-medium text-gray-500 mb-1 block">Tồn kho</span>
                    <input type="text" placeholder="0" value={variant.stock || ""} onChange={(e) => handleVariantChange(index, "stock", e.target.value)} required className={`${inputStyle} md:text-center font-medium`} />
                  </div>
                  <div className="w-full md:flex-1">
                    <span className="md:hidden text-xs font-medium text-gray-500 mb-1 block">Giá bán</span>
                    <input type="text" placeholder="Trống = Giá gốc" value={variant.price ? new Intl.NumberFormat('vi-VN').format(variant.price) : ""} onChange={(e) => handleVariantChange(index, "price", e.target.value)} className={`${inputStyle} md:text-right`} />
                  </div>
                  <div className="w-full md:w-12 flex justify-end md:justify-center">
                    <button type="button" onClick={() => handleRemoveVariant(index)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Xóa">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
 
       <div className="w-full lg:w-1/3 space-y-6">
           
           <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-base font-semibold text-gray-800 mb-4">Hình ảnh sản phẩm</h3>
            <div className="space-y-4">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <svg className="w-8 h-8 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                      <p className="text-sm text-gray-500 font-medium">Click để tải ảnh lên</p>
                  </div>
                  <input type="file" onChange={handleImageUpload} className="hidden" />
              </label>

              <div className="flex items-center gap-2">
                <span className="h-px bg-gray-200 flex-1"></span>
                <span className="text-xs font-medium text-gray-400">HOẶC DÁN LINK</span>
                <span className="h-px bg-gray-200 flex-1"></span>
              </div>

              <div className="flex gap-2">
                 <input type="text" value={imageUrlInput} onChange={(e) => setImageUrlInput(e.target.value)} placeholder="https://..." className={inputStyle} />
                 <button type="button" onClick={handleAddImageUrl} className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors">Thêm</button>
              </div>
            </div>

            {productData.images.length > 0 && (
              <div className="grid grid-cols-3 gap-3 mt-5">
                {productData.images.map((img, index) => (
                  <div key={index} className="relative group aspect-square rounded-lg border border-gray-200 overflow-hidden">
                    <img src={img.url} className="w-full h-full object-cover" alt="Product" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button type="button" onClick={() => handleRemoveImage(index)} className="bg-white/20 text-white hover:bg-red-500 rounded-full p-1.5 backdrop-blur-sm transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

           <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
             <h3 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
               <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"></path></svg>
               Mã QR Truy Xuất
             </h3>
             
             {productData.qrCodeUrl ? (
                <div className="flex flex-col items-center">
                  <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100 mb-4 inline-block">
                    <img src={productData.qrCodeUrl} className="w-36 h-36 object-contain mix-blend-multiply" alt="QR Code" />
                  </div>
                  <p className="text-xs text-center text-gray-500 mb-4 px-2">Dùng súng bắn mã hoặc camera quét để thao tác kho nhanh.</p>
                  <a href={productData.qrCodeUrl} download={`QR_${productData.sku || 'product'}.png`} className="w-full bg-white border border-gray-200 text-gray-700 font-medium py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-sm text-center">
                    Tải ảnh QR về máy
                  </a>
                </div>
             ) : (
                <div className="flex flex-col items-center py-6 text-center">
                  <div className="w-14 h-14 bg-yellow-50 text-yellow-600 rounded-full flex items-center justify-center mb-3">
                     <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                  </div>
                  <p className="text-sm text-gray-600 mb-5">Sản phẩm này chưa được cấp mã định danh.</p>
                  <button type="button" onClick={handleGenerateQR} disabled={generatingQR} className="w-full bg-yellow-500 text-white font-bold py-3 rounded-xl hover:bg-yellow-600 transition-colors text-sm shadow-sm">
                    {generatingQR ? "Đang xử lý tạo mã..." : "Cấp Mã QR Mới"}
                  </button>
                </div>
             )}
           </div>

           <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 sticky top-8">
              <button type="submit" className="w-full flex items-center justify-center gap-2 bg-green-600 text-white font-bold py-3.5 px-4 rounded-xl hover:bg-green-700 transition-colors focus:ring-4 focus:ring-green-600/20 outline-none shadow-md">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                Lưu Thay Đổi
              </button>
           </div>

        </div>
      </form>
    </div>
  );
}

export default EditProductPage;