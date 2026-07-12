import { useState, useEffect } from "react"; 
import { Link, NavLink, useNavigate } from "react-router-dom";
import { FaUser, FaStore, FaClipboardList, FaBoxOpen, FaSignOutAlt, FaWarehouse } from "react-icons/fa";
import { RiMessage2Fill } from "react-icons/ri";
import { FaCashRegister } from "react-icons/fa6";
import { BsPostcard } from "react-icons/bs";
import { IoScanOutline, IoLockClosedOutline } from "react-icons/io5";

import { useDispatch, useSelector } from "react-redux";
import { logout } from "@redux/slices/authSlice";
import { clearCart } from "@redux/slices/cartSlice";
import { fetchLastRfid, resetLastRfid, clearBackendRfid } from "@redux/slices/iotSensorSlice";
import axios from "axios";
import { toast } from "sonner";

function AdminSidebar() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  
  // 👉 STATE BẢO MẬT (Chặn chuyển trang)
  const [authModalConfig, setAuthModalConfig] = useState({ isOpen: false, targetPath: null });
  const [authScannedRfid, setAuthScannedRfid] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const { lastRfid } = useSelector((state) => state.iotSensor);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleLogout = () => {
      dispatch(logout());
      dispatch(clearCart());
      navigate("/");
  };

  // 👉 THÊM CỜ requiresAuth VÀO CÁC MỤC CẦN BẢO VỆ
  const navItems = [
    { path: "/admin/users", name: "Quản lý tài khoản", icon: <FaUser size={18} />, requiresAuth: false },
    { path: "/admin/products", name: "Quản lý sản phẩm", icon: <FaBoxOpen size={18} />, requiresAuth: true }, // Khóa
    { path: "/admin/orders", name: "Quản lý đơn hàng", icon: <FaClipboardList size={18} />, requiresAuth: false },
    { path: "/admin/news", name: "Quản lý bài viết", icon: <BsPostcard size={18} />, requiresAuth: false },
    { path: "/admin/chat", name: "Quản lý tin nhắn", icon: <RiMessage2Fill size={18} />, requiresAuth: false },
    { path: "/admin/cart", name: "Thanh toán", icon: <FaCashRegister size={18} />, requiresAuth: false },
    { path: "/admin/warehouse", name: "Giám sát kho ", icon: <FaWarehouse size={18} />, requiresAuth: true }, // Khóa
    { path: "/", name: "Về trang chủ", icon: <FaStore size={18} />, requiresAuth: false },
  ];

  // 👉 LẮNG NGHE MÁY QUÉT KHI MỞ MODAL BẢO MẬT
  useEffect(() => {
    let interval;
    if (authModalConfig.isOpen) {
      interval = setInterval(() => { dispatch(fetchLastRfid()); }, 1000);
    } else {
      dispatch(resetLastRfid());
      dispatch(clearBackendRfid());
      setAuthScannedRfid("");
      setAdminPassword("");
    }
    return () => clearInterval(interval);
  }, [authModalConfig.isOpen, dispatch]);

  // 👉 NHẬN DỮ LIỆU THẺ
  useEffect(() => {
    if (lastRfid && authModalConfig.isOpen) {
      setAuthScannedRfid(lastRfid);
      setAdminPassword(""); // Xóa password nếu quét thẻ
      toast.success("Đã quét thẻ! Bấm xác nhận.");
    }
  }, [lastRfid, authModalConfig.isOpen]);

  // 👉 HÀM XỬ LÝ CLICK CHUYỂN TRANG
  const handleNavClick = (e, item) => {
    if (item.requiresAuth) {
      e.preventDefault(); // Chặn chuyển trang
      setAuthModalConfig({ isOpen: true, targetPath: item.path });
    }
  };

  // 👉 HÀM GỬI LÊN BACKEND ĐỂ KIỂM TRA QUYỀN
  const handleVerifyAccess = async (e) => {
    e.preventDefault();
    if (!authScannedRfid && !adminPassword) {
      return toast.error("Vui lòng quét thẻ hoặc nhập mật khẩu!");
    }

    setIsVerifying(true);
    try {
      // Gọi API kiểm tra (Cần tạo API này ở Backend)
      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/users/verify-access`, {
        authRfid: authScannedRfid,
        password: adminPassword,
        userId: user._id // Gửi id người đang đăng nhập để đối chiếu
      });
      
      toast.success("Xác thực thành công!");
      navigate(authModalConfig.targetPath); // Cho phép đi tiếp
      setAuthModalConfig({ isOpen: false, targetPath: null });
      
    } catch (error) {
      toast.error(error.response?.data?.message || "Sai mật khẩu hoặc thẻ không có quyền!");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <>
      <div className="bg-gray-900 text-white min-h-screen w-full flex flex-col p-5 shadow-2xl z-40 relative">
        <div className="mb-8 text-center border-b border-gray-700 pb-6">
          <Link to="/admin" className="text-3xl font-black tracking-wider text-white uppercase">
            SHOP<span className="text-blue-500">ADMIN</span>
          </Link>
        </div>

        <div className="bg-gray-800 p-4 rounded-xl mb-8 flex items-center gap-4 border border-gray-700 shadow-inner">
          <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center bg-gray-700 shadow-md border-2 border-blue-500 shrink-0">
            {user?.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-xl font-bold text-white">{user?.name?.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div className="overflow-hidden">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-widest mb-1">Welcome back,</p>
            <p className="text-lg font-bold text-white truncate max-w-[150px]">{user?.name || "Admin"}</p>
          </div>
        </div>

        <nav className="flex flex-col gap-2 flex-grow overflow-y-auto pr-2 custom-scrollbar">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2 pl-2">Menu chính</p>
          
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={(e) => handleNavClick(e, item)}
              className={({ isActive }) =>
                `flex items-center justify-between py-3 px-4 rounded-xl transition-all duration-300 font-medium ${
                  isActive
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30 translate-x-1" 
                    : "text-gray-400 hover:bg-gray-800 hover:text-white hover:translate-x-1" 
                }`
              }
            >
              <div className="flex items-center gap-4">
                 <div className={`${({isActive}) => isActive ? "text-white" : "text-gray-400"}`}>{item.icon}</div>
                 <span>{item.name}</span>
              </div>
              {/* Hiển thị icon Ổ khóa nhỏ cho các mục cần bảo mật */}
              {item.requiresAuth && <IoLockClosedOutline size={14} className="opacity-50" />}
            </NavLink>
          ))}
        </nav>

        <div className="mt-6 pt-6 border-t border-gray-800 space-y-3">
          <button onClick={() => navigate("/admin/searchRFID")} className="w-full bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white border border-blue-500/20 py-3 px-4 rounded-xl flex items-center justify-center gap-3 transition-all duration-300 font-bold group">
            <IoScanOutline className="group-hover:scale-110 transition-transform" size={20} />
            <span>Tra cứu bằng RFID</span>
          </button>

          <button onClick={handleLogout} className="w-full bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20 py-3 px-4 rounded-xl flex items-center justify-center gap-3 transition-all duration-300 font-bold group">
            <FaSignOutAlt className="group-hover:-translate-x-1 transition-transform" size={18} />
            <span>Đăng xuất</span>
          </button>
        </div>
      </div>

      {/* 👉 MODAL XÁC THỰC BẢO MẬT (Chỉ hiện khi bấm vào mục bị khóa) */}
      {authModalConfig.isOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-[2000] px-4 bg-gray-900/80 backdrop-blur-sm">
           <div className="bg-white rounded-sm p-6 w-full max-w-sm shadow-2xl border border-gray-200 text-gray-800">
              <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-4">
                  <IoLockClosedOutline size={22} className="text-red-500" />
                  <h3 className="font-bold text-gray-900">Khu vực Bảo mật</h3>
              </div>
              
              <p className="text-xs text-gray-500 mb-5 leading-relaxed">
                 Khu vực này yêu cầu quyền Admin. Vui lòng quét thẻ hoặc nhập mật khẩu để truy cập.
              </p>
              
              <form onSubmit={handleVerifyAccess}>
                 <div className="mb-3">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Mã thẻ RFID</label>
                    <input 
                       type="text" 
                       value={authScannedRfid || ""} 
                       placeholder="Đang đợi tín hiệu thẻ..."
                       className="w-full p-3 bg-gray-50 rounded-sm outline-none border border-gray-300 text-sm font-mono text-gray-700 focus:border-blue-500 transition-colors" 
                       readOnly 
                    />
                 </div>

                 <div className="flex items-center justify-center gap-4 my-4">
                    <div className="h-px bg-gray-200 flex-1"></div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Hoặc</span>
                    <div className="h-px bg-gray-200 flex-1"></div>
                 </div>

                 <div className="mb-6">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Mật khẩu Admin</label>
                    <input 
                       type="password" 
                       value={adminPassword}
                       onChange={(e) => {
                         setAdminPassword(e.target.value);
                         if(authScannedRfid) setAuthScannedRfid(""); 
                       }}
                       placeholder="Nhập mật khẩu..."
                       className="w-full p-3 bg-white rounded-sm outline-none border border-gray-300 text-sm focus:border-blue-500 transition-colors" 
                    />
                 </div>

                 <div className="flex gap-2">
                    <button type="button" onClick={() => setAuthModalConfig({isOpen: false, targetPath: null})} className="flex-1 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-sm font-bold text-sm hover:bg-gray-50">Quay lại</button>
                    <button type="submit" disabled={isVerifying || (!authScannedRfid && !adminPassword)} className="flex-1 py-2.5 bg-blue-600 text-white font-bold rounded-sm hover:bg-blue-700 disabled:opacity-50 text-sm">
                      {isVerifying ? "Đang kiểm tra..." : "Truy cập"}
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </>
  );
}

export default AdminSidebar;