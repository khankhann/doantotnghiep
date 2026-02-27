import { Link, useNavigate } from "react-router-dom";
import {
  HiOutlineUser,
  HiOutlineShoppingBag,
  HiBars3BottomRight,
} from "react-icons/hi2";
import { IoCloseOutline } from "react-icons/io5";
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
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

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
  const {orders} = useSelector((state) => state.orders)

  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const closeNotifyRef = useRef(null);

  useEffect(() => {
    if (user) {
      dispatch(fetchNotifications());
    }
  }, [user, dispatch]);

  // Xử lý click ra ngoài để đóng
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (closeNotifyRef.current && !closeNotifyRef.current.contains(e.target)) {
        setIsNotificationOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);


  // Lắng nghe Socket Realtime
  useEffect(() => {
    if (!user) return;
    socket.emit("join_room", user._id);

    const handleNewNotification = (newNotify) => {
      console.log("📩 CLIENT ĐÃ NHẬN ĐƯỢC QUÀ:", newNotify);
      dispatch(addNotification(newNotify));
    };

    socket.on("receive_notification", handleNewNotification);

    return () => {
      socket.off("receive_notification", handleNewNotification);
    };
  }, [user, dispatch]);

  const handleNotificationClick = (notifyId)=>{
    dispatch(markNotificationAsRead(notifyId._id))
    setIsNotificationOpen(!isNotificationOpen)
    if(notifyId.type === "ORDER_UPDATE" && notifyId.orderId){
      navigate(`/order/${notifyId.orderId}`)
    }else if(notifyId.type === "NEW_PRODUCT"){
      navigate("/collections/all")
    }
  }


  const cartItemCount =
    cart?.products?.reduce((total, product) => {
      return total + product.quantity;
    }, 0) || 0;

  const unreadCount = notifications.filter((n) => !n.read).length;



  const toggleShopCart = () => {
    setisShopCartOpen(!isShopCartOpen);
  };

  const toggleNavMobile = (e) => {
    setIsNavMobileOpen(!isNavMobileOpen);
    const closeNav = e.target.closest(".container");
    if (closeNav) {
      setIsNavMobileOpen(!isNavMobileOpen);
    }
  };
console.log(notifications)
  return (
    <>
      <nav className="container mx-auto flex items-center justify-between py-4 px-6 relative">
        {/* {left - logo } */}
        <div>
          <Link to="/" className="text-3xl font-medium">
            Shop
          </Link>
        </div>
        {/* {center - Navigate } */}
        <div className="hidden md:flex space-x-6 ">
          <Link to="/collections/all?gender=Men" className="text-gray-700 hover:text-black text-sm font-medium uppercase transition-all duration-500 ease-in-out">
            {t("navbar.men")}
          </Link>
          <Link to="/collections/all?gender=Women" className="text-gray-700 hover:text-black text-sm font-medium uppercase transition-all duration-500 ease-in-out">
            {t("navbar.women")}
          </Link>
          <Link to="/collections/all?category=Top Wear" className="text-gray-700 hover:text-black text-sm font-medium uppercase transition-all duration-500 ease-in-out">
            {t("navbar.topWear")}
          </Link>
          <Link to="/collections/all?category=Bottom Wear" className="text-gray-700 hover:text-black text-sm font-medium uppercase transition-all duration-500 ease-in-out">
            {t("navbar.bottomWear")}
          </Link>
          <Link to="/product-recommend" className="text-gray-700 hover:text-black text-sm font-medium uppercase transition-all duration-500 ease-in-out">
            Recommend
          </Link>
        </div>

        {/* {Right - Menu} */}
        <div className="flex items-center space-x-4">
          <div>
            <LanguageToggle />
          </div>
          {user && user.role === "admin" && (
            <Link to="/admin" className=" block bg-black px-2 rounded text-sm text-white ">
              Admin
            </Link>
          )}
          <Link to="/profile" className="hover:text-black transition-all duration-500 ease-in-out">
            <HiOutlineUser className="h-6 w-6 text-gray-700 " />
          </Link>

          {/* shop cart  */}
          <button className="relative hover:text-black " onClick={toggleShopCart} type="ShopCart">
            <HiOutlineShoppingBag className="h-6 w-6 text-gray-700 " />
            {cartItemCount > 0 && (
              <span className="absolute -top-1 bg-[#ea2e0e] text-white text-xs rounded-full px-2 py-0.5 ">
                {cartItemCount}
              </span>
            )}
          </button>

          {/* notification  */}
          {/* --- Notification Dropdown Start --- */}
          <div className="relative" ref={closeNotifyRef}>
            <button
              className="relative hover:text-black flex items-center transition-colors"
              onClick={() => setIsNotificationOpen(!isNotificationOpen)}
            >
              <IoIosNotificationsOutline className="h-6 w-6 text-gray-700 hover:text-black transition-colors" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#ea2e0e] text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center animate-bounce">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Dropdown UI - SỬA LẠI PHẦN NÀY ĐỂ CÓ ANIMATION */}
            <div
              className={`absolute right-0 mt-3 w-80 max-w-[90vw] bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden 
              transition-all duration-300 ease-in-out transform origin-top-right
              ${
                isNotificationOpen
                  ? "opacity-100 scale-100 translate-y-0 visible" // Trạng thái mở
                  : "opacity-0 scale-95 -translate-y-2 invisible pointer-events-none" // Trạng thái đóng
              }`}
            >
              {/* Header */}
              <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                <h3 className="text-sm font-bold text-gray-800">Thông báo ({unreadCount})</h3>
                <button
                  onClick={() => setIsNotificationOpen(false)}
                  className="text-xs text-gray-500 hover:text-red-500 font-medium transition-colors"
                >
                  Đóng
                </button>
              </div>

              {/* List Content */}
              <div className="max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200">
                {notifications.length > 0 ? (
                  notifications.map((note) => (
                    <div
                      key={note._id || note.id}
                      onClick={() => handleNotificationClick(note)}
                      className={`px-5 py-4 cursor-pointer border-b border-gray-50 last:border-none transition-all duration-200 hover:bg-gray-50 flex items-start gap-3 ${
                        !note.read ? "bg-blue-50/60" : "bg-white"
                      }`}
                    >
                      <div className={`mt-1.5 h-2 w-2 rounded-full flex-shrink-0 ${!note.read ? "bg-blue-500" : "bg-gray-300"}`}></div>
                      <div className="flex-1">
                        <p className={`text-sm leading-snug ${!note.read ? "font-semibold text-gray-900" : "text-gray-600"}`}>
                          {note.message}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-1">
                          {formatDistanceToNow(new Date(note.createdAt), { addSuffix: true, locale: vi })}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-5 py-8 text-center flex flex-col items-center">
                    <IoIosNotificationsOutline className="h-10 w-10 text-gray-300 mb-2" />
                    <p className="text-gray-500 text-sm">Bạn chưa có thông báo nào</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-4 py-3 bg-gray-50 text-center border-t border-gray-100 hover:bg-gray-100 transition-colors cursor-pointer">
                <Link
                  to={"/notifications"}
                  className="text-xs text-black font-bold uppercase tracking-wider"
                  onClick={() => setIsNotificationOpen(false)}  
                >
                  Xem tất cả
                </Link>
              </div>
            </div>
          </div>
          {/* --- Notification Dropdown End --- */}

          {/* {search} */}
          <div className=" overflow-hidden ">
            <SearchBar />
          </div>
          <button className=" md:hidden " onClick={toggleNavMobile}>
            <HiBars3BottomRight className=" h-6 w-6 text-gray-700 " />
          </button>
        </div>
      </nav>
      <ShopCart openShopCart={isShopCartOpen} toggleShopCart={toggleShopCart} />

      {/* {mobile Navigate} */}
      <div className="container">
        {isNavMobileOpen ? (
          <div
            className=" fixed z-10 top-0 right-0 left-0 bottom-0 bg-[#0000004d] 
        transition-all duration-300 ease-in-out "
            onClick={toggleNavMobile}
          ></div>
        ) : (
          <div> </div>
        )}

        <div
          className={` fixed top-0 left-0 w-3/4 sm:w-1/2 md:w-1/3 h-full bg-white 
        shadow-lg transform transition-transform duration-300 z-50 
        ${isNavMobileOpen ? "translate-x-0" : "-translate-x-full"} `}
        >
          <div className="flex justify-end p-4  ">
            <button onClick={toggleNavMobile}>
              <IoCloseOutline className="h-6 w-6 text-gray-600 transition-all duration-300 ease-in-out hover:rotate-180" />
            </button>
          </div>
          <div className="p-4">
            <h2 className="text-xl font-semibold mb-4">Menu</h2>
            <nav className="space-y-4 ">
              <Link to="/collections/all?gender=Men" className="block text-gray-600 hover:text-black" onClick={toggleNavMobile}>
                Men
              </Link>
              <Link to="/collections/all?gender=Women" className="block text-gray-600 hover:text-black" onClick={toggleNavMobile}>
                Women
              </Link>
              <Link to="/collections/all?category=Top Wear" className="block text-gray-600 hover:text-black" onClick={toggleNavMobile}>
                Top Wear
              </Link>
              <Link to="/collections/all?category=Bottom Wear" className="block text-gray-600 hover:text-black" onClick={toggleNavMobile}>
                Bottom wear
              </Link>
            </nav>
          </div>
        </div>
      </div>
    </>
  );
}

export default Navbar;