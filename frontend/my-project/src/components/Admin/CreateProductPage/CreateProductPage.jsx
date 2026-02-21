import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { createProduct } from "@redux/slices/adminProductSlice";
import api from "../../../api/axiosClients";

function CreateProductPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
   const { loading, error } = useSelector(
    (state) => state.products,
  );
  const [uploading, setUploading] = useState(false);

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


  const handleChange = (e) => {
    const { name, value } = e.target;
    setProductData((prev) => ({
      ...prev,
      [name]: value,
    }));
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

  const handleRemoveImage = (indexImage) => {
    setProductData((prev) => ({
      ...prev,
      images: prev.images.filter((_, index) => index !== indexImage),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(createProduct(productData));
    navigate("/admin/products");
  };

  if (loading) return <p className="text-center">Loading ... </p>;
  if (error) return <p className="text-center">Error : {error} </p>;

  return (
    <div className="max-w-5xl mx-auto p-6 shadow-md rounded-md">
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
            type="number"
            name="price"
            value={productData.price}
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
          </select>
        </div>
        {/* stack  */}
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
          <label className="block font-semibold mb-2">Sizes</label>
          <input
            type="text"
            name="sizes"
            value={productData.sizes.join(",")}
            onChange={(e) =>
              setProductData({
                ...productData,
                sizes: e.target.value.split(",").map((size) => {
                  return size.trim();
                }),
              })
            }
            className="w-full border border-gray-300 rounded-md p-2"
          />
        </div>

        {/* color  */}
        <div className="mb-6">
          <label className="block font-semibold mb-2">Color</label>
          <input
            type="text"
            name="color"
            value={productData.colors.join(",")}
            onChange={(e) =>
              setProductData({
                ...productData,
                colors: e.target.value.split(",").map((color) => {
                  return color.trim();
                }),
              })
            }
            className="w-full border border-gray-300 rounded-md p-2"
          />
        </div>

        {/* image */}
        <div className="mb-6 ">
          <label className=" block font-semibold mb-2 "> Upload Image</label>
          <input type="file" onChange={handleImageUpload} />
          {uploading && <p> uploading image ... </p>}
          <div className="flex gap-4 mt-4 flex-wrap ">
            {productData.images.map((img, index) => {
              return (
                <div key={index} className=" relative ">
                  <img
                    src={img.url}
                    alt={img.altText || "Product image"}
                    className="w-20 h-20 object-cover rounded-md shadow-md "
                  />
                  <button
                    className=" absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-amber-600 transistion-colors shadow-sm "
                    onClick={() => handleRemoveImage(index)}>
                    x
                  </button>
                </div>
              );
            })}
          </div>
        </div>
        <button
          type="submit"
          className="w-full bg-green-500 text-white py-2 rounded-md hover:bg-green-600 transition-all duration-300 ease-in-out ">
          Update Product
        </button>
      </form>
    </div>
  );
}

export default CreateProductPage;
