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
  
  useEffect(() => {
    const delay = setTimeout(()=>{
      dispatch(fetchAdminProducts({ search: searchItem }));

    }, 1000)
    return ()=> clearTimeout(delay)
  }, [dispatch, searchItem]);

  const handleDelete = (productId) => {
    if (window.confirm("Are you want to delete the Product ?")) {
      dispatch(
        deleteProduct({
          id: productId,
        }),
      );
    }
  };


  if (loading) return <p className="text-center"> Loading ...</p>;
  if (error) return <p className="text-center"> Error: {error}</p>;

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex flex-col md:text-xl justify-between items-start mb-6 gap-4 ">
        <h2 className="text-xl md:text-2xl font-bold mb-6 ">Product Management</h2>
        {/* search item  */}
        <div className=" flex flex-col sm:flex-row w-full md:w-auto items-center gap-4 ">
          <div className=" relative w-full sm:w-64 ">
            <input
              type="text"
              placeholder="search item "
              value={searchItem}
              onChange={(e) => setSearchItem(e.target.value)}
              className=" pl-10 pr-4 py-2 boder border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 w-64 shadow-sm  "
            />
           <div className=" absolute right-1.5 top-3 text-gray-500   "> 
            <button className=" hover:text-gray-400 transition-all duration-300 ease-in-out cursor-pointer  "
            onClick={()=> setSearchItem("")}
            >
            <IoIosClose />

            </button>
           </div> 
            <div className=" w-5 h-5 text-gray-400 absolute left-3 top-3 ">
              <IoIosSearch />
            </div>
          </div>
          <Link
            to="/admin/products/create"
            className=" bg-green-500 text-center text-white px-4 py-2 rounded hover:bg-green-600 transition-all duration-500 ease-in-out shadow-md ">
            Add product
          </Link>
        </div>
      </div>
      <div className="overflow-x-auto shadow-md sm:rounded-lg">
        <table className="w-full text-left text-sm text-gray-500 block md:table ">
          <thead className=" hidden md:table-header-group bg-gray-100 text-xs uppercase text-gray-700">
            <tr>
              <th className="py-3 px-4 w-64">Name</th>
              <th className="py-3 px-4">Price</th>
              <th className="py-3 px-4">Sku</th>
              <th className="py-3 px-4">Count </th>
              <th className="py-3 px-4">Sold </th>

              <th className="py-3 px-4">Creare by</th>
              <th className="py-3 px-4">update by</th>
              <th className="py-3 px-4">create At </th>
              <th className="py-3 px-4">Action</th>
            </tr>
          </thead>
          <tbody>
            {products?.length > 0 ? (
              products.map((product) => {
                return (
                  <tr
                    key={product._id}
                    className="block md:table-row border border-gray-200 md:border-b mb-4 md:mb-0 bg-white hover:bg-gray-50 transition-all duration-300 ease-in-out rounded-lg md:rounded-none ">
                    <td className="p-3 md:p-3 flex justify-between items-center md:table-cell border-b md:border-none  ">
                      {product.name}
                    </td>
                    <td className="p-3 md:p-2 flex justify-between md:table-cell border-b md:border-none">${product.price}</td>

                    <td className="p-3 md:p-2 flex justify-between md:table-cell border-b md:border-none" >{product.sku}</td>

                    <td className="p-3 md:p-2 text-center flex justify-between md:table-cell border-b md:border-none">{product.countInStock}</td>
                    <td className="p-3 md:p-2 flex text-center justify-between md:table-cell border-b md:border-none" >{product.sold}</td>
                    <td className="p-3 md:p-2 flex justify-between md:table-cell border-b md:border-none">
                      {product?.user ? (
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-xs ">
                          {" "}
                          {product?.user?.name}{" "}
                        </span>
                      ) : (
                        ""
                      )}
                    </td>
                    <td className=" p-3 md:p-4 flex justify-between md:table-cell border-b md:border-none ">
                      {product?.lastEditByUser ? (
                        <span>
                          {" "}
                          updated by {product?.lastEditByUser?.name} <br />
                          {product?.updatedAt ? (
                            <span>
                              {" "}
                              {new Date(product.updatedAt).toLocaleString(
                                "vi-VN",
                              )}{" "}
                            </span>
                          ) : (
                            ""
                          )}
                        </span>
                      ) : (
                        ""
                      )}
                    </td>
                    <td className="p-3 md:p-4 flex justify-between md:table-cell border-b md:border-none ">
                      {product?.createdAt
                        ? new Date(product.createdAt).toLocaleString("vi-VN")
                        : ""}{" "}
                    </td>
                    <td className="p-3 md:p-1 flex justify-end md:justify-center gap-2 md:table-cell">
                      <Link
                        to={`/admin/products/${product._id}/edit`}
                        className="bg-yellow-500 text-white px-2 py-1 rounded mr-2 hover:bg-yellow-600 transition-all duration-300 ease-in-out">
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(product._id)}
                        className="bg-red-500 text-white px-2 py-1 rounded mr-2 hover:bg-red-700 transition-all duration-300 ease-in-out">
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={4} className="p-4 text-center text-gray-500">
                  No Products found.
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
