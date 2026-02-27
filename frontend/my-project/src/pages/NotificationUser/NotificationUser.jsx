
import { useSelector, useDispatch } from "react-redux";
import { markNotificationAsRead } from "@redux/slices/notificationSlice";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

const NotificationUser = () => {
  const { notifications } = useSelector((state) => state.notifications);
  const dispatch = useDispatch();
  const navigate = useNavigate()
    const handleNotificationClick = (notifyId)=>{
        dispatch(markNotificationAsRead(notifyId._id))
        if(notifyId.type === "ORDER_UPDATE" && notifyId.orderId){
            navigate(`/order/${notifyId.orderId}`)
    }else if(notifyId.type === "NEW_PRODUCT"){
        navigate("/collections/all")
    }
}

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h2 className="text-2xl font-bold mb-6">Tất cả thông báo</h2>

      <div className="space-y-4">
        {notifications.length === 0 ? (
          <p className="text-gray-500 text-center">Bạn chưa có thông báo nào.</p>
        ) : (
          notifications.map((notify) => (
            <div
              key={notify._id}
              onClick={() => handleNotificationClick(notify)}
              className={`p-4 border rounded-lg cursor-pointer hover:bg-gray-100 transition flex items-start gap-4 ${
                !notify.read ? "bg-blue-50 border-blue-200" : "bg-white border-gray-200"
              }`}
            >
              {/* Icon loại thông báo (tùy chọn) */}
              <div className={`w-2 h-2 mt-2 rounded-full flex-shrink-0 ${!notify.read ? "bg-blue-600" : "bg-transparent"}`}></div>

              <div className="flex-1">
                <p className={`text-base ${!notify.read ? "font-semibold text-gray-800" : "text-gray-600"}`}>
                  {notify.message}
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  {formatDistanceToNow(new Date(notify.createdAt), { addSuffix: true, locale: vi })}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationUser;