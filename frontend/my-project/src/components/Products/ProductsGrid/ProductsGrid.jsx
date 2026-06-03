import { useState } from "react";
import { Link } from "react-router-dom";

function ProductsGrid({ products, loading, error }) {
  // 1. Quản lý số lượng hiển thị, mặc định là 8
  const [visibleCount, setVisibleCount] = useState(8);

  if (loading) {
    return <p className="text-center py-20 text-gray-500 animate-pulse">Đang tải sản phẩm...</p>;
  } else if (error) {
    return <p className="text-center py-20 text-red-500 font-medium">Lỗi kết nối: {error}</p>;
  }

  // 2. Hàm xử lý khi bấm vào mũi tên "Xem thêm"
  const handleLoadMore = () => {
    setVisibleCount((prevCount) => prevCount + 8);
  };

  // 3. Cắt mảng sản phẩm theo số lượng hiện tại
  const visibleProducts = products.slice(0, visibleCount);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Grid sản phẩm */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {visibleProducts.map((product) => {
          const hasSecondImage = product.images && product.images.length > 1;

          return (
            <Link key={product._id} to={`/product/${product._id}`} className="group block">
              <div className="bg-white rounded-2xl transition-all duration-300">
                {/* Vùng chứa ảnh */}
                <div className="relative w-full h-[400px] mb-4 overflow-hidden rounded-xl bg-gray-100">
                  {/* Ảnh chính */}
                  <img
                    src={product.images[0]?.url}
                    alt={product.name}
                    className={`w-full h-full object-cover transition-all duration-700 ease-in-out transform group-hover:scale-105 ${
                      hasSecondImage ? "group-hover:opacity-0" : ""
                    }`}
                  />

                  {/* Ảnh thứ 2 (Hover) */}
                  {hasSecondImage && (
                    <img
                      src={product.images[1]?.url}
                      alt={product.name}
                      className="absolute top-0 left-0 w-full h-full object-cover opacity-0 transition-all duration-700 ease-in-out group-hover:opacity-100 transform group-hover:scale-105"
                    />
                  )}
                </div>

                {/* Thông tin sản phẩm */}
                <div className="space-y-1">
                  <h3 className="text-[15px] font-medium text-black tracking-tight group-hover:text-blue-600 transition-colors">
                    {product.name}
                  </h3>
                  <p className="text-gray-500 font-semibold text-sm">
                    {new Intl.NumberFormat("vi-VN", {
                      style: "currency",
                      currency: "VND",
                    }).format(product.price)}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* 4. Nút Load More: Mũi tên phong cách Liquid Glass */}
      {visibleCount < products.length && (
        <div className="flex justify-center mt-20 mb-10 group/btn">
          <button
            onClick={handleLoadMore}
            title="Xem thêm sản phẩm"
            className="
              /* Layout cơ bản */
              relative w-16 h-16 flex items-center justify-center rounded-full 
              transition-all duration-500 ease-in-out cursor-pointer outline-none

              /* Hiệu ứng Liquid Glass (Kính lỏng) */
              bg-white/10 
              backdrop-blur-xl 
              border border-white/40
              shadow-[0_4px_30px_rgba(0,0,0,0.05)]
              
              /* Hover Effects */
              hover:bg-white/30 
              hover:border-white/60 
              hover:shadow-[0_8px_32px_rgba(0,0,0,0.1)]
              active:scale-90
              group-hover/btn:translate-y-2
            "
          >
            {/* SVG Mũi tên Minimalist */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.2"
              stroke="currentColor"
              className="w-8 h-8 text-gray-800 transition-transform duration-500"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>

            {/* Hiệu ứng hào quang mờ bao quanh nút khi hover */}
            <div className="absolute inset-0 rounded-full bg-blue-400/5 blur-xl opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500" />
          </button>
        </div>
      )}
    </div>
  );
}

export default ProductsGrid;