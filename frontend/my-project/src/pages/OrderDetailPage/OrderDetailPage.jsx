import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchOrderDetails } from "@redux/slices/orderSlice"; 

function OrderDetailPage() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { orderDetails, loading, error } = useSelector((state) => state.orders);

  useEffect(() => {
    dispatch(fetchOrderDetails(id));
  }, [dispatch, id]);

  if (loading) return <p className="text-center p-10">Loading...</p>;
  if (error) return <p className="text-center p-10 text-red-500">Error: {error}</p>;

  if (!orderDetails) return <p className="text-center p-10">No Order details found</p>;

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-8">
      <h2 className="text-3xl font-bold mb-6 text-gray-800">Order Details</h2>

      <div className="bg-white p-6 sm:p-8 rounded-xl border border-gray-200 shadow-sm">
        
        {/* --- HEADER: ID & STATUS --- */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 pb-6 border-b border-gray-100">
          <div className="mb-4 sm:mb-0">
            <h3 className="text-xl font-bold text-gray-900">
              Order #{orderDetails._id.slice(-6).toUpperCase()} 
              {/* Hoặc để full ID: #{orderDetails._id} */}
            </h3>
            <p className="text-gray-500 text-sm mt-1">
              Placed on {new Date(orderDetails.createdAt).toLocaleDateString("vi-VN")}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <span
              className={`px-4 py-2 rounded-lg text-sm font-semibold border ${
                orderDetails.isPaid
                  ? "bg-green-50 text-green-700 border-green-200"
                  : "bg-red-50 text-red-700 border-red-200"
              }`}
            >
              {orderDetails.isPaid ? "Payment: Paid" : "Payment: Pending"}
            </span>
            <span
              className={`px-4 py-2 rounded-lg text-sm font-semibold border ${
                orderDetails.isDelivered
                  ? "bg-blue-50 text-blue-700 border-blue-200"
                  : "bg-yellow-50 text-yellow-700 border-yellow-200"
              }`}
            >
              {orderDetails.isDelivered ? "Status: Delivered" : "Status: Processing"}
            </span>
          </div>
        </div>

        {/* --- INFO GRID --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          
          {/* Cột 1: Payment */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="text-base font-bold text-gray-800 mb-3 uppercase tracking-wide">
              Payment Info
            </h4>
            <div className="space-y-1 text-gray-600">
              <p><span className="font-medium text-gray-900">Method:</span> {orderDetails.paymentMethod}</p>
              <p><span className="font-medium text-gray-900">Status:</span> {orderDetails.isPaid ? "Completed" : "Unpaid"}</p>
            </div>
          </div>

          {/* Cột 2: Shipping */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="text-base font-bold text-gray-800 mb-3 uppercase tracking-wide">
              Shipping Info
            </h4>
            <div className="space-y-1 text-gray-600">
               {/* Kiểm tra shippingAddress tồn tại trước khi render */}
              <p><span className="font-medium text-gray-900">Name:</span> {orderDetails.shippingAddress?.fullName || orderDetails.user?.name}</p>
              <p><span className="font-medium text-gray-900">Address:</span> {orderDetails.shippingAddress?.address}</p>
              <p>
                {orderDetails.shippingAddress?.city}, {orderDetails.shippingAddress?.country}
              </p>
              <p><span className="font-medium text-gray-900">Phone:</span> {orderDetails.shippingAddress?.phone}</p>
            </div>
          </div>
        </div>

        {/* --- PRODUCT TABLE (Căn chỉnh thẳng hàng) --- */}
        <div className="overflow-x-auto">
          <h4 className="text-lg font-bold text-gray-800 mb-4">Order Items</h4>
          <table className="min-w-full border-collapse">
            <thead className="bg-gray-100 text-gray-600 text-xs uppercase font-bold">
              <tr>
                {/* 1. Cột Product: Căn trái */}
                <th className="py-4 px-6 text-left w-1/2">Product</th>
                {/* 2. Cột Price: Căn giữa */}
                <th className="py-4 px-6 text-center">Unit Price</th>
                {/* 3. Cột Qty: Căn giữa */}
                <th className="py-4 px-6 text-center">Quantity</th>
                {/* 4. Cột Total: Căn phải */}
                <th className="py-4 px-6 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="text-gray-700 divide-y divide-gray-200">
              {orderDetails.orderItems.map((item) => (
                <tr key={item.productId || item._id} className="hover:bg-gray-50 transition">
                  {/* Cột Product: Ảnh + Tên */}
                  <td className="py-4 px-6 text-left">
                    <div className="flex items-center gap-4">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-14 h-14 object-cover rounded-md border"
                      />
                      <div>
                        <Link
                          to={`/product/${item.productId}`}
                          className="font-medium text-gray-900 hover:text-blue-600"
                        >
                          {item.name}
                        </Link>
                        {/* Hiện size/màu nếu có */}
                        {(item.size || item.color) && (
                           <p className="text-xs text-gray-500 mt-0.5">
                             {item.color} {item.size ? `| ${item.size}` : ''}
                           </p>
                        )}
                      </div>
                    </div>
                  </td>
                  
                  {/* Cột Price: Căn giữa */}
                  <td className="py-4 px-6 text-center font-medium">
                    ${item.price}
                  </td>
                  
                  {/* Cột Qty: Căn giữa */}
                  <td className="py-4 px-6 text-center">
                    {item.quantity}
                  </td>
                  
                  {/* Cột Total: Căn phải (Bold để nổi bật) */}
                  <td className="py-4 px-6 text-right font-bold text-gray-900">
                    ${item.price * item.quantity}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* --- TOTAL SUMMARY --- */}
        <div className="flex justify-end mt-8">
            <div className="w-full sm:w-80 bg-gray-50 p-6 rounded-lg space-y-3">
                <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>${orderDetails.totalPrice}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                    <span>Shipping</span>
                    <span>Free</span>
                </div>
                <div className="pt-3 border-t border-gray-200 flex justify-between text-lg font-bold text-gray-900">
                    <span>Total</span>
                    <span className="text-emerald-600">${orderDetails.totalPrice}</span>
                </div>
            </div>
        </div>

        {/* BACK LINK */}
        <div className="mt-8">
            <Link to="/my-orders" className="text-gray-500 hover:text-gray-900 font-medium flex items-center gap-2 transition">
              ← Back to My Orders
            </Link>
        </div>

      </div>
    </div>
  );
}

export default OrderDetailPage;