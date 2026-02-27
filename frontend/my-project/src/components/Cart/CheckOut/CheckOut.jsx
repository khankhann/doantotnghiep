import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { State, Country } from "country-state-city";
import PaypalButton from "../Paypal/PaypalButton.jsx";
import { useDispatch, useSelector } from "react-redux";
import { createCheckout } from "@redux/slices/checkoutSlice";
import api from "../../../api/axiosClients.js";
import { clearCart } from "@redux/slices/cartSlice.js";
// import QRCode from "react-qr-code"; 

function CheckOut() {
  const navigate = useNavigate();
  const [checkoutId, setCheckoutId] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [selectedCountry, setSelectedCountry] = useState("");
  const [momoPaymentUrl, setMomoPaymentUrl] = useState(null);
  const [shippingAddress, setShippingAddress] = useState({
    firstName: "",
    lastName: "",
    address: "",
    city: "",
    postalCode: "",
    country: "VietNam",
    phone: "",
  });
  const dispatch = useDispatch();
  const { cart, loading, error } = useSelector((state) => state.cart);
  const { user } = useSelector((state) => state.auth);

  // load cart before processing
  useEffect(() => {
    if (!cart || !cart.products || cart.products.length === 0) {
      navigate("/");
    }
  }, [navigate, cart]);

  const handleCreateCheckout = async (e) => {
    e.preventDefault();
    if (cart && cart.products.length > 0) {
      const res = await dispatch(
        createCheckout({
          checkoutItem: cart.products, 
          shippingAddress,
          paymentMethod: paymentMethod,
          totalPrice: cart.totalPrice,
        })
      );
      if (res.payload && res.payload._id) {
        setCheckoutId(res.payload._id); // set checkout id
      }
    }
  };

  const handleMomoPayment = async (e) => {
    e.preventDefault(); // Chặn form submit mặc định
    try {
      const response = await api.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/momo/payment`,
        {
          amount: cart.totalPrice,
          orderInfo: `Thanh toan don hang ${checkoutId}`,
        }
      );
      const data = response.data ? response.data : response;

      if (data && data.payUrl) {
        // setMomoPaymentUrl(data.payUrl);
        navigate(data.payUrl)
      } else {
        console.log("bi loi ", data);
      }
    } catch (error) {
      console.error("loi giao dich ", error);
    }
  };
  
  const handleFinalizeCheckout = async (checkoutId) => {
    try {
      await api.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/checkout/${checkoutId}/finalize`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("userToken")}`,
          },
        }
      );
      dispatch(clearCart())
      localStorage.removeItem("cart");
      navigate("/order-confirmation");
    } catch (error) {
      console.error(error);
    }
  };
  const handlePaymentSuccess = async (detail) => {
    try {
      await api.put(
        `${import.meta.env.VITE_BACKEND_URL}/api/${checkoutId}/pay`,
        {
          paymentStatus: "paid",
          paymentDetail: detail,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("userToken")}`,
          },
        }
      );
      await handleFinalizeCheckout(checkoutId);
    } catch (error) {
      console.error("thanh toan loi", error);
    }
  };


  const handlePaymentMethod = (method) => {
    setPaymentMethod(method);
  };
  
  const countries = Country.getAllCountries();
  const cities = State.getStatesOfCountry("VN");
  
  const handleCityChange = (e) => {
    setShippingAddress({
      ...shippingAddress,
      city: e.target.value,
    });
  };
  
  const handleCountryChange = (e) => {
    const countryCode = e.target.value;
    const countryData = Country.getCountryByCode(countryCode);
    setSelectedCountry(countryData);
    setShippingAddress({
      ...shippingAddress,
      country: countryData.name || "",
      city: "",
    });
  };

  if (loading) return <p className="text-center"> loading </p>;
  if (error) return <p className="text-center"> Error : {error} </p>;
  if (!cart || !cart.products || cart.products.length <= 0) {
    return <p> your cart is empty </p>;
  }

  const totalQuantity = cart.products.reduce((total, product) => {
    return total + product.quantity;
  }, 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto py-10 px-6 tracking-tighter ">
      {/* LEFT SECTION (Form) */}
      <div className=" bg-white rounded-lg p-6 ">
        <h2 className="text-2xl uppercase mb-6">Checkout</h2>
        <form onSubmit={handleCreateCheckout}>
          <h3 className="text-lg mb-4">Contact Details</h3>
          <div className="mb-4">
            <label className="block text-gray-700 ">Email</label>
            <input
              type="email"
              value={user ? user.email : ""}
              className="w-full p-2 border rounded"
              disabled
            />
          </div>
          <h3 className="text-lg mb-4 ">Delivery</h3>
          {/* ... (Các input First Name, Last Name, Address... giữ nguyên code cũ) ... */}
          <div className="mb-4 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700">First Name</label>
              <input
                type="text"
                value={shippingAddress.firstName}
                onChange={(e) => setShippingAddress({...shippingAddress, firstName: e.target.value})}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700">Last Name</label>
              <input
                type="text"
                value={shippingAddress.lastName}
                onChange={(e) => setShippingAddress({...shippingAddress, lastName: e.target.value})}
                className="w-full p-2 border rounded"
                required
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Address</label>
            <input
              type="text"
              value={shippingAddress.address}
              onChange={(e) => setShippingAddress({...shippingAddress, address: e.target.value})}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div className="mb-4 ">
            <div>
              <label className="block text-gray-700">City</label>
              <select
                value={shippingAddress.city}
                onChange={handleCityChange}
                className="w-full p-2 border rounded"
                required>
                <option value="">-- Select City --</option>
                {cities.length > 0 &&
                  cities.map((city) => (
                    <option key={city.isoCode} value={city.name}>
                      {city.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-gray-700">Postal Code</label>
            <input
              type="text"
              value={shippingAddress.postalCode}
              onChange={(e) => setShippingAddress({...shippingAddress, postalCode: e.target.value})}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Phone</label>
            <input
              type="tel"
              value={shippingAddress.phone}
              onChange={(e) => setShippingAddress({...shippingAddress, phone: e.target.value})}
              className="w-full p-2 border rounded"
              required
            />
          </div>

          <div className="mt-6">
            {!checkoutId ? (
              <div className="flex flex-col gap-4">
                <button
                  type="submit"
                  onClick={() => handlePaymentMethod("paypal")}
                  className="w-full bg-black text-white py-3 rounded">
                  Continue with PayPal
                </button>
                <button
                  type="submit"
                  onClick={() => handlePaymentMethod("momo")}
                  className="w-full bg-pink-400 text-white py-3 rounded">
                  Continue with Momo
                </button>
              </div>
            ) : (
              <div className="p-4 bg-gray-50 rounded-lg ">
                {paymentMethod === "paypal" && (
                  <div>
                    <h3 className="text-lg mb-4 ">Pay with Paypal</h3>
                    <PaypalButton
                      amount={cart.totalPrice}
                      onSuccess={handlePaymentSuccess}
                      onError={(err) => alert("Payment failed. try again")}
                    />
                  </div>
                )}
                {paymentMethod === "momo" && (
                  <div>
                    <h3 className="text-lg mb-4 text-pink-600 font-bold"> Pay with Momo </h3>
                    <div className=" flex flex-col items-center ">
                      <img
                        src="https://cdn.haitrieu.com/wp-content/uploads/2022/10/Logo-MoMo-Square.png"
                        alt="momo logo"
                        className=" w-20 mb-4 "
                      />
                      <button 
                        type="button" // QUAN TRỌNG: Để tránh submit form lần nữa
                        className="w-full bg-pink-600 hover:bg-pink-700 text-white font-bold py-3 rounded transition duration-300"
                        onClick={handleMomoPayment}
                      >
                        Scan QR code 
                      </button>
                    </div>  
                  </div>
                )}
                <button
                  onClick={() => setCheckoutId(false)}
                  className="text-gray-500 text-sm mt-4 underline hover:text-gray-800 ">
                  Back to method payment
                </button>
              </div>
            )}
          </div>
        </form>
      </div>

      {/* RIGHT SECTION (Order Summary OR QR Code) */}
      <div className="bg-gray-50 p-6 rounded-lg shadow-2xl transition-all transform ease-in-out">
        {momoPaymentUrl ? (
          // ----- TRƯỜNG HỢP 1: CÓ LINK MOMO -> HIỆN QR CODE -----
          <div className="flex flex-col items-center justify-center h-full text-center">
             <h3 className="text-xl font-bold text-pink-600 mb-4">Quét mã để thanh toán</h3>
             <div className="p-4 bg-white rounded-lg shadow-md mb-4">
                <QRCode value={momoPaymentUrl} size={200} />
             </div>
             <p className="text-gray-600 mb-6">
               Mở App MoMo trên điện thoại và quét mã này để hoàn tất.
             </p>
             <button
               onClick={() => navigate("/order-confirmation")}
               className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 mb-4"
             >
               Tôi đã thanh toán xong
             </button>
             <button
               onClick={() => setMomoPaymentUrl(null)}
               className="text-sm text-gray-500 underline"
             >
               Quay lại giỏ hàng
             </button>
          </div>
        ) : (
          // ----- TRƯỜNG HỢP 2: CHƯA CÓ LINK -> HIỆN CART (GIỮ NGUYÊN CODE CŨ) -----
          <>
            <h3 className="text-lg mb-4">Order Summary</h3>
            <div className="border-t py-4 mb-4">
              {cart.products.map((product, index) => (
                <div key={index} className="flex items-start justify-between py-2 border-b">
                  <div className="flex items-start ">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-20 h-24 object-center mr-4"
                    />
                    <div>
                      <h3 className="text-md">{product.name}</h3>
                      <p className="text-gray-500">Size: {product.size}</p>
                      <p className="text-gray-500">Color: {product.color}</p>
                      <p className="text-gray-500">Quantity: {product.quantity}</p>
                    </div>
                  </div>
                  <p className="text-xl">${product.price.toLocaleString()}</p>
                </div>
              ))}
            </div>
            
            <div className="flex justify-between items-center text-lg mb-4 ">
              <p> Total quantity </p>
              <p> {totalQuantity} </p>
            </div>
            <div className="flex justify-between items-center text-lg mb-4 ">
              <p> Subtotal </p>
              <p> ${cart.totalPrice.toLocaleString()} </p>
            </div>
            <div className="flex justify-between items-center text-lg">
              <p>Shipping </p>
              <p>Free </p>
            </div>
            <div className=" flex justify-between items-center text-lg mt-4 border-t pt-4 ">
              <p> Total</p>
              <p> {cart.totalPrice?.toLocaleString()}</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default CheckOut;