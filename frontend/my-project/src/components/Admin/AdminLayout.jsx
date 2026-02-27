import { useState, useEffect } from "react";
import { MdOpenInFull } from "react-icons/md";
import { MdOutlineCloseFullscreen } from "react-icons/md";
import { HiMiniBars3BottomLeft } from "react-icons/hi2";
import AdminSidebar from "./AdminSidebar/AdminSidebar";
import { Outlet } from "react-router-dom";

function AdminLayout() {
 
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row relative bg-gray-100">
      
      {/* 1. THANH HEADER DÀNH RIÊNG CHO MOBILE */}
      <div className="flex md:hidden p-4 bg-gray-900 text-white z-30">
        <button onClick={toggleSidebar} className="focus:outline-none hover:text-gray-300">
          <HiMiniBars3BottomLeft size={24} />
        </button>
        <h1 className="ml-4 text-xl font-medium"> Admin Dashboard </h1>
      </div>

      
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black/50 md:hidden" 
          onClick={toggleSidebar}
        ></div>
      )}

      
      <div 
        className={`bg-gray-900 min-h-screen text-white transition-all duration-300 z-30 overflow-hidden
          absolute md:relative
         
          ${isSidebarOpen 
            ? "translate-x-0 w-64" 
            : "-translate-x-full w-64 md:translate-x-0 md:w-0"
          }
        `}
      > 
         
         <div className="w-64 h-full">
           <AdminSidebar />
         </div>
      </div>

    
      <div className="flex-grow flex flex-col h-screen overflow-hidden"> 
        
      
        <div className="hidden md:flex items-center p-4 bg-white shadow-sm z-10">
           <button 
             onClick={toggleSidebar} 
             className="text-gray-600 hover:text-gray-900 focus:outline-none transition-colors"
           >
             {isSidebarOpen ? <MdOpenInFull size={24} /> : <MdOutlineCloseFullscreen size={24} /> }  
           </button>
           <h1 className="ml-4 text-xl font-bold text-gray-800">Shop</h1>
        </div>

       
        <div className="flex-1 p-6 overflow-auto"> 
          <Outlet />
        </div>

      </div>
    </div>
  );
}

export default AdminLayout;