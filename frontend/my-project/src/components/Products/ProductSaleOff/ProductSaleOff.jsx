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
  // Copy mảng để không làm hỏng state, sắp xếp tăng dần theo lượt mua (sold)
  // (Nếu fen chưa có trường 'sold' trong DB, nó sẽ hiểu là 0)
  const sortedBySold = [...products].sort((a, b) => (a.sold || 0) - (b.sold || 0));
  
  // Lấy 10 đứa đầu tiên (ế nhất) và lưu lại ID của tụi nó để dễ tra cứu
  const bottom10Products = sortedBySold.slice(0, 10);
  const bottom10Ids = bottom10Products.map(p => p._id);

  // ==========================================
  // 🚀 3. TÍNH % SALE & LỌC SẢN PHẨM HIỂN THỊ
  // ==========================================
  const processedProducts = products.map((product) => {
    let productDiscount = 0; 
    
    // Kiểm tra xem sản phẩm này có nằm trong TOP 10 Ế NHẤT không?
    const isBottom10 = bottom10Ids.includes(product._id);
    
    // Tính tuổi đời sản phẩm (Từ lúc THÊM VÀO `createdAt` đến HIỆN TẠI)
    const productAgeDays = (Date.now() - new Date(product.createdAt).getTime()) / (1000 * 60 * 60 * 24);

    // CHỈ XÉT SALE KHI SẢN PHẨM NẰM TRONG TOP 10 Ế
    if (isBottom10) {
      if (productAgeDays >= 2) {
        // Thêm được 20 ngày (10 ngày đầu + 10 ngày sau) mà vẫn ế -> 50%
        productDiscount = 50; 
      } else if (productAgeDays >= 10) {
        // Thêm được 10 ngày mà lọt top ế -> 30%
        productDiscount = 30;
      }
    }

    // CHỐT DEAL: Lấy mức ưu đãi tốt nhất cho khách
    const finalDiscountPercent = Math.max(productDiscount, userDiscount);

    return {
      ...product,
      finalDiscountPercent,
      salePrice: product.price - (product.price * finalDiscountPercent / 100)
    };
  });

  // Chỉ hiện những món CÓ GIẢM GIÁ
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
          
          {productSale.map((product) => (
            <div 
                key={product._id} 
                className="bg-white rounded-2xl shadow-2xl p-4 w-full max-w-[320px] transform transition-all hover:-translate-y-2 border border-gray-100"
            >
              <div className="relative">
                {/* HIỂN THỊ CHÍNH XÁC % ĐANG ĐƯỢC SALE */}
                <span className="absolute top-2 left-2 bg-red-600 text-white text-xs font-black px-3 py-1 rounded-full shadow-md z-10">
                  Sale {product.finalDiscountPercent}%
                </span>
                
                <div className="w-full h-52 bg-gray-100 rounded-xl overflow-hidden">
                    <img src={product?.images[0]?.url} alt={product.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                </div>
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
          ))}
          
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