import Banner from "@pages/HomePage/Banner/Banner";
import GenderCollection from "@components/Products/GenderCollection/GenderCollection";
import NewArrivals from "@components/Products/NewArrivals/NewArrivals.jsx";
import ProductBestSeller from "@components/Products/ProductBestSeller/ProductBestSeller.jsx";
import ProductAlsoLike from "@components/Products/ProductAlsoLike/ProductAlsoLike.jsx";
import TopWearWomen from "@components/Products/TopWearWomen/TopWearWomen.jsx";
import FeatureCollection from "@components/Products/FeatureCollection/FeatureCollection";
import FeatureSection from "@components/Products/FeatureSection/FeatureSection";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState } from "react";
import { fetchProductsbyFilter } from "@redux/slices/productsSlice";
import ProductSaleOff from "@components/Products/ProductSaleOff/ProductSaleOff";
import PageTransition from '@components/PageTransition/PageTransition';
import api from "../../api/axiosClients";

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
    <PageTransition >

    <div>
      <Banner />
      <GenderCollection />
      <NewArrivals />
      <h2 className="text-3xl text-center font-bold mb-4"> Product Best Seller </h2>
      {bestSellerProduct ? (<ProductBestSeller productId = {bestSellerProduct._id} /> ) : (
        <p className="text-center ">Loading best seller product...  </p>
      ) }
      
      <ProductAlsoLike products ={products} loading = {loading } error = {error} />
      <TopWearWomen />
      <ProductSaleOff />
      <FeatureCollection />
      <FeatureSection />
    </div>
      </PageTransition>
  );
}

export default HomePage;
