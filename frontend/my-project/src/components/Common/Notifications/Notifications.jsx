import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

// 👇 Thêm prop onDelete vào đây
function Notifications({ notify, onClick, onMarkAsRead, isCompact, isSelected, onToggleSelect, onDelete }) {
  return (
    <div
      onClick={onClick}
      className={`cursor-pointer transition-all flex items-start 
        ${isCompact 
            ? "px-4 md:px-5 py-4 border-b border-gray-50 last:border-none gap-3 hover:bg-gray-50" 
            : "p-4 border rounded-xl gap-4"
        }
        ${!notify.read 
          ? (isCompact ? "bg-blue-50/60" : "bg-blue-50/50 border-blue-200 hover:bg-blue-50") 
          : (isCompact ? "bg-white" : "bg-white border-gray-100 hover:bg-gray-50 hover:shadow-sm")
        }
      `}
    >
      {/* Ô CHECKBOX (CHỈ HIỆN Ở TRANG FULL) */}
      {!isCompact && (
        <div className="mt-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onToggleSelect}
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
          />
        </div>
      )}

      {/* Chấm xanh hiển thị trạng thái */}
      <div className={`mt-1.5 rounded-full flex-shrink-0 
        ${isCompact ? "h-2 w-2" : "w-2.5 h-2.5 shadow-sm"} 
        ${!notify.read ? "bg-blue-600" : (isCompact ? "bg-gray-300" : "bg-transparent")}
      `}></div>

      {/* Nội dung thông báo */}
      <div className="flex-1">
        <p className={`${isCompact ? "text-sm leading-snug" : "text-base leading-snug"} 
          ${!notify.read ? (isCompact ? "font-semibold text-gray-900" : "font-bold text-gray-900") : "text-gray-600"}
        `}>
          {notify.message}
        </p>
        <p className={`${isCompact ? "text-[10px] mt-1" : "text-xs font-medium mt-1.5"} text-gray-400`}>
          {formatDistanceToNow(new Date(notify.createdAt), { addSuffix: true, locale: vi })}
        </p>
      </div>

      {/* 👇 CỤM NÚT HÀNH ĐỘNG (CHỈ HIỆN Ở TRANG FULL) */}
      {!isCompact && (
        <div className="hidden md:flex flex-col gap-2 items-end flex-shrink-0">
          {/* Nút đánh dấu đã đọc */}
          {!notify.read && onMarkAsRead && (
            <button
              onClick={onMarkAsRead}
              className="text-xs text-blue-600 hover:text-white bg-blue-100 hover:bg-blue-600 px-3 py-1.5 rounded-lg font-semibold transition-all duration-300 w-full"
            >
              Đánh dấu đã đọc
            </button>
          )}
          
          {/* Nút Xoá */}
          {onDelete && (
            <button
              onClick={onDelete}
              className="text-xs text-red-600 hover:text-white bg-red-50 hover:bg-red-600 px-3 py-1.5 rounded-lg font-semibold transition-all duration-300 w-full"
            >
              Xoá thông báo
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default Notifications;