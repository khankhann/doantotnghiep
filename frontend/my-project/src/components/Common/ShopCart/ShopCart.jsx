import { useContext } from "react";
import { IoCloseOutline } from "react-icons/io5";
import { SideBarContext } from "@context/SideBarContext";
import CartContent from "@components/Cart/CartContent";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

function ShopCart({ openShopCart, toggleShopCart }) {
  const { isShopCartOpen, setisShopCartOpen } = useContext(SideBarContext);
  const navigate = useNavigate();
  const { user, guestId } = useSelector((state) => state.auth);
  const { cart } = useSelector((state) => state.cart);
  const userId = user ? user._id : null;

  const handleClose = (e) => {
    const closeShopCart = e.target.closest(".container");
    if (closeShopCart) {
      setisShopCartOpen(!isShopCartOpen);
    }
  };
  const handleCheckOut = () => {
    if (!user) {
      navigate("/login?redirect=checkout");
    } else {
      navigate("/checkout");
    }
    toggleShopCart();
  };
const isShowPrice = cart.products.reduce((total , product)=>{
  return total + (product.price * product.quantity)
}, 0)

  return (
    <div className="container">
      {openShopCart ? (
        <div
          className=" fixed z-10 top-0 right-0 left-0 bottom-0 bg-[#0000004d] 
        transition-all duration-300 ease-in-out "
          onClick={handleClose}></div>
      ) : (
        <div> </div>
      )}

      <div
        className={`fixed top-0 right-0 w-3/4 sm:w-1/2 md:w-120 h-full bg-white shadow-lg
        transform transition-transform duration-500 flex flex-col z-50 ${
          openShopCart ? "translate-x-0" : "translate-x-full"
        }`}>
        {/* {close button} */}
        <div className=" flex justify-end p-4 ">
          <button
            onClick={toggleShopCart}
            className="transition-all duration-300 ease-in-out hover:rotate-180">
            <IoCloseOutline className=" h-6 w-6 text-gray-600 " />
          </button>
        </div>
        {/* {cart content} */}
        <div className=" flex-grow p-4 overflow-y-auto ">
          <h2 className=" text-xl font-semibold mb-4 text-center ">
            {" "}
            Your Cart
          </h2>
          {/* {components item} */}
          {cart && cart?.products.length > 0 ? (
            <div>
              {" "}
              <CartContent cart={cart} userId={userId} guestId={guestId} />{" "}
            </div>
          ) : (
            <p>Your cart is empty. </p>
          )}
        </div>
        {/* {button checkout} */}
        <div className="p-4 bg-white sticky bottom-0 ">
          {cart && cart?.products?.length > 0 && (
            <>
            <div>
              <p> Price : {isShowPrice.toLocaleString()} </p>
            </div>
              <button
                className=" cursor-pointer w-full bg-black text-white py-3 rounded-lg font-semibold
            hover:bg-gray-800 transition-all duration-300 ease-in-out  "
                onClick={handleCheckOut}>
                {" "}
                Checkout
              </button>
              <p className=" text-sm tracking-tighter text-gray-500 mt-2 text-center  ">
                Shipping, tasex, and discount codes calculate at the checkout.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default ShopCart;
