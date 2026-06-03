import { useEffect, useState, useRef } from "react"; // 🔥 Import thêm useRef
import { useParams, Link, useNavigate } from "react-router-dom";
import { IoCheckmarkCircleOutline, IoCloseCircleOutline } from "react-icons/io5";

function VerifyEmail() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("Đang xác thực tài khoản của bạn...");
  
  // 🔥 Khai báo lính canh chống gọi API 2 lần
  const hasFetched = useRef(false); 

  useEffect(() => {
    // 🔥 Nếu lính canh báo là "đã gọi API rồi" thì chặn lại không cho chạy tiếp
    if (hasFetched.current) return; 

    const verifyUserEmail = async () => {
      hasFetched.current = true; // Đánh dấu là bắt đầu gọi API

      try {
        // (Lưu ý: fen dùng import.meta.env.VITE_BACKEND_URL như trong ảnh của fen là quá chuẩn)
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/users/verify-email/${token}`);
        const data = await response.json();

        if (response.ok) {
          setStatus("success");
          setMessage(data.message);
          
          setTimeout(() => {
            navigate("/login");
          }, 3000);

        } else {
          setStatus("error");
          setMessage(data.message || "Xác thực thất bại!");
        }
      } catch (error) {
        setStatus("error");
        setMessage("Lỗi kết nối đến máy chủ!");
      }
    };

    if (token) {
      verifyUserEmail();
    }
  }, [token, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-lg text-center border border-gray-100">
        
        {status === "loading" && (
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-black mb-4"></div>
            <h2 className="text-xl font-bold text-gray-800">Đang xử lý...</h2>
            <p className="text-gray-500 mt-2">{message}</p>
          </div>
        )}

        {status === "success" && (
          <div className="flex flex-col items-center">
            <IoCheckmarkCircleOutline className="text-green-500 w-20 h-20 mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Thành công!</h2>
            <p className="text-gray-600 mb-2">{message}</p>
            
            <p className="text-sm text-blue-600 font-medium mb-6 animate-pulse">
              Đang tự động chuyển đến trang Đăng nhập...
            </p>
            
            <Link to="/login" className="bg-black text-white font-bold py-3 px-8 rounded-xl hover:bg-gray-800 transition-all shadow-md w-full">
              Bấm vào đây nếu không tự chuyển
            </Link>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center">
            <IoCloseCircleOutline className="text-red-500 w-20 h-20 mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Thất bại!</h2>
            <p className="text-red-600 font-medium mb-6">{message}</p>
            <Link to="/" className="text-black font-bold hover:underline">
              Quay về Trang chủ
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}

export default VerifyEmail;