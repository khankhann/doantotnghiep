import { Link } from "react-router-dom";
import CountTime from "./CountTime";
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import { fetchProductsbyFilter } from "@redux/slices/productsSlice";
import { fetchUserOrder } from "../../../redux/slices/orderSlice";

function ProductSaleOff() {
  const dispatch = useDispatch();
   
  const { products, loading, error } = useSelector((state) => state.products);
  const { orders } = useSelector((state) => state.orders); 

  useEffect(() => {
    dispatch(fetchProductsbyFilter());
    dispatch(fetchUserOrder());
  }, [dispatch]); 

  // ==========================================
  // 🚀 1. LOGIC TẶNG 10% CHO KHÁCH (MỚI / LẶN 15 NGÀY)
  // ==========================================
  let userDiscount = 0; 

  if (!orders || orders.length === 0) {
    userDiscount = 10; // Khách mới tinh
  } else {
    let latestActivityTime = 0;
    orders.forEach((order) => {
      const createdTime = new Date(order.createdAt).getTime();
      const paidTime = order.isPaid && order.paidAt ? new Date(order.paidAt).getTime() : 0;
      const maxTime = Math.max(createdTime, paidTime);
      if (maxTime > latestActivityTime) latestActivityTime = maxTime;
    });

    if (latestActivityTime > 0) {
      const diffInDays = (Date.now() - latestActivityTime) / (1000 * 60 * 60 * 24);
      if (diffInDays >= 1) {
        userDiscount = 10; // Khách cũ lặn 15 ngày
      }
    }
  }

  // ==========================================
  // 🚀 2. TÌM 10 SẢN PHẨM "Ế NHẤT" (Lượt mua thấp nhất)
  // ==========================================
  const sortedBySold = [...products].sort((a, b) => (a.sold || 0) - (b.sold || 0));
  
  const bottom10Products = sortedBySold.slice(0, 10);
  const bottom10Ids = bottom10Products.map(p => p._id);

  // ==========================================
  // 🚀 3. TÍNH % SALE & LỌC SẢN PHẨM HIỂN THỊ
  // ==========================================
  const processedProducts = products.map((product) => {
    let productDiscount = 0; 
    
    const isBottom10 = bottom10Ids.includes(product._id);
    
    const productAgeDays = (Date.now() - new Date(product.createdAt).getTime()) / (1000 * 60 * 60 * 24);

    if (isBottom10) {
      if (productAgeDays >= 2) {
        productDiscount = 50; 
      } else if (productAgeDays >= 10) {
        productDiscount = 30;
      }
    }

    const finalDiscountPercent = Math.max(productDiscount, userDiscount);

    return {
      ...product,
      finalDiscountPercent,
      salePrice: product.price - (product.price * finalDiscountPercent / 100)
    };
  });

  const productSale = processedProducts.filter(p => p.finalDiscountPercent > 0);

  if (loading) return <p className="text-center font-bold mt-10"> Đang săn sale... </p>;
  if (error) return <p className="text-center text-red-500 mt-10"> Lỗi kết nối: {error} </p>;

  return productSale && productSale.length > 0 ? ( 
    <section className="relative w-full min-h-screen flex flex-col items-center justify-center">
      <img
        src="./src/assets/image/background/backgroundRegister.jpeg.webp"
        alt="Sale Background"
        className="absolute inset-0 w-full h-full object-cover object-center z-0"
      />
      <div className="absolute inset-0 bg-black/60 z-0"></div>
      
      <div className="relative z-10 w-full max-w-7xl flex flex-col items-center px-4 py-16 sm:py-24">
        
        {/* BANNER DÀNH CHO KHÁCH MỚI HOẶC WIN-BACK */}
        {userDiscount === 10 && (
           <div className="w-full bg-gradient-to-r from-red-600 to-pink-500 text-white text-center py-3 rounded-xl font-bold text-lg mb-6 animate-pulse shadow-lg border-2 border-white/20">
              🎉 Ưu đãi độc quyền: Tặng bạn Voucher giảm giá TOÀN BỘ CỬA HÀNG!
           </div>
        )}

        <div className="mb-12 w-full"> 
            <CountTime />
        </div>
        
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 justify-items-center">
          
          {productSale.map((product) => {
            // 👉 KIỂM TRA XEM CÓ HÌNH 2 KHÔNG
            const hasSecondImage = product.images && product.images.length > 1;

            return (
              <div 
                  key={product._id} 
                  className="bg-white rounded-2xl shadow-2xl p-4 w-full max-w-[320px] transform transition-all hover:-translate-y-2 border border-gray-100"
              >
                <div className="relative">
                  {/* HIỂN THỊ CHÍNH XÁC % ĐANG ĐƯỢC SALE */}
                  <span className="absolute top-2 left-2 bg-red-600 text-white text-xs font-black px-3 py-1 rounded-full shadow-md z-20">
                    Sale {product.finalDiscountPercent}%
                  </span>
                  
                  {/* 👉 KHU VỰC HÌNH ẢNH: Thêm group và relative để hover */}
                  <Link 
                    to={`/product/${product._id}`} 
                    className="block w-full h-52 bg-gray-100 rounded-xl overflow-hidden relative group"
                  >
                    {/* HÌNH 1: Vừa zoom (scale-110) vừa mờ đi (opacity-0) khi hover */}
                    <img 
                      src={product?.images[0]?.url} 
                      alt={product.name} 
                      className={`absolute top-0 left-0 w-full h-full object-cover transition-all duration-500 ease-in-out group-hover:scale-110 ${
                        hasSecondImage ? "group-hover:opacity-0" : ""
                      }`} 
                    />
                    
                    {/* HÌNH 2: Vừa zoom (scale-110) vừa hiện lên (opacity-100) khi hover */}
                    {hasSecondImage && (
                      <img
                        src={product.images[1]?.url}
                        alt={product.name}
                        className="absolute top-0 left-0 w-full h-full object-cover opacity-0 transition-all duration-500 ease-in-out group-hover:opacity-100 group-hover:scale-110"
                      />
                    )}
                  </Link>
                </div>

                <div className="mt-4 text-center">
                  <h4 className="text-base font-bold text-gray-800 truncate" title={product.name}>
                      {product.name}
                  </h4>
                  
                  <div className="flex justify-center items-end gap-2 mt-2">
                    <span className="text-xl font-black text-red-600">${product.salePrice.toFixed(2)}</span>
                    <span className="text-sm font-medium text-gray-400 line-through mb-0.5">${product.price.toFixed(2)}</span>
                  </div>
                  
                  <Link 
                    to={`/product/${product._id}`}
                    className="mt-4 w-full block text-center bg-gray-900 text-white font-bold py-2.5 rounded-xl hover:bg-red-600 transition-colors shadow-md text-sm"
                  >
                    Mua ngay kẻo lỡ
                  </Link>
                </div>
              </div>
            );
          })}
          
        </div>
      </div>
    </section>
  ) : (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-xl font-medium text-gray-500">Hiện tại chưa có chương trình Sale nào cả!</p>
    </div>
  );
}

export default ProductSaleOff;