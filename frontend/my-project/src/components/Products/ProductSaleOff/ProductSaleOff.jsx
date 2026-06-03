import { useState, useEffect } from "react"; // Thêm useState
import { Link } from "react-router-dom";
import CountTime from "./CountTime";
import { useDispatch, useSelector } from "react-redux";
import { fetchProductsbyFilter } from "@redux/slices/productsSlice";
import { fetchUserOrder } from "@redux/slices/orderSlice";

function ProductSaleOff() {
  const dispatch = useDispatch();
  const { products, loading, error } = useSelector((state) => state.products);
  const { orders } = useSelector((state) => state.orders); 

  // 1. State quản lý số lượng hiển thị (mặc định 8)
  const [visibleCount, setVisibleCount] = useState(8);

  useEffect(() => {
    dispatch(fetchProductsbyFilter());
    dispatch(fetchUserOrder());
  }, [dispatch]); 

  // --- LOGIC TÍNH TOÁN SALE (Giữ nguyên của fen) ---
  let userDiscount = 0; 
  if (!orders || orders.length === 0) {
    userDiscount = 10; 
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
      if (diffInDays >= 1) userDiscount = 10; 
    }
  }

  const sortedBySold = [...products].sort((a, b) => (a.sold || 0) - (b.sold || 0));
  const bottom10Ids = sortedBySold.slice(0, 10).map(p => p._id);

  const processedProducts = products.map((product) => {
    let productDiscount = 0; 
    const isBottom10 = bottom10Ids.includes(product._id);
    const productAgeDays = (Date.now() - new Date(product.createdAt).getTime()) / (1000 * 60 * 60 * 24);

    if (isBottom10) {
      if (productAgeDays >= 2) productDiscount = 50; 
      else if (productAgeDays >= 10) productDiscount = 30;
    }

    const finalDiscountPercent = Math.max(productDiscount, userDiscount);
    return {
      ...product,
      finalDiscountPercent,
      salePrice: product.price - (product.price * finalDiscountPercent / 100)
    };
  });

  const productSale = processedProducts.filter(p => p.finalDiscountPercent > 0);

  // 2. Hàm xử lý khi bấm mũi tên "Xem tiếp"
  const handleLoadMore = () => {
    setVisibleCount(prev => prev + 8);
  };

  // 3. Cắt danh sách sản phẩm sale theo số lượng visibleCount
  const visibleSaleProducts = productSale.slice(0, visibleCount);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <p className="text-white text-xl font-light tracking-[0.2em] animate-pulse">ĐANG TÌM DEAL HỜI...</p>
    </div>
  );
  
  if (error) return <p className="text-center text-red-500 mt-10">Lỗi: {error}</p>;

  return productSale && productSale.length > 0 ? ( 
    <section className="relative w-full min-h-screen flex flex-col items-center overflow-hidden">
      <img
        src="./src/assets/image/background/backgroundRegister.jpeg.webp"
        alt="Sale Background"
        className="absolute inset-0 w-full h-full object-cover z-0"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-black/90 z-0"></div>
      
      <div className="relative z-10 w-full max-w-7xl flex flex-col items-center px-4 py-16">
        
        {/* Banner Voucher Glassmorphism */}
        {userDiscount === 10 && (
           <div className="w-full max-w-3xl mb-8 overflow-hidden rounded-2xl p-[1px] bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 shadow-2xl">
              <div className="bg-black/30 backdrop-blur-2xl text-white text-center py-4 rounded-2xl font-bold text-lg italic">
                🔥 SPECIAL GIFT: Tặng riêng bạn Voucher giảm thêm 10% tại giỏ hàng!
              </div>
           </div>
        )}

        <div className="mb-16 w-full"> 
            <CountTime />
        </div>
        
        {/* Grid sản phẩm Sale */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {visibleSaleProducts.map((product) => {
            const hasSecondImage = product.images && product.images.length > 1;

            return (
              <div 
                  key={product._id} 
                  className="group relative bg-white/5 backdrop-blur-xl rounded-[2rem] p-4 border border-white/10 shadow-2xl transition-all duration-500 hover:bg-white/15 hover:-translate-y-3"
              >
                {/* Badge giảm giá */}
                <div className="absolute top-6 left-6 z-30 bg-red-600 text-white text-[11px] font-black px-3 py-1 rounded-full shadow-lg">
                  -{product.finalDiscountPercent}%
                </div>

                <div className="relative aspect-[3/4] w-full overflow-hidden rounded-[1.5rem] bg-black/20">
                  <Link to={`/product/${product._id}`} className="block w-full h-full">
                    <img 
                      src={product?.images[0]?.url} 
                      alt={product.name} 
                      className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 group-hover:scale-110 ${
                        hasSecondImage ? "group-hover:opacity-0" : ""
                      }`} 
                    />
                    {hasSecondImage && (
                      <img
                        src={product.images[1]?.url}
                        alt={product.name}
                        className="absolute inset-0 w-full h-full object-cover opacity-0 transition-all duration-700 group-hover:opacity-100 group-hover:scale-110"
                      />
                    )}
                  </Link>
                </div>

                <div className="mt-6 flex flex-col items-center">
                  <h4 className="text-white text-sm font-light tracking-wide truncate w-full text-center opacity-80">
                      {product.name}
                  </h4>
                  
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xl font-bold text-white">
                      {new Intl.NumberFormat("vi-VN", {style : 'currency', currency : "VND" }).format(product.salePrice)}
                    </span>
                    <span className="text-xs text-white/30 line-through">
                      {new Intl.NumberFormat("vi-VN", {style : 'currency', currency : "VND" }).format(product.price)}
                    </span>
                  </div>
                  
                  <Link 
                    to={`/product/${product._id}`}
                    className="mt-6 w-full py-3 rounded-2xl bg-white text-black font-bold text-[10px] tracking-[0.2em] hover:bg-red-600 hover:text-white transition-all duration-300 text-center"
                  >
                    SHOP NOW
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* 4. Nút mũi tên XEM TIẾP (Liquid Glass) */}
        {visibleCount < productSale.length && (
          <div className="flex justify-center mt-20 group/loadmore">
            <button
              onClick={handleLoadMore}
              className="
                relative w-16 h-16 flex items-center justify-center rounded-full 
                bg-white/10 backdrop-blur-2xl border border-white/20 shadow-2xl
                transition-all duration-500 ease-in-out cursor-pointer
                group-hover/loadmore:scale-110 group-hover/loadmore:bg-white/20
                active:scale-90
              "
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                className="w-8 h-8 text-white transition-transform duration-500 group-hover/loadmore:translate-y-1"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
              
              {/* Hiệu ứng tia sáng mờ bao quanh nút */}
              <div className="absolute inset-0 rounded-full bg-white/5 blur-xl opacity-0 group-hover/loadmore:opacity-100 transition-opacity" />
            </button>
          </div>
        )}
      </div>
    </section>
  ) : (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-xl font-light text-gray-400 tracking-widest uppercase">Chưa có sản phẩm Sale nào!</p>
    </div>
  );
}

export default ProductSaleOff;