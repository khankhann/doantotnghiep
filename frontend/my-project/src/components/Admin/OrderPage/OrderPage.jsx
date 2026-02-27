import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchAllOrders, updateOrderStatus } from '@redux/slices/adminOrderSlice';

function OrderPage() {
  const navigate = useNavigate()
const dispatch = useDispatch()
const {user} = useSelector((state)=> state.auth)
const {orders , loading , error } = useSelector((state)=> state.adminOrders)
useEffect(()=>{
if(!user  && user.role !== "admin"){
  navigate("/") 
}else{
  dispatch(fetchAllOrders())
}
},[navigate, dispatch, user])

  const handleStatusChange = (orderId, status) => {
    dispatch(updateOrderStatus({
      id : orderId , status
    }))
  };
  if(loading ) return <p className='text-center'> loading </p>
  if(error) return <p className='text-center'> Error : {error}</p>
  console.log(orders)
  return (  
    <div className="max-w-7xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6 ">Order Management</h2>
      <div className="overflow-auto shadow-md sm:rounded-lg">
        <table className="min-w-full text-left text-gray-500">
          <thead className="bg-gray-100 text-xs uppercase text-gray-700">
            <tr>
              <th className="py-3 px-4">Order ID</th>
              <th className="py-3 px-4">Product name</th>
              <th className="py-3 px-4">Quantity </th>

              <th className="py-3 px-4">Customer ID</th>
              <th className="py-3 px-4">Date Order</th>

              <th className="py-3 px-4">Total Price</th>
              <th className='py-3 px-4'>Date Delivered </th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Action</th>
            </tr>
          </thead>
          <tbody>
            {orders.length > 0 ? (
              orders.map((order) => {
                return (
                  <tr
                    key={order._id}
                    className="border-b hover:bg-gray-50 cursor-pointer transition-all">
                    <td className="py-4 px-4 font-medium text-gray-900 whitespace-nowrap">
                      #{order?._id}
                    </td>
                    <td className="p-4">{order?.orderItems[0]?.name} </td>
                    <td className="p-4 text-center">{order?.orderItems[0]?.quantity} </td>
                    <td className="p-4">{order?.user?.name || "user has been deleted"}</td>
                    <td className='p-4'>{order?.paidAt ? new Date(order?.paidAt).toLocaleString("vi-VN") : "" } </td>

                    <td className="p-4">{order?.totalPrice.toFixed(2)}</td>
                    <td className='p-4'>{order?.isDelivered ? new Date(order.deliveredAt).toLocaleString("vi-VN") : " chua giao " } </td>
                    <td className="p-4">
                      <select
                        value={order?.status}
                        onChange={(e) =>
                          handleStatusChange(order._id, e.target.value)
                        }
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5">
                        <option value="Processing">Processing </option>
                        <option value="Shipped">Shipped </option>
                        <option value="Delivered">Delivered </option>
                        <option value="Cancelled">Cancelled </option>
                      </select>
                    </td>
                    <td className="p-4 ">
                      <button
                        onClick={() =>
                          handleStatusChange(order._id, "Delivered")
                        }
                        className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors">
                        Mark as Delivered
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={5} className="p-4 text-center text-gray-500">
                  No Orders Found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default OrderPage;
