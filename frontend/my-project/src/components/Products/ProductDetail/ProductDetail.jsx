import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useLocation, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchProductDetails,
  fetchSimilarProducts,
} from "@redux/slices/productsSlice.js";
import { addToCart } from "@redux/slices/cartSlice.js";
import ProductReview from "../../../pages/ProductReview/ProductReview";

function ProductDetail({ productId }) {
  const { id } = useParams();
  const dispatch = useDispatch();
  const location = useLocation();
  const { selectedProduct, loading, error } = useSelector(
    (state) => state.products,
  );
  const { user, guestId } = useSelector((state) => state.auth);

  const [mainImage, setMainImage] = useState("");
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedColor, setSelectedColor] = useState("");
  const [quantity, setQuantity] = useState(1);
  const productFetchId = productId || id;

  useEffect(() => {
    if (productFetchId) {
      dispatch(fetchProductDetails(productFetchId));
      dispatch(fetchSimilarProducts({ id: productFetchId }));
    }
  }, [dispatch, productFetchId]);

  useEffect(() => {
    if (selectedProduct?.images?.length > 0) {
      setMainImage(selectedProduct.images[0].url);
    }
  }, [selectedProduct]);

  const colorAttr = selectedProduct?.attributes?.find(
    (a) => a.name.toLowerCase() === "color",
  );
  const availableColors = colorAttr
    ? colorAttr.value.split(",").map((c) => c.trim())
    : [];

  const handleAddToCart = () => {
    if (!selectedVariant) return toast.error("Chọn phân loại trước nhé!");
    dispatch(
      addToCart({
        productId: productFetchId,
        quantity,
        variantName: selectedVariant.variantName,
        guestId,
        userId: user?._id,
      }),
    ).then(() => toast.success("Đã thêm vào giỏ!"));
  };

  if (loading)
    return (
      <div className="text-center py-20 font-light text-gray-400">
        Loading...
      </div>
    );
  if (!selectedProduct) return null;

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
        {/* Left Side: Images */}
        <div className="lg:col-span-7 space-y-4">
          {/* Ảnh đã fix: max-h-[550px] giúp ảnh không bị quá cao */}
          <img
            src={mainImage}
            className="w-full max-h-[550px] object-cover bg-gray-50 shadow-sm"
            alt="Main"
          />
          <div className="grid grid-cols-4 gap-4">
            {selectedProduct?.images?.map((img, i) => (
              <img
                key={i}
                src={img.url}
                className={`cursor-pointer hover:opacity-75 transition-opacity aspect-square object-cover ${mainImage === img.url ? "ring-2 ring-black ring-offset-2" : ""}`}
                onClick={() => setMainImage(img.url)}
              />
            ))}
          </div>
        </div>

        {/* Right Side: Info */}
        <div className="lg:col-span-5 sticky top-24">
          <h1 className="text-4xl font-serif text-gray-900 mb-2">
            {selectedProduct.name}
          </h1>
          <p className="text-2xl font-light text-gray-600 mb-8">
            {new Intl.NumberFormat("vi-VN", {
              style: "currency",
              currency: "VND",
            }).format(selectedProduct.price)}
          </p>

          <p className="text-gray-500 mb-10 leading-relaxed font-light text-lg">
            {selectedProduct.description}
          </p>

          {availableColors.length > 0 && (
            <div className="mb-8">
              <span className="text-xs uppercase tracking-widest text-gray-400 mb-3 block">
                Color
              </span>
              <div className="flex gap-4">
                {availableColors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`w-8 h-8 rounded-full transition-transform ${selectedColor === color ? "ring-2 ring-black ring-offset-4 scale-110" : ""}`}
                    style={{ backgroundColor: color.toLowerCase() }}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="mb-10">
            <span className="text-xs uppercase tracking-widest text-gray-400 mb-3 block">
              Size / Variant
            </span>
            <div className="grid grid-cols-2 gap-3">
              {selectedProduct.variants?.map((v, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedVariant(v)}
                  className={`py-3 text-sm border-b transition-all ${selectedVariant?.variantName === v.variantName ? "border-black font-medium" : "border-gray-200 text-gray-500 hover:border-gray-400"}`}>
                  {v.variantName} {v.stock === 0 ? "— Sold out" : ""}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleAddToCart}
            className="w-full bg-black text-white py-4 tracking-widest hover:bg-gray-900 transition-colors uppercase text-sm font-medium">
            Add to basket
          </button>

          <div className="mt-12 border-t border-gray-100 pt-8">
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div className="text-gray-400">Brand</div>
              <div className="font-medium">{selectedProduct.brand}</div>
              {selectedProduct.attributes?.map((a, i) => (
                <div key={i} className="contents">
                  <div className="text-gray-400 capitalize">{a.name}</div>
                  <div className="font-medium">{a.value}</div>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
      <section id="review-section" className="bg-white p-8 rounded-lg mt-8">
        <ProductReview
          productId={selectedProduct._id}
          reviews={selectedProduct.reviews}
        />
      </section>
    </div>
  );
}

export default ProductDetail;
