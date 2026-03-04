import { useSelector, useDispatch } from "react-redux";
// 👇 NHỚ IMPORT THÊM HÀM XOÁ TỪ SLICE CỦA FEN VÀO ĐÂY NHA (VD: deleteNotification)
import { markNotificationAsRead, deleteNotification } from "@redux/slices/notificationSlice"; 
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import Notifications from "@components/Common/Notifications/Notifications";

const NotificationUser = () => {
  const { notifications } = useSelector((state) => state.notifications);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [selectedIds, setSelectedIds] = useState([]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleNotificationClick = (notifyId) => {
    dispatch(markNotificationAsRead(notifyId._id));
    if (notifyId.type === "ORDER_UPDATE" && notifyId.orderId) {
      navigate(`/order/${notifyId.orderId}`);
    } else if (notifyId.type === "NEW_PRODUCT") {
      navigate("/collections/all");
    }
  };

  const handleToggleSelect = (id) => {
    setSelectedIds((prev) => 
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(notifications.map((n) => n._id)); 
    } else {
      setSelectedIds([]); 
    }
  };

  const handleMarkAsReadAction = () => {
    if (selectedIds.length > 0) {
      selectedIds.forEach((id) => dispatch(markNotificationAsRead(id)));
      setSelectedIds([]); 
    } else {
      const unreadNotifications = notifications.filter((n) => !n.read);
      unreadNotifications.forEach((notify) => dispatch(markNotificationAsRead(notify._id)));
    }
  };

  // 👇 HÀM XỬ LÝ XOÁ NHIỀU MỤC CÙNG LÚC
  const handleDeleteSelected = () => {
    if (window.confirm(`Bạn có chắc muốn xoá ${selectedIds.length} thông báo đã chọn?`)) {
      selectedIds.forEach((id) => dispatch(deleteNotification(id)));
      setSelectedIds([]); // Xoá xong thì reset mảng chọn
    }
  };

  // 👇 HÀM XỬ LÝ XOÁ 1 MỤC LẺ
  const handleDeleteSingle = (id) => {
    if (window.confirm("Bạn có chắc muốn xoá thông báo này?")) {
      dispatch(deleteNotification(id));
      // Nếu cái bị xoá đang được tích, thì gỡ tích nó ra luôn
      setSelectedIds((prev) => prev.filter((selectedId) => selectedId !== id)); 
    }
  };

  const isAllSelected = notifications.length > 0 && selectedIds.length === notifications.length;

  return (
    <div className="container mx-auto p-6 max-w-4xl min-h-[60vh]">
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
        
        <div className="flex items-center gap-4">
          {notifications.length > 0 && (
            <input 
              type="checkbox" 
              checked={isAllSelected}
              onChange={handleSelectAll}
              className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
            />
          )}
          <h2 className="text-2xl font-bold text-gray-800">Tất cả thông báo</h2>
        </div>

        {/* CỤM NÚT HÀNH ĐỘNG HÀNG LOẠT */}
        <div className="flex items-center gap-2">
          {/* Nút Xoá hàng loạt (Chỉ hiện khi có tích chọn) */}
          {selectedIds.length > 0 && (
            <button
              onClick={handleDeleteSelected}
              className="text-sm bg-red-50 text-red-600 hover:bg-red-600 hover:text-white px-4 py-2 rounded-xl font-bold transition-all duration-300 flex items-center gap-2 shadow-sm"
            >
              🗑️ Xoá ({selectedIds.length})
            </button>
          )}

          {/* Nút Đánh dấu */}
          {(unreadCount > 0 || selectedIds.length > 0) && (
            <button
              onClick={handleMarkAsReadAction}
              className="text-sm bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white px-4 py-2 rounded-xl font-bold transition-all duration-300 flex items-center gap-2 shadow-sm"
            >
              ✔️ {selectedIds.length > 0 ? `Đọc (${selectedIds.length})` : "Đánh dấu tất cả"}
            </button>
          )}
        </div>
      </div>

      {/* DANH SÁCH */}
      <div className="space-y-3">
        {notifications.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
            <p className="text-gray-500 font-medium">Bạn chưa có thông báo nào.</p>
          </div>
        ) : (
          notifications.map((notify) => (
            <Notifications 
              key={notify._id} 
              notify={notify} 
              onClick={() => handleNotificationClick(notify)} 
              isCompact={false} 
              isSelected={selectedIds.includes(notify._id)}
              
              onMarkAsRead={(e) => {
                e.stopPropagation(); 
                dispatch(markNotificationAsRead(notify._id));
              }}
              onToggleSelect={(e) => {
                e.stopPropagation(); 
                handleToggleSelect(notify._id);
              }}

              // 👇 TRUYỀN HÀM XOÁ XUỐNG CHO COMPONENT CON
              onDelete={(e) => {
                e.stopPropagation(); // Cấm nhảy trang khi bấm nút Xoá
                handleDeleteSingle(notify._id);
              }}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationUser;