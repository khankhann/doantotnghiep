import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
// Import async thunk lấy chi tiết đơn hàng & cập nhật đơn hàng từ redux slice của fen
// (Đổi tên import cho đúng với project của fen nếu cần)
import {
  fetchOrderDetails,
  updateOrderStatus,
} from "@redux/slices/adminOrderSlice";

const formatPrice = (price) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price || 0);
};

function AdminOrderDetailPage() {
  const { id } = useParams();
  const dispatch = useDispatch();

  // Lấy dữ liệu đơn hàng từ Redux Store
  const { currentOrder, loading, error } = useSelector(
    (state) => state.adminOrders
  );

  const [status, setStatus] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (id) {
      dispatch(fetchOrderDetails(id));
    }
  }, [dispatch, id]);

  useEffect(() => {
    if (currentOrder) {
      setStatus(currentOrder.status || "Pending");
    }
  }, [currentOrder]);

  const handleStatusChange = async (e) => {
    const newStatus = e.target.value;
    setStatus(newStatus);
    setIsUpdating(true);
    try {
      await dispatch(
        updateOrderStatus({ orderId: id, status: newStatus })
      ).unwrap();
      alert("Cập nhật trạng thái đơn hàng thành công!");
    } catch (err) {
      alert("Lỗi khi cập nhật trạng thái: " + (err.message || err));
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6 text-center text-gray-500 py-20">
        Đang tải thông tin đơn hàng #{id?.slice(-6)}...
      </div>
    );
  }

  if (error || !currentOrder) {
    return (
      <div className="max-w-6xl mx-auto p-6 text-center py-20">
        <p className="text-red-500 mb-4">
          Lỗi: {error || "Không tìm thấy đơn hàng!"}
        </p>
        <Link
          to="/admin/orders"
          className="px-4 py-2 bg-gray-800 text-white rounded-lg text-sm hover:bg-gray-700">
          ← Quay lại danh sách đơn hàng
        </Link>
      </div>
    );
  }

  const shippingAddress = currentOrder.shippingAddress || {};
  const user = currentOrder.user || {};
  const orderItems = currentOrder.orderItems || [];

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-50 min-h-screen">
      {/* Header & Back Button */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <Link
            to="/admin/orders"
            className="text-sm text-gray-500 hover:text-blue-600 transition-colors flex items-center gap-1 mb-2">
            ← Quay lại danh sách đơn hàng
          </Link>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            Chi tiết đơn hàng #{currentOrder._id?.toUpperCase()}
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Ngày đặt: {new Date(currentOrder.createdAt).toLocaleString("vi-VN")}
          </p>
        </div>

        {/* Trạng thái đơn hàng Dropdown */}
        <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
          <span className="text-sm font-semibold text-gray-700">
            Trạng thái:
          </span>
          <select
            value={status}
            onChange={handleStatusChange}
            disabled={isUpdating}
            className={`text-sm font-bold rounded-lg px-3 py-1.5 outline-none border transition-colors cursor-pointer ${
              status === "Delivered"
                ? "bg-green-50 text-green-700 border-green-300"
                : status === "Shipped"
                ? "bg-blue-50 text-blue-700 border-blue-300"
                : status === "Cancelled" || status === "Cancel"
                ? "bg-red-50 text-red-700 border-red-300"
                : "bg-amber-50 text-amber-700 border-amber-300"
            }`}>
            <option value="Processing">Đang xử lý (Processing)</option>
            <option value="Shipped">Đang giao hàng (Shipped)</option>
            <option value="Delivered">Đã giao hàng (Delivered)</option>
            <option value="Cancelled">Đã hủy (Cancelled)</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CỘT TRÁI (2/3): DANH SÁCH SẢN PHẨM */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-base font-bold text-gray-800 mb-4 pb-2 border-b border-gray-100">
              Sản phẩm đã đặt ({orderItems.length})
            </h2>
            <div className="divide-y divide-gray-100">
              {orderItems.map((item, idx) => (
                <div
                  key={item._id || idx}
                  className="py-4 flex items-center gap-4 first:pt-0 last:pb-0">
                  <img
                    src={item.image || item.product?.image || "/placeholder.jpg"}
                    alt={item.name}
                    className="w-16 h-16 object-cover rounded-lg border border-gray-200 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-800 truncate">
                      {item.name}
                    </h3>
                    {item.variantName && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        Phân loại:{" "}
                        <span className="font-medium text-gray-700">
                          {item.variantName}
                        </span>
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-0.5">
                      Đơn giá: {formatPrice(item.price)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-800">
                      x{item.qty || item.quantity || 1}
                    </p>
                    <p className="text-sm font-black text-emerald-600 mt-1">
                      {formatPrice(
                        (item.price || 0) * (item.qty || item.quantity || 1)
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* TỔNG KẾT THANH TOÁN */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-base font-bold text-gray-800 mb-4 pb-2 border-b border-gray-100">
              Chi tiết thanh toán
            </h2>
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Tiền hàng</span>
                <span>
                  {formatPrice(
                    currentOrder.itemsPrice ||
                      currentOrder.totalPrice - (currentOrder.shippingPrice || 0)
                  )}
                </span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Phí vận chuyển</span>
                <span>{formatPrice(currentOrder.shippingPrice || 0)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Giảm giá</span>
                <span>-{formatPrice(currentOrder.discountPrice || 0)}</span>
              </div>
              <div className="pt-3 border-t border-gray-100 flex justify-between items-center text-base font-bold text-gray-900">
                <span>Tổng cộng</span>
                <span className="text-lg text-emerald-600">
                  {formatPrice(currentOrder.totalPrice)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* CỘT PHẢI (1/3): THÔNG TIN KHÁCH HÀNG & GIAO HÀNG */}
        <div className="space-y-6">
          {/* Khách hàng */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-base font-bold text-gray-800 mb-4 pb-2 border-b border-gray-100">
              Thông tin khách hàng
            </h2>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs text-gray-400">Tên tài khoản</p>
                <p className="font-semibold text-gray-800">
                  {user.name || shippingAddress.fullName || "Khách vãng lai"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Email</p>
                <p className="font-medium text-gray-700">
                  {user.email || "Chưa cập nhật"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Số điện thoại</p>
                <p className="font-medium text-gray-700">
                  {shippingAddress.phone || user.phone || "N/A"}
                </p>
              </div>
            </div>
          </div>

          {/* Địa chỉ giao hàng */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-base font-bold text-gray-800 mb-4 pb-2 border-b border-gray-100">
              Địa chỉ nhận hàng
            </h2>
            <p className="text-sm font-semibold text-gray-800 mb-1">
              {shippingAddress.fullName || user.name}
            </p>
            <p className="text-sm text-gray-600 leading-relaxed">
              {[
                shippingAddress.address,
                shippingAddress.ward,
                shippingAddress.district,
                shippingAddress.city,
              ]
                .filter(Boolean)
                .join(", ") || "Không có thông tin địa chỉ"}
            </p>
          </div>

          {/* Thanh toán */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-base font-bold text-gray-800 mb-4 pb-2 border-b border-gray-100">
              Phương thức thanh toán
            </h2>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-700">
                {currentOrder.paymentMethod || "COD (Tiền mặt)"}
              </span>
              <span
                className={`px-2.5 py-1 rounded text-xs font-bold ${
                  currentOrder.isPaid
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}>
                {currentOrder.isPaid ? "Đã thanh toán" : "Chưa thanh toán"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminOrderDetailPage;