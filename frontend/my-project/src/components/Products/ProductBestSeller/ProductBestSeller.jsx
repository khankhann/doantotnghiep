import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchProductDetails } from "@redux/slices/productsSlice.js";
import { fetchSimilarProducts } from "@redux/slices/productsSlice.js";
import { addToCart } from "@redux/slices/cartSlice.js";

function ProductBestSeller({ productId }) {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { selectedProduct, loading, error, similarProducts } = useSelector(
    (state) => state.products,
  );

  const { user, guestId } = useSelector((state) => state.auth);

  const [mainImage, setMainImage] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [disableButton, setDisableButton] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const productFetchId = productId || id;

  useEffect(() => {
    if (productFetchId) {
      dispatch(fetchProductDetails(productFetchId));
      dispatch(fetchSimilarProducts({ id: productFetchId }));
    }
  }, [dispatch, productFetchId]);

  useEffect(() => {
 if(selectedProduct){

   if (selectedProduct.images && selectedProduct.images.length > 0) {
     setMainImage(selectedProduct.images[0].url);
    }
  }
  }, [selectedProduct]);

  const handleSetMainImage = (imageUrl) => {
   setMainImage(imageUrl)
  };
  const handleSelectColor = (color) => {
    setSelectedColor((prev) => {
      const result = prev === color ? "" : color;
      return result;
    });
  };
  const handleSelectSize = (size) => {
    setSelectedSize((prev) => {
      const result = prev === size ? "" : size;
      return result;
    });
  };
  const handleSetQuantity = (action) => {
    if (action === "plus") {
      setQuantity((prev) => {
        const total = prev + 1;
        return total;
      });
    } else if (action === "sub" && quantity > 1) {
      setQuantity((prev) => {
        const total = prev - 1;
        return total;
      });
    }
  };
  const handleAddToCart = () => {
    if (!selectedSize || !selectedColor) {
      toast.error(
        `Please select a ${!selectedSize && !selectedColor ? "size and color " : selectedSize ? "color " : "size"} before adding to cart`,
        { duration: 1000 },
      );
      return;
    }
    setDisableButton(true);
    dispatch(
      addToCart({
        productId: productFetchId,
        quantity,
        size: selectedSize,
        color: selectedColor,
        guestId,
        userId: user?._id,
      }),
    )
      .then(() => {
        toast.success("Product added to cart", {
          duration: 1000,
        });
      })
      .finally(() => {
        setDisableButton(false);
      });
  };

  if (loading) {
    return <p className="text-center">Loading... </p>;
  } else if (error) {
    return <p className="text-center">Error : {error}... </p>;
  }
  if (!selectedProduct || selectedProduct.length === 0) {
    return <p className="text-center mt-10">Product not found</p>;
  }
console.log(selectedProduct, mainImage)
  return (
    selectedProduct && (
      <section className="max-w-6xl mx-auto bg-white p-8 rounded-lg">
        <h2 className=" text-3xl text-center font-bold mb-4 ">Best Seller</h2>
        <div className="flex flex-col md:flex-row">
          {/* left thumbnail */}
          <div className="hidden md:flex flex-col space-y-4 mr-6">
            {selectedProduct?.images.map((image, index) => {
              return (
                <img
                  key={index}
                  src={image.url}
                  alt={image.altText || `Thumbnail ${index}`}
                  className={` w-20 h-20 object-cover rounded-lg cursor-pointer border
            ${mainImage === image.url ? "border-black" : "border-gray-300"} `}
                  onClick={() => handleSetMainImage(image.url)}
                />
              );
            })}
          </div>
          {/* main image */}
          <div className=" md:w-1/2 ">
            <div className=" mb-4 ">
              <img
                src={mainImage}
                alt="Main Product"
                className=" w-full h-auto object-cover rounded-lg "
              />
            </div>
          </div>
          {/* modile thumbnail */}
          <div className=" md:hidden flex overscroll-x-scroll space-x-4 mb-4 ">
            {selectedProduct[0]?.images.map((image, index) => {
              return (
                <img
                  key={index}
                  src={image.url}
                  alt={image.altText || `Thumbnail ${index}`}
                  className={` w-20 h-20 object-cover rounded-lg cursor-pointer border ${
                    mainImage === image.url ? "border-black" : "text-gray-300"
                  } `}
                  onClick={() => handleSetMainImage(image.url)}
                />
              );
            })}
          </div>
          <div className="md:w-1/2 md:ml-10">
            <h1 className="text-2xl md:text-3xl font-semibold mb-2">
              {selectedProduct?.name}
            </h1>
            <p className="text-lg text-gray-600 mb-1 line-through">
              {selectedProduct?.price && `${selectedProduct.originalPrice}`}
            </p>
            <p className="text-xl text-gray-500 mb-2">
              {selectedProduct?.price}
            </p>
            <p className="text-gray-600 mb-4">{selectedProduct.description} </p>
            <div className="mb-4">
              <p className="text-gray-700 "> Color</p>
              <div className="flex gap-2 mt-2">
                {selectedProduct?.colors.map((color) => {
                  return (
                    <button
                      key={color}
                      onClick={() => handleSelectColor(color)}
                      className={`w-8 h-8 rounded-full border ${selectedColor === color ? "border-4 border-black " : "border-gray-300"}`}
                      style={{
                        backgroundColor: color.toLocaleUpperCase(),
                        filter: "brightness(1)",
                      }}>
                      {" "}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="mb-4">
              <p className="text-gray-700">Size </p>
              <div className="flex gap-2 mt-2 ">
                {selectedProduct?.sizes.map((size) => {
                  return (
                    <button
                      key={size}
                      className={`px-4 py-2 rounded border ${selectedSize === size ? "bg-black text-white " : " "} `}
                      onClick={() => handleSelectSize(size)}>
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="mb-6 ">
              <p className="text-gray-700 "> Quantity: </p>
              <div className="flex items-center space-x-4 mt-2">
                <button
                  className="px-2 py-1 bg-gray-200 rounded text-lg "
                  onClick={() => handleSetQuantity("sub")}>
                  -
                </button>
                <span className="text-lg "> {quantity} </span>
                <button
                  className="px-2 py-1 bg-gray-200 rounded text-lg "
                  onClick={() => handleSetQuantity("plus")}>
                  +
                </button>
              </div>
            </div>
            <button
              onClick={handleAddToCart}
              disabled={disableButton}
              className={` bg-black text-white py-2 px-6 rounded w-full mb-4 ${disableButton ? "cursor-not-allowed opacity-50" : "hover:bg-gray-900"}`}>
              {disableButton ? "ADDING... " : "ADD TO CART"}
            </button>
            <div className="mt-10 text-gray-700">
              <h3 className="text-xl font-bold mb-4 "> Charateristics: </h3>
              <table className="w-full text-left text-sm text-gray-600">
                <tbody>
                  <tr>
                    <td className="py-1 ">Brand</td>
                    <td className="py-1 ">{selectedProduct?.brand} </td>
                  </tr>
                  <tr>
                    <td className="py-1 ">Material</td>
                    <td className="py-1 ">{selectedProduct?.material} </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    )
  );
}

export default ProductBestSeller;
