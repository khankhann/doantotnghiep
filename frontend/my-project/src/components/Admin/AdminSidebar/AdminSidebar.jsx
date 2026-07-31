import { useState, useEffect } from "react"; 
import { Link, NavLink, useNavigate } from "react-router-dom";
import { FaUser, FaStore, FaClipboardList, FaBoxOpen, FaSignOutAlt, FaWarehouse, FaTimes } from "react-icons/fa";
import { RiMessage2Fill } from "react-icons/ri";
import { FaCashRegister } from "react-icons/fa6";
import { BsPostcard } from "react-icons/bs";
import { IoScanOutline, IoLockClosedOutline, IoShieldCheckmarkOutline, IoRadioOutline, IoKeyOutline } from "react-icons/io5";

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
  
  // STATE BẢO MẬT
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

  const navItems = [
    { path: "/admin/users", name: "Quản lý tài khoản", icon: <FaUser size={16} />, requiresAuth: false },
    { path: "/admin/products", name: "Quản lý sản phẩm", icon: <FaBoxOpen size={16} />, requiresAuth: true }, 
    { path: "/admin/orders", name: "Quản lý đơn hàng", icon: <FaClipboardList size={16} />, requiresAuth: false },
    { path: "/admin/news", name: "Quản lý bài viết", icon: <BsPostcard size={16} />, requiresAuth: false },
    { path: "/admin/chat", name: "Quản lý tin nhắn", icon: <RiMessage2Fill size={16} />, requiresAuth: false },
    { path: "/admin/cart", name: "Thanh toán", icon: <FaCashRegister size={16} />, requiresAuth: false },
    { path: "/admin/warehouse", name: "Giám sát kho", icon: <FaWarehouse size={16} />, requiresAuth: true }, 
    { path: "/", name: "Về trang chủ", icon: <FaStore size={16} />, requiresAuth: false },
  ];
 
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

  const performAuth = async (rfidCode, passwordCode) => {
    setIsVerifying(true);
    try {
      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/users/verify-access`, {
        authRfid: rfidCode,
        password: passwordCode,
        userId: user._id 
      });
      
      toast.success("Xác thực thành công!");
      navigate(authModalConfig.targetPath); 
      setAuthModalConfig({ isOpen: false, targetPath: null });
      
    } catch (error) {
      toast.error(error.response?.data?.message || "Mật khẩu sai hoặc thẻ không có quyền!");
      setAuthScannedRfid(""); 
      dispatch(resetLastRfid()); 
    } finally {
      setIsVerifying(false);
    }
  };
 
  useEffect(() => {
    if (lastRfid && authModalConfig.isOpen) {
      const rfidString = lastRfid.rfidTag || lastRfid; 
      setAuthScannedRfid(rfidString);
      setAdminPassword(""); 
      toast.success("Đã nhận tín hiệu RFID!");
      performAuth(rfidString, "");
    }
  }, [lastRfid, authModalConfig.isOpen]);

  const handleVerifyAccess = (e) => {
    e.preventDefault();
    if (!authScannedRfid && !adminPassword) return toast.error("Vui lòng quét thẻ hoặc nhập mật khẩu!");
    performAuth(authScannedRfid, adminPassword);
  };

  const handleNavClick = (e, item) => {
    if (item.requiresAuth) {
      e.preventDefault(); 
      setAuthModalConfig({ isOpen: true, targetPath: item.path });
    }
  };

  const closeModal = () => {
    setAuthModalConfig({ isOpen: false, targetPath: null });
  };

  return (
    <>
      {/* SIDEBAR BÊN TRÁI (Tối giản & Sạch sẽ) */}
      <div className="bg-[#0f172a] text-slate-300 min-h-screen w-full flex flex-col p-4 z-40 relative">
        <div className="mb-6 px-2 pt-2">
          <Link to="/admin" className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-500 inline-block"></span>
            SHOP ADMIN
          </Link>
        </div>

        {/* User Status */}
        <div className="bg-slate-800/60 px-3.5 py-3 rounded-xl mb-6 flex items-center gap-3 border border-slate-700/50">
          <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-sm shrink-0">
            { user?.name?.charAt(0).toUpperCase() || "A"}
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-semibold text-slate-200 truncate">{user?.name || "Admin"}</p>
            <p className="text-[10px] text-slate-400">Quản trị viên</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex flex-col gap-1 flex-grow overflow-y-auto pr-1">
          <p className="text-[11px] font-medium text-slate-400 mb-2 px-2">Danh mục quản lý</p>
          
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={(e) => handleNavClick(e, item)}
              className={({ isActive }) =>
                `flex items-center justify-between py-2.5 px-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-blue-600 text-white" 
                    : "text-slate-400 hover:bg-slate-800/80 hover:text-slate-200" 
                }`
              }
            >
              <div className="flex items-center gap-3">
                 <span className="opacity-80">{item.icon}</span>
                 <span>{item.name}</span>
              </div>
              {item.requiresAuth && (
                 <IoLockClosedOutline size={13} className="text-slate-500" />
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer Actions */}
        <div className="mt-4 pt-4 border-t border-slate-800 space-y-1.5">
          <button 
            onClick={() => navigate("/admin/searchRFID")} 
            className="w-full text-slate-300 hover:bg-slate-800 py-2.5 px-3 rounded-lg flex items-center gap-3 text-sm font-medium transition-colors">
            <IoScanOutline size={16} />
            <span>Tra cứu sản phẩm</span>
          </button>

          <button 
            onClick={handleLogout} 
            className="w-full text-red-400 hover:bg-red-500/10 py-2.5 px-3 rounded-lg flex items-center gap-3 text-sm font-medium transition-colors">
            <FaSignOutAlt size={15} />
            <span>Đăng xuất</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* MODAL XÁC THỰC BẢO MẬT RFID - CĂN GIỮA MÀN HÌNH TỐI GIẢN */}
      {/* ========================================================= */}
      {authModalConfig.isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
           <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-xl border border-gray-100 relative">
              
              {/* Header Modal */}
              <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <IoShieldCheckmarkOutline size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">Xác thực quyền hạn</h3>
                    <p className="text-[11px] text-gray-500">Quét thẻ hoặc nhập mật khẩu</p>
                  </div>
                </div>
                <button 
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded-lg transition-colors">
                  <FaTimes size={13} />
                </button>
              </div>
              
              <form onSubmit={handleVerifyAccess} className="p-5 space-y-4">
                 
                 {/* Khung nhận RFID */}
                 <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl flex flex-col items-center justify-center text-center">
                    {authScannedRfid ? (
                      <div className="space-y-1">
                        <span className="inline-block px-2.5 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full">
                          Đã đọc dữ liệu
                        </span>
                        <p className="font-mono text-base font-bold text-gray-800">{authScannedRfid}</p>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 text-gray-500 py-1">
                        <IoRadioOutline size={22} className="text-blue-600 animate-pulse" />
                        <span className="text-xs font-medium">Đang chờ chạm thẻ RFID...</span>
                      </div>
                    )}
                 </div>

                 <div className="relative flex items-center justify-center">
                    <span className="bg-white px-2 text-[10px] font-semibold text-gray-400 uppercase">Hoặc</span>
                    <div className="absolute inset-x-0 h-[1px] bg-gray-100 -z-10"></div>
                 </div>

                 {/* Ô nhập mật khẩu */}
                 <div className="relative">
                    <IoKeyOutline size={16} className="absolute left-3 top-3 text-gray-400" />
                    <input 
                       type="password" 
                       value={adminPassword}
                       onChange={(e) => {
                         setAdminPassword(e.target.value);
                         if(authScannedRfid) setAuthScannedRfid("");
                       }}
                       placeholder="Nhập mật khẩu Admin..."
                       className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none text-xs text-gray-800 focus:bg-white focus:border-blue-500 transition-colors" 
                    />
                 </div>

                 {/* Nút bấm */}
                 <div className="flex gap-2 pt-1">
                    <button 
                      type="button" 
                      onClick={closeModal} 
                      className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold transition-colors">
                       Hủy
                    </button>
                    <button 
                      type="submit" 
                      disabled={isVerifying || (!authScannedRfid && !adminPassword)} 
                      className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition-colors">
                      {isVerifying ? "Xác thực..." : "Mở khóa"}
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