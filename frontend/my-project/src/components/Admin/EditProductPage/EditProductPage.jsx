import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { fetchProductDetails } from "@redux/slices/productsSlice";
import { updateProduct, generateProductQR } from "@redux/slices/adminProductSlice"; // Xóa import thừa, gộp vào 1 dòng
import api from "../../../api/axiosClients";
import { toast } from "sonner"; // Nhớ import toast để nó thông báo thành công nhé

function EditProductPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  const { selectedProduct, loading, error } = useSelector(
    (state) => state.products,
  );
  const [uploading, setUploading] = useState(false);
  
  const [imageUrlInput, setImageUrlInput] = useState("");

  // 👉 THÊM STATE LOADING CHO NÚT TẠO QR
  const [generatingQR, setGeneratingQR] = useState(false);

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
    qrCodeUrl: "", 
  });

  useEffect(() => {
    if (id) {
      dispatch(fetchProductDetails(id));
    }
  }, [dispatch, id]);

  useEffect(() => {
    if (selectedProduct) {
      setProductData(selectedProduct);
    }
  }, [selectedProduct]);

  // 👉 HÀM GỌI REDUX ĐỂ TẠO MÃ QR BỔ SUNG
  const handleGenerateQR = async () => {
    try {
      setGeneratingQR(true);
      // Gọi qua Redux
      const resultAction = await dispatch(generateProductQR({ id })).unwrap();
      
      // Update state để web hiển thị mã QR ngay lập tức mà không cần F5
      setProductData((prev) => ({ ...prev, qrCodeUrl: resultAction.qrCodeUrl }));
      toast.success("Tạo QR Code thành công!");
    } catch (error) {
      console.error(error);
      toast.error("Lỗi: Không thể tạo QR Code!");
    } finally {
      setGeneratingQR(false);
    }
  };

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
    }
  };

  const handleAddImageUrl = (e) => {
    e.preventDefault(); 
    if (imageUrlInput.trim()) {
      setProductData((prev) => ({
        ...prev,
        images: [...prev.images, { url: imageUrlInput.trim(), altText: "" }],
      }));
      setImageUrlInput(""); 
    }
  };

  const handleRemoveImage = (indexImage) => {
    setProductData((prev) => ({
      ...prev,
      images: prev.images.filter((_, index) => index !== indexImage),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(updateProduct({ id, productData }));
    navigate("/admin/products");
  };

  if (loading) return <div className="flex justify-center mt-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900"></div></div>;
  if (error) return <p className="text-center text-red-500 mt-10">Error : {error} </p>;

  return (
    <div className="max-w-5xl mx-auto p-6 shadow-md rounded-md bg-white">
      <h2 className="text-3xl font-bold mb-6 ">Edit Product</h2>
      <form onSubmit={handleSubmit}>
        
        {/* CÁC INPUT THÔNG TIN BÊN TRÊN GIỮ NGUYÊN... */}
        <div className="mb-6"><label className="block font-semibold mb-2">Product Name</label><input type="text" name="name" value={productData.name || ""} onChange={handleChange} className="w-full border border-gray-300 rounded-md p-2" required /></div>
        <div className="mb-6"><label className="block font-semibold mb-2">Description</label><textarea name="description" value={productData.description || ""} onChange={handleChange} className="w-full border border-gray-300 rounded-md p-2" rows={4} required /></div>
        <div className="mb-6"><label className="block font-semibold mb-2">Price</label><input type="text" name="price" value={new Intl.NumberFormat('vi-VN').format(productData.price || 0)} onChange={handleChange} className="w-full border border-gray-300 rounded-md p-2" /></div>
        <div className="mb-6"><label className="block font-semibold mb-2">Category</label><input type="text" name="category" value={productData.category || ""} onChange={handleChange} className="w-full border border-gray-300 rounded-md p-2" required /></div>
        <div className="mb-6"><label className="block font-semibold mb-2">Brand</label><input type="text" name="brand" value={productData.brand || ""} onChange={handleChange} className="w-full border border-gray-300 rounded-md p-2" required /></div>
        
        <div className="mb-6">
          <label className="block font-semibold mb-2">Gender</label>
          <select name="gender" value={productData.gender || ""} onChange={handleChange} className="w-full border border-gray-300 rounded-md p-2" required>
            <option value="">-- Chọn giới tính --</option>
            <option value="Men">Men</option>
            <option value="Women">Women</option>
            <option value="Unisex">Unisex</option>
          </select>
        </div>

        <div className="mb-6"><label className="block font-semibold mb-2">Count in Stock</label><input type="number" name="countInStock" value={productData.countInStock || 0} onChange={handleChange} className="w-full border border-gray-300 rounded-md p-2" /></div>
        <div className="mb-6"><label className="block font-semibold mb-2">SKU</label><input type="text" name="sku" value={productData.sku || ""} onChange={handleChange} className="w-full border border-gray-300 rounded-md p-2" /></div>
        
        <div className="mb-6"><label className="block font-semibold mb-2">Sizes (phân cách bằng dấu phẩy)</label><input type="text" name="sizes" value={productData.sizes ? productData.sizes.join(", ") : ""} onChange={(e) => setProductData({...productData, sizes: e.target.value.split(",").map((size) => size.trim())})} className="w-full border border-gray-300 rounded-md p-2" /></div>
        <div className="mb-6"><label className="block font-semibold mb-2">Color (phân cách bằng dấu phẩy)</label><input type="text" name="color" value={productData.colors ? productData.colors.join(", ") : ""} onChange={(e) => setProductData({...productData, colors: e.target.value.split(",").map((color) => color.trim())})} className="w-full border border-gray-300 rounded-md p-2" /></div>

        {/* HÌNH ẢNH */}
        <div className="mb-6">
          <label className="block font-semibold mb-2">Product Images</label>
          <div className="p-4 border border-gray-200 rounded-md bg-gray-50 mb-4">
            <div className="mb-4">
              <span className="text-sm text-gray-600 block mb-2 font-medium">1. Tải lên từ máy tính:</span>
              <input type="file" onChange={handleImageUpload} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-all cursor-pointer" />
              {uploading && <p className="text-sm text-blue-500 mt-2 animate-pulse">Đang tải ảnh lên...</p>}
            </div>
            <div className="flex items-center my-3 text-gray-400 text-sm"><div className="flex-1 border-t border-gray-300"></div><span className="mx-4 uppercase text-xs font-bold">Hoặc</span><div className="flex-1 border-t border-gray-300"></div></div>
            <div>
              <span className="text-sm text-gray-600 block mb-2 font-medium">2. Dán link ảnh (URL):</span>
              <div className="flex gap-2">
                <input type="text" value={imageUrlInput} onChange={(e) => setImageUrlInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") handleAddImageUrl(e); }} placeholder="https://example.com/image.jpg" className="flex-1 border border-gray-300 rounded-md p-2 text-sm outline-none focus:ring-1 focus:ring-blue-500" />
                <button type="button" onClick={handleAddImageUrl} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm font-semibold whitespace-nowrap">Thêm Link</button>
              </div>
            </div>
          </div>
          <div className="flex gap-4 mt-4 flex-wrap">
            {productData.images && productData.images.map((img, index) => {
              return (
                <div key={index} className="relative group">
                  <img src={img.url} alt={img.altText || "Product image"} className="w-24 h-24 object-cover rounded-md shadow-sm border border-gray-200" />
                  <button type="button" className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition-all shadow-md opacity-0 group-hover:opacity-100" onClick={() => handleRemoveImage(index)} title="Xóa ảnh này">✕</button>
                </div>
              );
            })}
          </div>
        </div>

        {/* ========================================== */}
        {/* 👉 HIỂN THỊ MÃ QR THÔNG MINH (CÓ HOẶC CHƯA CÓ) */}
        {/* ========================================== */}
        {productData.qrCodeUrl ? (
          <div className="mb-8 p-6 bg-blue-50/50 border border-blue-100 rounded-xl flex flex-col sm:flex-row items-center gap-6 shadow-sm">
            <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-200 shrink-0">
              <img
                src={productData.qrCodeUrl}
                alt="QR Code"
                className="w-32 h-32 object-contain mix-blend-multiply"
              />
            </div>
            <div className="text-center sm:text-left flex-1">
              <h3 className="text-lg font-bold text-gray-900 mb-1">Mã QR Quản Lý Kho</h3>
              <p className="text-sm text-gray-600 mb-4">
                Dùng súng bắn mã hoặc camera điện thoại quét để truy xuất nhanh sản phẩm này.
              </p>
              <a
                href={productData.qrCodeUrl}
                target="_blank"
                rel="noreferrer"
                download={`QRCode_${productData.sku || productData._id}.png`} 
                className="inline-flex items-center gap-2 bg-white border border-gray-300 text-gray-700 font-bold py-2 px-4 rounded-lg hover:bg-gray-50 hover:text-blue-600 transition-colors text-sm shadow-sm cursor-pointer"
              >
                Tải ảnh QR về máy
              </a>
            </div>
          </div>
        ) : (
          <div className="mb-8 p-8 bg-yellow-50/50 border-2 border-dashed border-yellow-300 rounded-xl flex flex-col items-center justify-center text-center shadow-sm">
             <div className="w-16 h-16 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
             </div>
             <h3 className="text-xl font-bold text-gray-900 mb-2">Sản phẩm này chưa có Mã QR!</h3>
             <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto">
               Sản phẩm cũ chưa được hệ thống cấp mã định danh. Bấm nút bên dưới để khởi tạo bổ sung.
             </p>
             <button
                type="button"
                onClick={handleGenerateQR}
                disabled={generatingQR}
                className="bg-black text-white font-bold py-3 px-8 rounded-xl hover:bg-gray-800 transition-colors flex items-center gap-2 shadow-md disabled:bg-gray-400 cursor-pointer"
             >
                {generatingQR ? "Đang xử lý tạo mã..." : "Cấp Mã QR Mới"}
             </button>
          </div>
        )}

        {/* Nút Submit */}
        <button
          type="submit"
          className="w-full bg-green-500 text-white py-4 rounded-md font-bold text-lg hover:bg-green-600 transition-all duration-300 ease-in-out shadow-md mt-4 uppercase">
          Cập nhật sản phẩm
        </button>

      </form>
    </div>
  );
}

export default EditProductPage;