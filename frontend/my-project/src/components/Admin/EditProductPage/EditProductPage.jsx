import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { fetchProductDetails } from "@redux/slices/productsSlice";
import api from "../../../api/axiosClients";
import { updateProduct } from "@redux/slices/adminProductSlice";

function EditProductPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  const { selectedProduct, loading, error } = useSelector(
    (state) => state.products,
  );
  const [uploading, setUploading] = useState(false);
  
  // 👉 THÊM STATE ĐỂ LƯU CÁI LINK ẢNH DÁN VÀO
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

  const handleChange = (e) => {
   const { name, value } = e.target;

  // Nếu là input Price hoặc CountInStock thì mới xử lý lọc số
  if (name === "price" || name === "countInStock") {
    const rawValue = value.replace(/\D/g, ""); // Chỉ lấy số
    setProductData((prev) => ({
      ...prev,
      [name]: Number(rawValue),
    }));
  } else {
    // Các input còn lại (Name, Description, SKU, Category...) thì giữ nguyên giá trị gõ vào
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
        headers: {
          "Content-Type": "multipart/form-data",
        },
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

  // 👉 HÀM XỬ LÝ KHI BẤM NÚT "THÊM LINK"
  const handleAddImageUrl = (e) => {
    e.preventDefault(); // Ngăn form submit
    if (imageUrlInput.trim()) {
      setProductData((prev) => ({
        ...prev,
        images: [...prev.images, { url: imageUrlInput.trim(), altText: "" }],
      }));
      setImageUrlInput(""); // Clear ô input sau khi add xong
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
    dispatch(
      updateProduct({
        id,
        productData,
      }),
    );
    navigate("/admin/products");
  };

  if (loading) return <p className="text-center">Loading ... </p>;
  if (error) return <p className="text-center">Error : {error} </p>;

  return (
    <div className="max-w-5xl mx-auto p-6 shadow-md rounded-md bg-white">
      <h2 className="text-3xl font-bold mb-6 ">Edit Product</h2>
      <form onSubmit={handleSubmit}>
        {/* name  */}
        <div className="mb-6">
          <label className="block font-semibold mb-2">Product Name</label>
          <input
            type="text"
            name="name"
            value={productData.name}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md p-2  "
            required
          />
        </div>
        {/* description  */}
        <div className="mb-6">
          <label className="block font-semibold mb-2">Description</label>
          <textarea
            name="description"
            value={productData.description}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md p-2"
            rows={4}
            required
          />
        </div>
        {/* price  */}
        <div className="mb-6">
          <label className="block font-semibold mb-2">Price</label>
          <input
            type="text"
            name="price"
            value={new Intl.NumberFormat('vi-VN').format(productData.price || 0)}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md p-2"
          />
        </div>
        {/* Category */}
        <div className="mb-6">
          <label className="block font-semibold mb-2">Category</label>
          <input 
            type="text" 
            name="category" 
            value={productData.category} 
            onChange={handleChange} 
            className="w-full border border-gray-300 rounded-md p-2" 
            required 
          />
        </div>

        {/* Brand */}
        <div className="mb-6">
          <label className="block font-semibold mb-2">Brand</label>
          <input 
            type="text" 
            name="brand" 
            value={productData.brand} 
            onChange={handleChange} 
            className="w-full border border-gray-300 rounded-md p-2" 
            required 
          />
        </div>

        {/* Gender */}
        <div className="mb-6">
          <label className="block font-semibold mb-2">Gender</label>
          <select 
            name="gender" 
            value={productData.gender} 
            onChange={handleChange} 
            className="w-full border border-gray-300 rounded-md p-2" 
            required
          >
            <option value="">-- Chọn giới tính --</option>
            <option value="Men">Men</option>
            <option value="Women">Women</option>
            <option value="Unisex">Unisex</option>
          </select>
        </div>
        {/* countInStock  */}
        <div className="mb-6">
          <label className="block font-semibold mb-2">Count in Stock</label>
          <input
            type="number"
            name="countInStock"
            value={productData.countInStock}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md p-2"
          />
        </div>
        {/* sku  */}
        <div className="mb-6">
          <label className="block font-semibold mb-2">SKU</label>
          <input
            type="text"
            name="sku"
            value={productData.sku}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md p-2"
          />
        </div>
        {/* size  */}
        <div className="mb-6">
          <label className="block font-semibold mb-2">Sizes (phân cách bằng dấu phẩy)</label>
          <input
            type="text"
            name="sizes"
            value={productData.sizes.join(", ")}
            onChange={(e) =>
              setProductData({
                ...productData,
                sizes: e.target.value.split(",").map((size) => size.trim()),
              })
            }
            className="w-full border border-gray-300 rounded-md p-2"
          />
        </div>

        {/* color  */}
        <div className="mb-6">
          <label className="block font-semibold mb-2">Color (phân cách bằng dấu phẩy)</label>
          <input
            type="text"
            name="color"
            value={productData.colors.join(", ")}
            onChange={(e) =>
              setProductData({
                ...productData,
                colors: e.target.value.split(",").map((color) => color.trim()),
              })
            }
            className="w-full border border-gray-300 rounded-md p-2"
          />
        </div>

        {/* ========================================== */}
        {/* 👉 KHU VỰC CẬP NHẬT: UPLOAD HÌNH ẢNH */}
        {/* ========================================== */}
        <div className="mb-6">
          <label className="block font-semibold mb-2">Product Images</label>
          
          <div className="p-4 border border-gray-200 rounded-md bg-gray-50 mb-4">
            {/* 1. Tải lên từ máy */}
            <div className="mb-4">
              <span className="text-sm text-gray-600 block mb-2 font-medium">1. Tải lên từ máy tính:</span>
              <input 
                type="file" 
                onChange={handleImageUpload} 
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-all cursor-pointer"
              />
              {uploading && <p className="text-sm text-blue-500 mt-2 animate-pulse">Đang tải ảnh lên...</p>}
            </div>

            <div className="flex items-center my-3 text-gray-400 text-sm">
              <div className="flex-1 border-t border-gray-300"></div>
              <span className="mx-4 uppercase text-xs font-bold">Hoặc</span>
              <div className="flex-1 border-t border-gray-300"></div>
            </div>

            {/* 2. Dán link URL */}
            <div>
              <span className="text-sm text-gray-600 block mb-2 font-medium">2. Dán link ảnh (URL):</span>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="flex-1 border border-gray-300 rounded-md p-2 text-sm outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  type="button" 
                  onClick={handleAddImageUrl}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm font-semibold whitespace-nowrap"
                >
                  Thêm Link
                </button>
              </div>
            </div>
          </div>

          {/* Hiển thị danh sách ảnh đang có */}
          <div className="flex gap-4 mt-4 flex-wrap">
            {productData.images.map((img, index) => {
              return (
                <div key={index} className="relative group">
                  <img
                    src={img.url}
                    alt={img.altText || "Product image"}
                    className="w-24 h-24 object-cover rounded-md shadow-sm border border-gray-200"
                  />
                  <button
                    type="button" // 👉 Fix quan trọng: Ngăn nút này submit form
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition-all shadow-md opacity-0 group-hover:opacity-100"
                    onClick={() => handleRemoveImage(index)}
                    title="Xóa ảnh này"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-green-500 text-white py-3 rounded-md font-bold text-lg hover:bg-green-600 transition-all duration-300 ease-in-out shadow-md mt-4">
          Cập nhật sản phẩm
        </button>
      </form>
    </div>
  );
}

export default EditProductPage;