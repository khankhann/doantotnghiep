import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import {
  deleteProduct,
  fetchAdminProducts,
} from "@redux/slices/adminProductSlice";
import { IoIosSearch } from "react-icons/io";
import { IoIosClose } from "react-icons/io";

function ProductManagement() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { products, loading, error } = useSelector(
    (state) => state.adminProducts,
  );
  const [searchItem, setSearchItem] = useState("");
  
  // 👇 STATE: Quản lý danh sách ID sản phẩm được tích chọn
  const [selectedIds, setSelectedIds] = useState([]);

  useEffect(() => {
    const delay = setTimeout(() => {
      dispatch(fetchAdminProducts({ search: searchItem }));
    }, 1000);
    return () => clearTimeout(delay);
  }, [dispatch, searchItem]);

  // 👇 HÀM: Xoá 1 sản phẩm
  const handleDelete = (productId) => {
    if (window.confirm("Are you sure you want to delete this Product?")) {
      dispatch(
        deleteProduct({
          id: productId,
        }),
      );
      // Xoá xong thì gỡ tick nếu nó đang được tick
      setSelectedIds((prev) => prev.filter((id) => id !== productId));
    }
  };

  // 👇 HÀM: Tick chọn 1 sản phẩm
  const handleToggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // 👇 HÀM: Tick chọn tất cả
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(products.map((p) => p._id));
    } else {
      setSelectedIds([]);
    }
  };

  // 👇 HÀM: Xoá hàng loạt sản phẩm đã chọn
  const handleDeleteSelected = () => {
    if (window.confirm(`Are you sure you want to delete ${selectedIds.length} selected products?`)) {
      // Gọi API xoá cho từng ID (Giống hệt cách fen setup ở Redux hiện tại)
      selectedIds.forEach((id) => dispatch(deleteProduct({ id })));
      setSelectedIds([]); // Xoá xong thì reset mảng
    }
  };

  // Kiểm tra xem đã tick chọn hết chưa
  const isAllSelected = products?.length > 0 && selectedIds.length === products.length;

  if (loading) return <p className="text-center p-10 font-medium text-gray-600">Loading ...</p>;
  if (error) return <p className="text-center p-10 text-red-500">Error: {error}</p>;

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 min-h-[60vh]">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h2 className="text-xl md:text-2xl font-bold text-gray-800">Product Management</h2>
        
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          
          {/* 👇 NÚT XOÁ HÀNG LOẠT (Chỉ hiện khi có tick chọn) */}
          {selectedIds.length > 0 && (
            <button
              onClick={handleDeleteSelected}
              className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-all duration-300 ease-in-out shadow-sm font-medium"
            >
              Delete ({selectedIds.length})
            </button>
          )}

          {/* Search bar */}
          <div className="relative w-full sm:w-64 flex-grow md:flex-grow-0">
            <input
              type="text"
              placeholder="Search item..."
              value={searchItem}
              onChange={(e) => setSearchItem(e.target.value)}
              className="pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 w-full shadow-sm"
            />
            {searchItem && (
              <button
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 transition-all cursor-pointer"
                onClick={() => setSearchItem("")}
              >
                <IoIosClose size={20} />
              </button>
            )}
            <div className="absolute left-3 top-2.5 text-gray-400">
              <IoIosSearch size={20} />
            </div>
          </div>

          <Link
            to="/admin/products/create"
            className="bg-green-500 text-center text-white px-4 py-2 rounded-md hover:bg-green-600 transition-all duration-300 ease-in-out shadow-sm whitespace-nowrap"
          >
            Add Product
          </Link>
        </div>
      </div>

      <div className="overflow-x-auto shadow-sm sm:rounded-xl border border-gray-200">
        <table className="w-full text-left text-sm text-gray-500 block md:table">
          <thead className="hidden md:table-header-group bg-gray-50 text-xs uppercase text-gray-700 border-b">
            <tr>
              {/* 👇 Cột Checkbox Tất cả */}
              <th className="py-3 px-4 w-12 text-center">
                {products?.length > 0 && (
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={handleSelectAll}
                    className="w-4 h-4 text-green-600 bg-white border-gray-300 rounded cursor-pointer"
                  />
                )}
              </th>
              <th className="py-3 px-4 w-64 font-semibold">Name</th>
              <th className="py-3 px-4 font-semibold">Price</th>
              <th className="py-3 px-4 font-semibold">SKU</th>
              <th className="py-3 px-4 font-semibold">Stock</th>
              <th className="py-3 px-4 font-semibold">Sold</th>
              <th className="py-3 px-4 font-semibold">Created By</th>
              <th className="py-3 px-4 font-semibold">Updated By</th>
              <th className="py-3 px-4 font-semibold">Created At</th>
              <th className="py-3 px-4 font-semibold text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {products?.length > 0 ? (
              products.map((product) => {
                const isChecked = selectedIds.includes(product._id);
                return (
                  <tr
                    key={product._id}
                    className={`block md:table-row bg-white hover:bg-gray-50 transition-all duration-200 ${
                      isChecked ? "bg-green-50/30" : ""
                    }`}
                  >
                    {/* 👇 Cột Checkbox Từng dòng */}
                    <td className="p-3 flex items-center justify-between md:table-cell border-b md:border-none md:text-center">
                      <span className="md:hidden font-semibold text-gray-700">Select:</span>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleSelect(product._id)}
                        className="w-4 h-4 text-green-600 bg-white border-gray-300 rounded cursor-pointer"
                      />
                    </td>

                    <td className="p-3 flex justify-between items-center md:table-cell border-b md:border-none font-medium text-gray-900">
                      <span className="md:hidden text-xs text-gray-400 uppercase">Name:</span>
                      <span className="truncate max-w-[200px]" title={product.name}>{product.name}</span>
                    </td>
                    <td className="p-3 flex justify-between items-center md:table-cell border-b md:border-none">
                      <span className="md:hidden text-xs text-gray-400 uppercase">Price:</span>
                      ${product.price}
                    </td>
                    <td className="p-3 flex justify-between items-center md:table-cell border-b md:border-none">
                      <span className="md:hidden text-xs text-gray-400 uppercase">SKU:</span>
                      {product.sku}
                    </td>
                    <td className="p-3 flex justify-between items-center md:table-cell border-b md:border-none">
                      <span className="md:hidden text-xs text-gray-400 uppercase">Stock:</span>
                      <span className={`font-bold ${product.countInStock < 10 ? 'text-red-500' : 'text-gray-700'}`}>
                        {product.countInStock}
                      </span>
                    </td>
                    <td className="p-3 flex justify-between items-center md:table-cell border-b md:border-none">
                      <span className="md:hidden text-xs text-gray-400 uppercase">Sold:</span>
                      {product.sold}
                    </td>
                    <td className="p-3 flex justify-between items-center md:table-cell border-b md:border-none">
                      <span className="md:hidden text-xs text-gray-400 uppercase">Created By:</span>
                      {product?.user ? (
                        <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border border-blue-100">
                          {product?.user?.name}
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="p-3 flex justify-between md:table-cell border-b md:border-none text-xs">
                       <span className="md:hidden text-gray-400 uppercase">Updated:</span>
                      {product?.lastEditByUser ? (
                        <div className="flex flex-col md:items-start items-end">
                          <span className="font-medium text-gray-700">{product.lastEditByUser.name}</span>
                          {product?.updatedAt && (
                            <span className="text-[10px] text-gray-400">
                              {new Date(product.updatedAt).toLocaleDateString("vi-VN")}
                            </span>
                          )}
                        </div>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="p-3 flex justify-between items-center md:table-cell border-b md:border-none text-xs">
                      <span className="md:hidden text-gray-400 uppercase">Created At:</span>
                      {product?.createdAt
                        ? new Date(product.createdAt).toLocaleDateString("vi-VN")
                        : "-"}
                    </td>
                    <td className="p-3 flex justify-end gap-2 md:table-cell md:text-center mt-2 md:mt-0">
                      <Link
                        to={`/admin/products/${product._id}/edit`}
                        className="bg-yellow-50 text-yellow-600 border border-yellow-200 px-3 py-1.5 rounded-md hover:bg-yellow-500 hover:text-white transition-colors text-xs font-bold"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(product._id)}
                        className="bg-red-50 text-red-600 border border-red-200 px-3 py-1.5 rounded-md hover:bg-red-500 hover:text-white transition-colors text-xs font-bold"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={10} className="p-16 text-center text-gray-500 bg-gray-50/50">
                  <div className="flex flex-col items-center gap-2">
                    <IoIosSearch size={40} className="text-gray-300" />
                    <p className="font-medium">No Products found.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ProductManagement;