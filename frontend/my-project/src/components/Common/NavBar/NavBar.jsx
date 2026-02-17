import { Link } from "react-router-dom";
import {
  HiOutlineUser,
  HiOutlineShoppingBag,
  HiBars3BottomRight,
} from "react-icons/hi2";
import { IoCloseOutline } from "react-icons/io5";

import { useContext } from "react";
import { SideBarContext } from "@context/SideBarContext";
import SearchBar from "@components/Common/SearchBar/SearchBar";
import ShopCart from "@components/Common/ShopCart/ShopCart";
import { useSelector } from "react-redux";
function Navbar() {
  const {
    isShopCartOpen,
    setisShopCartOpen,
    isNavMobileOpen,
    setIsNavMobileOpen,
  } = useContext(SideBarContext);
const {cart} = useSelector((state)=> state.cart)
const cartItemCount = cart?.products?.reduce((total , product) => {
  return total + product.quantity 
},0) || 0

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

  return (
    <>
      <nav className="container mx-auto flex items-center justify-between py-4 px-6">
        {/* {left - logo } */}
        <div>
          <Link to="/" className="text-3xl font-medium">
            Shop
          </Link>
        </div>
        {/* {center - Navigate } */}
        <div className="hidden md:flex space-x-6 ">
          <Link
            to="/collections/all?gender=Men"
            className="text-gray-700 hover:text-black text-sm font-medium uppercase transition-all duration-500 ease-in-out">
            Men
          </Link>
          <Link
            to="/collections/all?gender=Women"
            className="text-gray-700 hover:text-black text-sm font-medium uppercase transition-all duration-500 ease-in-out">
            Women
          </Link>
          <Link
            to="/collections/all?category=Top Wear"
            className="text-gray-700 hover:text-black text-sm font-medium uppercase transition-all duration-500 ease-in-out">
            Top wear
          </Link>
          <Link
            to="/collections/all?category=Bottom Wear"
            className="text-gray-700 hover:text-black text-sm font-medium uppercase transition-all duration-500 ease-in-out">
            Bottom wear
          </Link>
        </div>
        {/* {Right - Menu} */}
        <div className="flex items-center space-x-4">
          <Link
            to="/admin"
            className=" block bg-black px-2 rounded text-sm text-white ">Admin</Link>
          <Link
            to="/profile"
            className="hover:text-black transition-all duration-500 ease-in-out">
            <HiOutlineUser className="h-6 w-6 text-gray-700 " />
          </Link>
          <button
            className="relative hover:text-black "
            onClick={toggleShopCart}
            type="ShopCart">
            <HiOutlineShoppingBag className="h-6 w-6 text-gray-700 " />
            {cartItemCount > 0 && (<span
              className="absolute -top-1 bg-[#ea2e0e] text-white 
            text-xs rounded-full px-2 py-0.5 "
            >
             {cartItemCount}
            </span>)}
            
          </button>

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
            onClick={toggleNavMobile}></div>
        ) : (
          <div> </div>
        )}

        <div
          className={` fixed top-0 left-0 w-3/4 sm:w-1/2 md:w-1/3 h-full bg-white 
        shadow-lg transform transition-transform duration-300 z-50 
        ${isNavMobileOpen ? "translate-x-0" : "-translate-x-full"} `}>
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
