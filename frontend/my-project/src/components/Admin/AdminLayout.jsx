import { useState, useEffect } from "react";
import { MdMenu, MdMenuOpen } from "react-icons/md"; 
import AdminSidebar from "./AdminSidebar/AdminSidebar";
import { Outlet, useLocation } from "react-router-dom";

function AdminLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const location = useLocation();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000); 
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsSidebarOpen(true); 
      } else {
        setIsSidebarOpen(false); 
      }
    };
    
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  }, [location]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex h-screen w-full bg-gray-50 overflow-hidden font-sans">
      
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300"
          onClick={toggleSidebar}
        ></div>
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 bg-gray-900 text-white shadow-2xl transform transition-all duration-300 ease-in-out flex flex-col
          ${isSidebarOpen ? "translate-x-0 w-64" : "-translate-x-full w-64"}
          md:relative md:translate-x-0 
          ${!isSidebarOpen && "md:w-0 md:overflow-hidden"} 
        `}
      >
        <div className="w-64 h-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700">
          <AdminSidebar />
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
        
        <header className="bg-white shadow-sm border-b border-gray-200 h-16 flex items-center justify-between px-4 sm:px-6 z-10 flex-shrink-0">
          <div className="flex items-center gap-4">
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

            {/* 🔥 KHU VỰC ĐỒNG HỒ & NGÀY THÁNG */}
            <div className="hidden sm:flex items-center gap-2.5 bg-slate-50 px-3.5 py-1.5 rounded-lg border border-slate-200 shadow-sm ml-2">
               
               {/* Ngày tháng năm */}
               <span className="text-sm font-bold text-gray-600">
                 {currentTime.toLocaleDateString("vi-VN")}
               </span>
               
               {/* Vạch ngăn cách */}
               <span className="text-gray-300 font-light">|</span>
               
               {/* Giờ:Phút:Giây */}
               <span className="text-sm font-bold text-gray-800 font-mono tracking-widest min-w-[70px]">
                 {currentTime.toLocaleTimeString("vi-VN", { hour12: false })}
               </span>
            </div>

          </div>

          <div className="flex items-center gap-3">
             <div className="md:hidden text-lg font-bold text-gray-800 tracking-tighter">
                SHOP<span className="text-blue-600">ADMIN</span>
             </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-gray-50/50 p-4 sm:p-6 lg:p-8 scrollbar-thin scrollbar-thumb-gray-300">
          <div className="max-w-7xl mx-auto h-full">
            <Outlet />
          </div>
        </main>

      </div>
    </div>
  );
}

export default AdminLayout;