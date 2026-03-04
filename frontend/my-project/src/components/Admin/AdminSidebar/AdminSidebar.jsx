import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  FaUser,
  FaStore,
  FaClipboardList,
  FaBoxOpen,
  FaSignOutAlt,
} from "react-icons/fa";
import { RiMessage2Fill } from "react-icons/ri";

import { BsPostcard } from "react-icons/bs";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "@redux/slices/authSlice";
import { clearCart } from "@redux/slices/cartSlice";

function AdminSidebar() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const handleLogout = () => {
    if (window.confirm("Bạn có chắc muốn đăng xuất?")) {
      dispatch(logout());
      dispatch(clearCart());
      navigate("/");
    }
  };

  // 👇 Gom gọn menu vào 1 mảng để code không bị lặp đi lặp lại (Chuẩn DRY)
  const navItems = [
    { path: "/admin/users", name: "Quản lý Users", icon: <FaUser size={18} /> },
    { path: "/admin/products", name: "Quản lý Products", icon: <FaBoxOpen size={18} /> },
    { path: "/admin/orders", name: "Quản lý Orders", icon: <FaClipboardList size={18} /> },
    { path: "/admin/news", name: "Quản lý Bài viết", icon: <BsPostcard size={18} /> },
    { path: "/admin/chat", name: "Quản lý tin nhan", icon: <RiMessage2Fill size={18} /> },
    

    { path: "/", name: "Về trang Shop", icon: <FaStore size={18} /> },
  ];

  return (
    // 👇 Giao diện Dark mode cực ngầu cho Admin
    <div className="bg-gray-900 text-white min-h-screen w-full flex flex-col p-5 shadow-2xl">
      
      {/* 1. Logo & Tiêu đề */}
      <div className="mb-8 text-center border-b border-gray-700 pb-6">
        <Link to="/admin" className="text-3xl font-black tracking-wider text-white uppercase">
          SHOP<span className="text-blue-500">ADMIN</span>
        </Link>
      </div>

      {/* 2. Thông tin User */}
      <div className="bg-gray-800 p-4 rounded-xl mb-8 flex items-center gap-4 border border-gray-700 shadow-inner">
        <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-xl font-bold shadow-md">
          {user?.name?.charAt(0).toUpperCase() }
        </div>
        <div>
          <p className="text-xs text-gray-400 font-medium uppercase tracking-widest mb-1">Welcome back,</p>
          <p className="text-lg font-bold text-white truncate max-w-[150px]">{user?.name || "Admin"}</p>
        </div>
      </div>

      {/* 3. Menu Điều hướng (NavLinks) */}
      <nav className="flex flex-col gap-2 flex-grow">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2 pl-2">Menu chính</p>
        
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-4 py-3 px-4 rounded-xl transition-all duration-300 font-medium ${
                isActive
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30 translate-x-1" // Hiệu ứng đang active
                  : "text-gray-400 hover:bg-gray-800 hover:text-white hover:translate-x-1" // Hiệu ứng khi lướt chuột
              }`
            }
          >
            <div className={`${({isActive}) => isActive ? "text-white" : "text-gray-400"}`}>
               {item.icon}
            </div>
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      {/* 4. Nút Đăng xuất nằm ở dưới cùng */}
      <div className="mt-8 pt-6 border-t border-gray-800">
        <button
          onClick={handleLogout}
          className="w-full bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20 py-3 px-4 rounded-xl flex items-center justify-center gap-3 transition-all duration-300 font-bold group"
        >
          <FaSignOutAlt className="group-hover:-translate-x-1 transition-transform" size={18} />
          <span>Đăng xuất</span>
        </button>
      </div>
    </div>
  );
}

export default AdminSidebar;