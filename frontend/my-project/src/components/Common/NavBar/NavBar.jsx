import { Link, useNavigate } from "react-router-dom";
import {
  HiOutlineUser,
  HiOutlineShoppingBag,
  HiBars3BottomRight,
} from "react-icons/hi2";
// 👇 1. Thêm IoCameraOutline vào đây
import { IoCloseOutline, IoCameraOutline } from "react-icons/io5"; 
import { IoIosNotificationsOutline } from "react-icons/io";

import { useContext, useState, useEffect, useRef } from "react";
import { SideBarContext } from "@context/SideBarContext";
import SearchBar from "@components/Common/SearchBar/SearchBar";
import ShopCart from "@components/Common/ShopCart/ShopCart";
import { useDispatch, useSelector } from "react-redux";
import LanguageToggle from "../../LanguageToggle/LanguageToggle";
import { useTranslation } from "react-i18next";
import { addNotification, fetchNotifications } from "@redux/slices/notificationSlice";
import { markNotificationAsRead } from "@redux/slices/notificationSlice";
import socket from "@components/socket/Socket";
import Notifications from "../Notifications/Notifications";

import { motion, AnimatePresence } from "framer-motion";

// 👇 2. Import cái Modal AI vừa tạo vào đây 
// (Nhớ chỉnh lại đường dẫn cho đúng với thư mục của fen nhé)
import VisualSearchModal from "../../Common/VisualSearchModai/VisualSearchModai"; 

function Navbar() {
  const {
    isShopCartOpen,
    setisShopCartOpen,
    isNavMobileOpen,
    setIsNavMobileOpen,
  } = useContext(SideBarContext);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { cart } = useSelector((state) => state.cart);
  const { user } = useSelector((state) => state.auth);
  const { notifications } = useSelector((state) => state.notifications);

  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const closeNotifyRef = useRef(null);
  
  const [isSticky, setIsSticky] = useState(false);

  // 👇 3. Khai báo state để bật/tắt Modal AI
  const [isVisualSearchOpen, setIsVisualSearchOpen] = useState(false);

  useEffect(() => {
    if (user) {
      dispatch(fetchNotifications());
    }
  }, [user, dispatch]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest("#notify-container")) {
        setIsNotificationOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!user) return;
    socket.emit("join_room", user._id);
    const handleNewNotification = (newNotify) => {
      dispatch(addNotification(newNotify));
    };
    socket.on("receive_notification", handleNewNotification);
    return () => socket.off("receive_notification", handleNewNotification);
  }, [user, dispatch]);

  // BẮT SỰ KIỆN SCROLL QUÁ 300PX
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setIsSticky(true);
      } else {
        setIsSticky(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleNotificationClick = (notifyId) => {
    dispatch(markNotificationAsRead(notifyId._id));
    setIsNotificationOpen(false);
    if (notifyId.type === "ORDER_UPDATE" && notifyId.orderId) {
      navigate(`/order/${notifyId.orderId}`);
    } else if (notifyId.type === "NEW_PRODUCT") {
      navigate("/collections/all");
    }
  };

  const cartItemCount = cart?.products?.reduce((total, product) => total + product.quantity, 0) || 0;
  const unreadCount = notifications.filter((n) => !n.read).length;
  const toggleShopCart = () => setisShopCartOpen(!isShopCartOpen);
  const toggleNavMobile = () => setIsNavMobileOpen(!isNavMobileOpen);

  // ==========================================
  // GÓI TOÀN BỘ UI NAVBAR VÀO 1 BIẾN
  // ==========================================
  const navContent = (
    <nav className="container mx-auto flex items-center justify-between py-3 md:py-4 px-4 md:px-6">
      {/* Left - Logo */}
      <div>
        <Link to="/" className="text-2xl md:text-3xl font-medium tracking-tight">Shop</Link>
      </div>

      {/* Center - Navigate */}
      <div className="hidden md:flex space-x-6">
        <Link to="/collections/all?gender=Men" className="text-gray-700 hover:text-black text-sm font-medium uppercase transition-colors">{t("navbar.men")}</Link>
        <Link to="/collections/all?gender=Women" className="text-gray-700 hover:text-black text-sm font-medium uppercase transition-colors">{t("navbar.women")}</Link>
        <Link to="/collections/all?category=Top Wear" className="text-gray-700 hover:text-black text-sm font-medium uppercase transition-colors">{t("navbar.topWear")}</Link>
        <Link to="/collections/all?category=Bottom Wear" className="text-gray-700 hover:text-black text-sm font-medium uppercase transition-colors">{t("navbar.bottomWear")}</Link>
        <Link to="/product-recommend" className="text-gray-700 hover:text-black text-sm font-medium uppercase transition-colors">Recommend</Link>
        <Link to="/news" className="text-gray-700 hover:text-black text-sm font-medium uppercase transition-colors"> About us</Link>
      </div>

      {/* Right - Menu */}
      <div className="flex items-center gap-3 md:gap-4">
        <div className="hidden md:block"><LanguageToggle /></div>
        {user && user.role === "admin" && (
          <Link to="/admin" className="hidden md:block bg-black px-2 py-0.5 rounded text-xs text-white">Admin</Link>
        )}
        <Link to="/profile" className=" hover:text-black transition-colors">
          <HiOutlineUser className="h-6 w-6 text-gray-700" />
        </Link>

        <button className="relative hover:text-black transition-colors" onClick={toggleShopCart}>
          <HiOutlineShoppingBag className="h-5 w-5 md:h-6 md:w-6 text-gray-700" />
          {cartItemCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-[#ea2e0e] text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
              {cartItemCount}
            </span>
          )}
        </button>

        <div className="relative" id = "notify-container">
          {/* --- UI Notifications rút gọn để tiết kiệm không gian hiển thị code --- */}
          <button className="relative hover:text-black flex items-center transition-colors" onClick={() => setIsNotificationOpen(!isNotificationOpen)}>
            <IoIosNotificationsOutline className="h-6 w-6 md:h-7 md:w-7 text-gray-700 hover:text-black transition-colors" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#ea2e0e] text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center animate-bounce">
                {unreadCount}
              </span>
            )}
          </button>
          
          <div className={`absolute right-[-40px] sm:right-0 mt-3 w-[300px] md:w-80 max-w-[90vw] bg-white rounded-xl shadow-2xl border border-gray-100 z-30 overflow-hidden transition-all duration-300 ease-in-out transform origin-top-right ${isNotificationOpen ? "opacity-100 scale-100 translate-y-0 visible" : "opacity-0 scale-95 -translate-y-2 invisible pointer-events-none"}`}>
            <div className="px-4 py-3 border-b bg-gray-50 flex justify-between items-center">
              <h3 className="text-sm font-bold text-gray-800">Thông báo ({unreadCount})</h3>
              <button onClick={() => setIsNotificationOpen(false)} className="text-xs text-gray-500 hover:text-red-500 font-medium">Đóng</button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto">
              {notifications.length > 0 ? notifications.map((note) => (
                <Notifications key={note._id} notify={note} onClick={() => handleNotificationClick(note)} isCompact={true} />
              )) : (
                <div className="px-5 py-8 text-center text-gray-500 text-sm">Bạn chưa có thông báo nào</div>
              )}
            </div>
            <div className="px-4 py-3 bg-gray-50 text-center border-t hover:bg-gray-100 cursor-pointer">
              <Link to="/notifications" onClick={() => setIsNotificationOpen(false)} className="text-xs font-bold uppercase">Xem tất cả</Link>
            </div>
          </div>
        </div>

        {/* 👇 4. NÚT CAMERA AI ĐƯỢC CHÈN VÀO ĐÂY (Ngay cạnh thanh Search) */}
        <button 
          onClick={() => setIsVisualSearchOpen(true)}
          className="hover:text-black transition-transform hover:scale-110"
          title="Tìm kiếm bằng hình ảnh (AI)"
        >
          <IoCameraOutline className="h-6 w-6 md:h-7 md:w-7 text-gray-700" />
        </button>

        <div className="overflow-hidden"><SearchBar /></div>
        <button className="md:hidden" onClick={toggleNavMobile}><HiBars3BottomRight className="h-6 w-6 text-gray-800" /></button>
      </div>
    </nav>
  );

  return (
    <>
      <header className="w-full bg-white/50 border-b border-white/40 z-30">
        {navContent}
      </header>

      <AnimatePresence>
        {isSticky && (
          <motion.header
            className="fixed top-0 left-0 w-full z-[30] bg-white/95 backdrop-blur-md shadow-md" 
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            {navContent}
          </motion.header>
        )}
      </AnimatePresence>

      <ShopCart openShopCart={isShopCartOpen} toggleShopCart={toggleShopCart} />

      {/* 👇 5. GỌI COMPONENT MODAL AI VÀO ĐÂY ĐỂ NÓ RENDER ĐÈ LÊN MỌI THỨ */}
      <VisualSearchModal 
        isOpen={isVisualSearchOpen} 
        onClose={() => setIsVisualSearchOpen(false)} 
      />

      {/* --- MOBILE SIDEBAR MENU (Giữ nguyên) --- */}
      <div className="container">
        {isNavMobileOpen && (
          <div
            className="fixed z-50 top-0 right-0 left-0 bottom-0 bg-black/50 backdrop-blur-sm transition-all duration-300 ease-in-out"
            onClick={toggleNavMobile}
          ></div>
        )}

        <div
          className={`fixed top-0 left-0 w-[80vw] sm:w-1/2 md:w-1/3 h-full bg-white shadow-2xl transform transition-transform duration-500 z-50 flex flex-col
          ${isNavMobileOpen ? "translate-x-0" : "-translate-x-full"}`}
        >
          {/* NỘI DUNG MOBILE MENU CỦA FEN NẰM Ở ĐÂY */}
          <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50">
            <span className="text-xl font-bold tracking-tight">Menu</span>
            <button onClick={toggleNavMobile} className="bg-white p-2 rounded-full shadow-sm">
              <IoCloseOutline className="h-6 w-6 text-gray-800 transition-all hover:rotate-180" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-6">
            <nav className="flex flex-col space-y-5">
              <Link to="/collections/all?gender=Men" className="text-gray-600 hover:text-black font-medium text-lg" onClick={toggleNavMobile}>Men</Link>
              <Link to="/collections/all?gender=Women" className="text-gray-600 hover:text-black font-medium text-lg" onClick={toggleNavMobile}>Women</Link>
              <Link to="/collections/all?category=Top Wear" className="text-gray-600 hover:text-black font-medium text-lg" onClick={toggleNavMobile}>Top Wear</Link>
              <Link to="/collections/all?category=Bottom Wear" className="text-gray-600 hover:text-black font-medium text-lg" onClick={toggleNavMobile}>Bottom Wear</Link>
            </nav>
          </div>
        </div>
      </div>
    </>
  );
}

export default Navbar;