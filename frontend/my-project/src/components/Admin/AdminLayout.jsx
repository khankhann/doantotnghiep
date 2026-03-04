import { useState, useEffect } from "react";
import { MdMenu, MdMenuOpen } from "react-icons/md"; // Dùng icon này cho chuẩn Sidebar
import AdminSidebar from "./AdminSidebar/AdminSidebar";
import { Outlet, useLocation } from "react-router-dom";

function AdminLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();

  // 👇 1. Lắng nghe kích thước màn hình để tự động Đóng/Mở Sidebar
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsSidebarOpen(true); // Desktop thì mở
      } else {
        setIsSidebarOpen(false); // Mobile thì đóng
      }
    };
    
    // Chạy lần đầu khi load trang
    handleResize();
    
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // 👇 2. Tự động đóng Sidebar trên Mobile khi click vào menu chuyển trang
  useEffect(() => {
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  }, [location]); // Chạy mỗi khi URL thay đổi

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    // Wrapper chính: Full màn hình, không cho scroll body
    <div className="flex h-screen w-full bg-gray-50 overflow-hidden font-sans">
      
      {/* 🌑 OVERLAY CHO MOBILE (Làm mờ nền khi mở Sidebar) */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300"
          onClick={toggleSidebar}
        ></div>
      )}

      {/* 🚀 SIDEBAR COMPONENT */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 bg-gray-900 text-white shadow-2xl transform transition-all duration-300 ease-in-out flex flex-col
          /* Xử lý trên Mobile: Trượt ra vào */
          ${isSidebarOpen ? "translate-x-0 w-64" : "-translate-x-full w-64"}
          /* Xử lý trên Desktop: Đẩy Content sang ngang */
          md:relative md:translate-x-0 
          ${!isSidebarOpen && "md:w-0 md:overflow-hidden"} 
        `}
      >
        {/* Bọc 1 lớp div cố định w-64 để khi thu nhỏ (md:w-0) layout bên trong không bị bóp méo */}
        <div className="w-64 h-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700">
          <AdminSidebar />
        </div>
      </aside>

      {/* 🖥️ VÙNG NỘI DUNG CHÍNH (Header + Outlet) */}
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
        
        {/* HEADER DÙNG CHUNG (Cả Mobile & Desktop) */}
        <header className="bg-white shadow-sm border-b border-gray-200 h-16 flex items-center justify-between px-4 sm:px-6 z-10 flex-shrink-0">
          <div className="flex items-center gap-4">
            {/* Nút Hamburger Toggle */}
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-xl text-gray-600 bg-gray-50 hover:bg-blue-50 hover:text-blue-600 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              title="Toggle Sidebar"
            >
              {isSidebarOpen ? <MdMenuOpen size={24} /> : <MdMenu size={24} />}
            </button>
            
            <h1 className="text-xl font-black text-gray-800 tracking-tight hidden sm:block">
              Quản trị viên
            </h1>
          </div>

          {/* Cụm chức năng góc phải (Fen có thể chèn chuông thông báo, avatar vào đây sau này) */}
          <div className="flex items-center gap-3">
             <div className="md:hidden text-lg font-bold text-gray-800 tracking-tighter">
                SHOP<span className="text-blue-600">ADMIN</span>
             </div>
          </div>
        </header>

        {/* MAIN CONTENT (Vùng chứa các trang con) */}
        <main className="flex-1 overflow-y-auto bg-gray-50/50 p-4 sm:p-6 lg:p-8 scrollbar-thin scrollbar-thumb-gray-300">
          {/* Giới hạn độ rộng để content không bị bè ra quá dài trên màn siêu to */}
          <div className="max-w-7xl mx-auto h-full">
            <Outlet />
          </div>
        </main>

      </div>
    </div>
  );
}

export default AdminLayout;