import { Link } from "react-router-dom";

function ProductsGrid({ products, loading, error }) {
  if (loading) {
    return <p className="text-center">Loading... </p>;
  } else if (error) {
    return <p className="text-center">Error : {error}... </p>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 ">
      {products.map((product) => {
        // Kiểm tra xem sản phẩm có hình thứ 2 không
        const hasSecondImage = product.images && product.images.length > 1;

        return (
          // Thêm class "group" vào Link để bắt sự kiện hover cho các phần tử con
          <Link key={product._id} to={`/product/${product._id}`} className="block group">
            <div className="bg-white p-4 rounded-lg z-[20]">
              
              {/* Vùng chứa ảnh: Thêm relative để xếp ảnh đè lên nhau */}
              <div className="relative w-full z-20 h-96 mb-4 overflow-hidden rounded-lg">
                
                {/* HÌNH 1: Mặc định hiện. Nếu có hình 2 thì khi hover sẽ mờ đi (opacity-0) */}
                <img
                  src={product.images[0]?.url}
                  alt={product.images[0]?.altText || product.name}
                  className={`w-full h-full object-cover transition-opacity duration-500 ease-in-out ${
                    hasSecondImage ? "group-hover:opacity-0" : ""
                  }`}
                />

                {/* HÌNH 2: Mặc định ẩn (opacity-0). Khi hover sẽ hiện lên (opacity-100) */}
                {hasSecondImage && (
                  <img
                    src={product.images[1]?.url}
                    alt={product.images[1]?.altText || product.name}
                    className="absolute top-0 left-0 w-full h-full object-cover opacity-0 transition-opacity duration-500 ease-in-out group-hover:opacity-100"
                  />
                )}
                
              </div>

              <h3 className="text-sm mb-2"> {product.name} </h3>
              <p className="text-gray-500 font-medium text-sm tracking-tighter">
               
                {new Intl.NumberFormat("vi-VN", {style : 'currency', currency : "VND" }).format(product.price)}
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

export default ProductsGrid;