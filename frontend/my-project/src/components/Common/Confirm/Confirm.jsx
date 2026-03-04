import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IoWarningOutline } from "react-icons/io5";

function Confirm ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Xác nhận hành động", 
  message = "Bạn có chắc chắn muốn thực hiện hành động này không?", 
  confirmText = "Đồng ý", 
  cancelText = "Hủy",
  isDanger = false // Nếu là nút Xóa thì set isDanger = true để nó ra màu Đỏ
})  {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Lớp phủ màn hình (Backdrop) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose} // Bấm ra ngoài để đóng
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9998]"
          />

          {/* Hộp thoại Xác nhận (Modal) */}
          <div className="fixed inset-0 flex items-center justify-center z-[9999] pointer-events-none px-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2, type: "spring", bounce: 0.3 }}
              className="bg-white rounded-[24px] p-6 w-full max-w-[360px] shadow-2xl pointer-events-auto flex flex-col items-center text-center"
            >
              {/* Icon cảnh báo */}
              <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 ${isDanger ? "bg-red-50 text-red-500" : "bg-gray-100 text-gray-900"}`}>
                <IoWarningOutline size={28} />
              </div>

              {/* Nội dung */}
              <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
              <p className="text-[13px] text-gray-500 mb-6 leading-relaxed">
                {message}
              </p>

              {/* Các nút bấm */}
              <div className="flex gap-3 w-full">
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-full transition-colors active:scale-95"
                >
                  {cancelText}
                </button>
                <button
                  onClick={() => {
                    onConfirm();
                    onClose();
                  }}
                  className={`flex-1 py-2.5 text-white text-sm font-semibold rounded-full transition-colors active:scale-95 shadow-md ${
                    isDanger 
                      ? "bg-red-600 hover:bg-red-700 shadow-red-500/30" 
                      : "bg-gray-900 hover:bg-black shadow-gray-900/30"
                  }`}
                >
                  {confirmText}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default Confirm;