import Banner from "@pages/HomePage/Banner/Banner";
import GenderCollection from "@components/Products/GenderCollection/GenderCollection";
import NewArrivals from "@components/Products/NewArrivals/NewArrivals.jsx";
import ProductBestSeller from "@components/Products/ProductBestSeller/ProductBestSeller.jsx";
import ProductAlsoLike from "@components/Products/ProductAlsoLike/ProductAlsoLike.jsx";
import FeatureCollection from "@components/Products/FeatureCollection/FeatureCollection";
import FeatureSection from "@components/Products/FeatureSection/FeatureSection";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState } from "react";
import { fetchProductsbyFilter } from "@redux/slices/productsSlice";
import ProductSaleOff from "@components/Products/ProductSaleOff/ProductSaleOff";
import PageTransition from '@components/PageTransition/PageTransition';
import api from "../../api/axiosClients";
import ButtonBackTop from "@components/Common/Button/ButtonBackTop";
import ChatWidget from "@components/Common/ChatWidget/ChatWidget";

import FadeUp from "@components/PageTransition/FadeUp.jsx"; 
import Globe from "@components/Common/Globe/Globe.jsx"; 

function HomePage() {
  const dispatch = useDispatch();
  const { products, loading, error } = useSelector((state) => state.products);
  const [ bestSellerProduct, setBestSellerProduct ] = useState(null);

  useEffect(() => {
    dispatch(
      fetchProductsbyFilter({
        gender: "Men",
        category: "Bottom wear",
        limit: 8,
      }),
    );
    // fetch best seller product
    const fetchBestSellerProduct = async () => {
      try {
        const response = await api.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/products/best-seller`,
        );

        setBestSellerProduct(response.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchBestSellerProduct();
  }, [dispatch]);

  return (
    <>
      <PageTransition>
        <div>
          <Banner />

          <FadeUp>
            <GenderCollection />
          </FadeUp>

          <FadeUp>
            <NewArrivals />
          </FadeUp>

          <FadeUp>
            <h2 className="text-3xl text-center font-bold mb-4 mt-12"> Product Best Seller </h2>
            {bestSellerProduct ? (
              <ProductBestSeller productId={bestSellerProduct._id} /> 
            ) : (
              <p className="text-center">Loading best seller product... </p>
            )}
          </FadeUp>
          
          <FadeUp>
            <ProductAlsoLike products={products} loading={loading} error={error} />
          </FadeUp>
         
          <FadeUp>
            <ProductSaleOff />
          </FadeUp>

          <FadeUp>
            <FeatureCollection />
          </FadeUp>

          <FadeUp>
          <div className="text-white py-20 mt-16 rounded-3xl mx-4 lg:mx-10 shadow-2xs overflow-hidden relative">
  <div className="relative z-10 px-4">
    
    {/* Cụm Text: Giữ nguyên max-w-2xl để chữ không bị dàn trải quá dài, dễ đọc */}
    <div className="max-w-2xl mx-auto text-center">
      <h2 className="text-4xl md:text-5xl font-extrabold mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-500">
        Giao Hàng Toàn Quốc
      </h2>
      <p className="text-gray-400 text-lg md:text-xl mb-10">
        Dù bạn ở bất kỳ đâu trên thế giới, sản phẩm của chúng tôi luôn sẵn sàng đồng hành cùng bạn với tốc độ nhanh nhất.
      </p>
    </div>
    
    {/* Cụm Quả địa cầu: Mở rộng size bằng max-w-5xl (1024px) hoặc max-w-6xl (1152px) */}
    <div className="relative -mt-10 md:-mt-20 max-w-6xl mx-auto flex justify-center">
      <Globe />
    </div>

  </div>
</div>
          </FadeUp>

          <FadeUp>
            <FeatureSection />
          </FadeUp>
        </div>
      </PageTransition>

      <ButtonBackTop />
      <ChatWidget />
    </>
  );
}

export default HomePage;