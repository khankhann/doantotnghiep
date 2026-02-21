import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { deleteProduct, fetchAdminProducts } from "../../../redux/slices/adminProductSlice";

function ProductManagement() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const {products, loading , error} = useSelector((state)=> state.adminProducts)
 
  useEffect(()=>{
    dispatch(fetchAdminProducts())
  },[dispatch])







  const handleDelete = (productId) => {
    if (window.confirm("Are you want to delete the Product ?")) {
      dispatch(deleteProduct({
        id : productId
      }))
    }
  };
if(loading ) return <p className="text-center"  > Loading ...</p>
if(error ) return <p className="text-center"  > Error: {error}</p>

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6 "> 
      <h2 className="text-2xl font-bold mb-6 ">Product Management</h2>
      <Link 
      to = "/admin/products/create"
      className=" bg-green-500 text-center text-white px-4 py-2 rounded hover:bg-green-600 transistion-all shadow-md "
      > 
      Them san pham
      </Link>

      </div>
      <div className="overflow-x-auto shadow-md sm:rounded-lg">
        <table className="min-w-full text-left text-gray-500">
          <thead className="bg-gray-100 text-xs uppercase text-gray-700">
            <tr>
              <th className="py-3 px-4">Name</th>
              <th className="py-3 px-4">Price</th>
              <th className="py-3 px-4">Sku</th>
              <th className="py-3 px-4">Action</th>
            </tr>
          </thead>
          <tbody>
            {products.length > 0 ? (
              products.map((product) => {
                return (
                  <tr
                    key={product._id}
                    className="border-b hover:bg-gray-50 cursor-pointer transition-all ">
                    <td className="p-4 font-medium text-gray-900 whitespace-nowrap ">
                      {product.name}
                    </td>
                    <td className="p-4">${product.price}</td>
                    <td className="p-4">{product.sku}</td>
                    <td className="p-4">
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
