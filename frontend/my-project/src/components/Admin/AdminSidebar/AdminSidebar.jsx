import { useState, useEffect, useRef } from "react"; 
import { Link, NavLink, useNavigate } from "react-router-dom";
import { FaUser, FaStore, FaClipboardList, FaBoxOpen, FaSignOutAlt, FaWarehouse } from "react-icons/fa";
import { RiMessage2Fill } from "react-icons/ri";
import { FaCashRegister } from "react-icons/fa6";
import { BsPostcard } from "react-icons/bs";
import { IoScanOutline, IoLockClosedOutline, IoShieldCheckmarkOutline } from "react-icons/io5";

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
  
  // 👉 STATE BẢO MẬT
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
    { path: "/admin/users", name: "Quản lý tài khoản", icon: <FaUser size={18} />, requiresAuth: false },
    { path: "/admin/products", name: "Quản lý sản phẩm", icon: <FaBoxOpen size={18} />, requiresAuth: true }, 
    { path: "/admin/orders", name: "Quản lý đơn hàng", icon: <FaClipboardList size={18} />, requiresAuth: false },
    { path: "/admin/news", name: "Quản lý bài viết", icon: <BsPostcard size={18} />, requiresAuth: false },
    { path: "/admin/chat", name: "Quản lý tin nhắn", icon: <RiMessage2Fill size={18} />, requiresAuth: false },
    { path: "/admin/cart", name: "Thanh toán", icon: <FaCashRegister size={18} />, requiresAuth: false },
    { path: "/admin/warehouse", name: "Giám sát kho ", icon: <FaWarehouse size={18} />, requiresAuth: true }, 
    { path: "/", name: "Về trang chủ", icon: <FaStore size={18} />, requiresAuth: false },
  ];

  // ========================================================
  // 🚨 HỆ THỐNG LẮNG NGHE CẢNH BÁO TOÀN CỤC (GLOBAL)
  // ========================================================
  const alertedFire = useRef(false);
  const alertedIntruder = useRef(false);

  useEffect(() => {
    const fetchEmergencyAlerts = async () => {
      try {
        const { data } = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/iot/alert/latest`);
        
        // 1. Xử lý Toast Báo Cháy
        if (data.alertStatus?.isFire) {
          if (!alertedFire.current) {
            toast.error("🔥🔥 BÁO ĐỘNG KHẨN CẤP: PHÁT HIỆN CÓ CHÁY TẠI KHO!", { 
              duration: 15000, 
              style: { background: '#ef4444', color: '#fff', fontWeight: 'bold', fontSize: '15px' } 
            });
            alertedFire.current = true; 
          }
        } else {
          alertedFire.current = false; 
        }

        // 2. Xử lý Toast Báo Trộm
        if (data.alertStatus?.isIntruder) {
          if (!alertedIntruder.current) {
            toast.warning("🚨 CẢNH BÁO AN NINH: PHÁT HIỆN CÓ NGƯỜI ĐỘT NHẬP!", { 
              duration: 15000,
              style: { background: '#f59e0b', color: '#fff', fontWeight: 'bold', fontSize: '15px' } 
            });
            alertedIntruder.current = true;
          }
        } else {
          alertedIntruder.current = false;
        }
      } catch (error) {
        // Lỗi mạng thì bỏ qua, không spam console
      }
    };

    // Quét cảnh báo mỗi 2 giây
    const alertInterval = setInterval(fetchEmergencyAlerts, 2000); 
    return () => clearInterval(alertInterval);
  }, []);

  // 👉 LẮNG NGHE MÁY QUÉT RFID KHI MỞ MODAL
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

  // 👉 HÀM LÕI XỬ LÝ XÁC THỰC
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
      toast.error(error.response?.data?.message || "Mật khẩu sai hoặc Thẻ không có quyền!");
      setAuthScannedRfid(""); 
      dispatch(resetLastRfid()); 
    } finally {
      setIsVerifying(false);
    }
  };

  // 👉 NHẬN DỮ LIỆU THẺ VÀ TỰ ĐỘNG XÁC THỰC LUÔN 
  useEffect(() => {
    if (lastRfid && authModalConfig.isOpen) {
      const rfidString = lastRfid.rfidTag || lastRfid; 
      
      setAuthScannedRfid(rfidString);
      setAdminPassword(""); 
      toast.success("Đã nhận thẻ! Đang tự động đăng nhập...");
      
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

  return (
    <>
      <div className="bg-[#0f172a] text-slate-300 min-h-screen w-full flex flex-col p-5 shadow-2xl z-40 relative">
        <div className="mb-8 text-center border-b border-slate-700/50 pb-6">
          <Link to="/admin" className="text-3xl font-black tracking-wider text-white uppercase">
            SHOP<span className="text-blue-500">ADMIN</span>
          </Link>
        </div>

        {/* Profile Card */}
        <div className="bg-slate-800/50 p-4 rounded-2xl mb-8 flex items-center gap-4 border border-slate-700/50 backdrop-blur-sm">
          <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center bg-slate-700 border-2 border-blue-500 shrink-0">
            {user?.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-xl font-bold text-white">{user?.name?.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div className="overflow-hidden">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">Xin chào,</p>
            <p className="text-base font-bold text-white truncate max-w-[150px]">{user?.name || "Admin"}</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-1.5 flex-grow overflow-y-auto pr-2 custom-scrollbar">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 pl-2">Menu quản trị</p>
          
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={(e) => handleNavClick(e, item)}
              className={({ isActive }) =>
                `flex items-center justify-between py-3 px-4 rounded-2xl transition-all duration-300 font-medium group ${
                  isActive
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" 
                    : "text-slate-400 hover:bg-slate-800 hover:text-slate-100" 
                }`
              }
            >
              <div className="flex items-center gap-4">
                 <div className={`transition-transform duration-300 group-hover:scale-110 ${({isActive}) => isActive ? "text-white" : "text-slate-400"}`}>
                    {item.icon}
                 </div>
                 <span className="text-sm">{item.name}</span>
              </div>
              {item.requiresAuth && (
                 <IoLockClosedOutline size={14} className={`transition-opacity ${authModalConfig.isOpen ? 'opacity-100' : 'opacity-40 group-hover:opacity-100'}`} />
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer Actions */}
        <div className="mt-6 pt-6 border-t border-slate-700/50 space-y-3">
          <button onClick={() => navigate("/admin/searchRFID")} className="w-full bg-slate-800 text-blue-400 hover:bg-blue-500 hover:text-white border border-slate-700 py-3 px-4 rounded-2xl flex items-center justify-center gap-3 transition-all duration-300 font-bold text-sm group">
            <IoScanOutline className="group-hover:rotate-12 transition-transform" size={20} />
            <span>Tra cứu sản phẩm</span>
          </button>

          <button onClick={handleLogout} className="w-full bg-slate-800 text-red-400 hover:bg-red-500 hover:text-white border border-slate-700 py-3 px-4 rounded-2xl flex items-center justify-center gap-3 transition-all duration-300 font-bold text-sm group">
            <FaSignOutAlt className="group-hover:-translate-x-1 transition-transform" size={18} />
            <span>Đăng xuất</span>
          </button>
        </div>
      </div>

      {/* MODAL XÁC THỰC BẢO MẬT */}
      {authModalConfig.isOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-[9999] px-4 bg-slate-900/60 backdrop-blur-md transition-opacity">
           <div className="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl border border-gray-100 transform transition-all">
              
              <div className="flex flex-col items-center justify-center text-center mb-6">
                  <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4 shadow-inner">
                      <IoShieldCheckmarkOutline size={32} />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800">Xác thực quyền hạn</h3>
                  <p className="text-sm text-slate-500 mt-2 px-4 leading-relaxed">
                     Khu vực này được bảo mật. Vui lòng quét thẻ nhân viên hoặc nhập mật khẩu để truy cập.
                  </p>
              </div>
              
              <form onSubmit={handleVerifyAccess}>
                 <div className="relative mb-6 cursor-default">
                    <div className={`absolute inset-0 rounded-2xl border-2 border-dashed transition-all duration-500 ${authScannedRfid ? 'border-green-400 bg-green-50' : 'border-blue-200 bg-blue-50/50'}`}></div>
                    
                    <div className="relative p-6 flex flex-col items-center justify-center text-center min-h-[120px]">
                        {authScannedRfid ? (
                             <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
                                 <IoScanOutline size={36} className="text-green-500 mb-2" />
                                 <span className="font-mono font-bold text-green-700 tracking-widest text-xl">{authScannedRfid}</span>
                                 <span className="text-[10px] text-green-600 uppercase font-bold mt-1 bg-green-200/50 px-3 py-1 rounded-full">Đang tự động xác thực...</span>
                             </div>
                        ) : (
                             <div className="flex flex-col items-center">
                                 <IoScanOutline size={36} className="text-blue-400 mb-2 animate-pulse" />
                                 <span className="text-sm font-bold text-blue-600">Đang chờ tín hiệu RFID...</span>
                                 <span className="text-xs text-slate-400 mt-1">Hệ thống sẽ tự động vào khi quét thẻ thành công</span>
                             </div>
                        )}
                    </div>
                 </div>

                 <div className="flex items-center justify-center gap-4 my-6">
                    <div className="h-[1px] bg-slate-100 flex-1"></div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Hoặc dùng mật khẩu</span>
                    <div className="h-[1px] bg-slate-100 flex-1"></div>
                 </div>

                 <div className="mb-8">
                    <input 
                       type="password" 
                       value={adminPassword}
                       onChange={(e) => {
                         setAdminPassword(e.target.value);
                         if(authScannedRfid) setAuthScannedRfid("");
                       }}
                       placeholder="Nhập mật khẩu Admin..."
                       className="w-full px-5 py-3.5 bg-slate-50 rounded-2xl outline-none border border-slate-200 text-sm focus:border-blue-500 focus:bg-white transition-all shadow-sm" 
                    />
                 </div>

                 <div className="flex gap-3">
                    <button type="button" onClick={() => setAuthModalConfig({isOpen: false, targetPath: null})} className="flex-1 py-3.5 bg-white border border-slate-200 text-slate-700 rounded-2xl font-bold text-sm hover:bg-slate-50 transition-colors">
                       Hủy bỏ
                    </button>
                    <button type="submit" disabled={isVerifying || !adminPassword} className="flex-1 py-3.5 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 text-sm shadow-lg shadow-blue-600/30 transition-all">
                      {isVerifying ? "Đang xác thực..." : "Mở khóa ngay"}
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