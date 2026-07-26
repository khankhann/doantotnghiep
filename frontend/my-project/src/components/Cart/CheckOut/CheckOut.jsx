import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { State, Country } from "country-state-city";
import PaypalButton from "../Paypal/PaypalButton.jsx";
import { useDispatch, useSelector } from "react-redux";
import { createCheckout } from "@redux/slices/checkoutSlice";
import api from "../../../api/axiosClients.js";
import { clearCart } from "@redux/slices/cartSlice.js";
import QRCode from "react-qr-code"; // Đã mở comment để dùng QR

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

  useEffect(() => {
    if (!cart || !cart.products || cart.products.length === 0) {
      navigate("/");
    }
  }, [navigate, cart]);

  const handleCreateCheckout = async (e) => {
    e.preventDefault();
    if (cart && cart.products.length > 0) {
      
      // THÊM ĐOẠN NÀY: Ghép họ và tên thành fullName
      const payloadAddress = {
        ...shippingAddress,
        fullName: `${shippingAddress.firstName} ${shippingAddress.lastName}`.trim()
      };

      const res = await dispatch(
        createCheckout({
          checkoutItem: cart.products,
          shippingAddress: payloadAddress, 
          paymentMethod: paymentMethod,
          totalPrice: cart.totalPrice,
        })
      );
      if (res.payload && res.payload._id) {
        setCheckoutId(res.payload._id);
      }
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const handleMomoPayment = async (e) => {
    e.preventDefault();
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
        // Nếu muốn hiện QR ngay trên web thì dùng setMomoPaymentUrl(data.payUrl)
        // Hiện tại fen đang dùng navigate để chuyển thẳng sang MoMo
        navigate(data.payUrl);
      } else {
        console.log("Lỗi giao dịch", data);
      }
    } catch (error) {
      console.error("Lỗi giao dịch", error);
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
      dispatch(clearCart());
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
      console.error("Thanh toán lỗi", error);
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

  if (loading) return <div className="min-h-screen flex items-center justify-center"><p className="text-xl font-medium animate-pulse">Đang tải dữ liệu...</p></div>;
  if (error) return <div className="min-h-screen flex items-center justify-center"><p className="text-red-500 text-xl">{error}</p></div>;
  if (!cart || !cart.products || cart.products.length <= 0) {
    return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-500 text-lg">Giỏ hàng của bạn đang trống.</p></div>;
  }

  const totalQuantity = cart.products.reduce((total, product) => total + product.quantity, 0);

  // CSS Class dùng chung cho Input để code gọn gàng, đồng bộ
  const inputStyles = "w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all duration-200 text-gray-800";
  const labelStyles = "block text-sm font-medium text-gray-600 mb-1.5";

  return (
    <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        
        {/* LEFT SECTION (Form) */}
        <div className="lg:col-span-7">
          <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 mb-8">
            Thanh toán
          </h2>
          <form onSubmit={handleCreateCheckout} className="space-y-8">
            
            {/* Thông tin liên hệ */}
            <section>
              <h3 className="text-xl font-semibold text-gray-900 mb-5">Thông tin liên hệ</h3>
              <div>
                <label className={labelStyles}>Email</label>
                <input
                  type="email"
                  value={user ? user.email : ""}
                  className={`${inputStyles} cursor-not-allowed opacity-70`}
                  disabled
                />
              </div>
            </section>

            {/* Thông tin giao hàng */}
            <section>
              <h3 className="text-xl font-semibold text-gray-900 mb-5">Địa chỉ giao hàng</h3>
              <div className="grid grid-cols-2 gap-5 mb-5">
                <div>
                  <label className={labelStyles}>Họ (First Name)</label>
                  <input
                    type="text"
                    value={shippingAddress.firstName}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, firstName: e.target.value })}
                    className={inputStyles}
                    placeholder="Nhập họ..."
                    required
                  />
                </div>
                <div>
                  <label className={labelStyles}>Tên (Last Name)</label>
                  <input
                    type="text"
                    value={shippingAddress.lastName}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, lastName: e.target.value })}
                    className={inputStyles}
                    placeholder="Nhập tên..."
                    required
                  />
                </div>
              </div>

              <div className="mb-5">
                <label className={labelStyles}>Địa chỉ cụ thể (Address)</label>
                <input
                  type="text"
                  value={shippingAddress.address}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, address: e.target.value })}
                  className={inputStyles}
                  placeholder="Số nhà, tên đường..."
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
                <div>
                  <label className={labelStyles}>Tỉnh / Thành phố (City)</label>
                  <select
                    value={shippingAddress.city}
                    onChange={handleCityChange}
                    className={inputStyles}
                    required
                  >
                    <option value="" disabled>-- Chọn Tỉnh/Thành phố --</option>
                    {cities.length > 0 &&
                      cities.map((city) => (
                        <option key={city.isoCode} value={city.name}>
                          {city.name}
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className={labelStyles}>Mã bưu chính (Postal Code)</label>
                  <input
                    type="text"
                    value={shippingAddress.postalCode}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, postalCode: e.target.value })}
                    className={inputStyles}
                    placeholder="VD: 700000"
                    required
                  />
                </div>
              </div>

              <div>
                <label className={labelStyles}>Số điện thoại (Phone)</label>
                <input
                  type="tel"
                  value={shippingAddress.phone}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, phone: e.target.value })}
                  className={inputStyles}
                  placeholder="VD: 0901234567"
                  required
                />
              </div>
            </section>

            {/* Khu vực Nút Thanh Toán */}
            <div className="pt-6 mt-6 border-t border-gray-200">
              {!checkoutId ? (
                <div className="space-y-4">
                  <button
                    type="submit"
                    onClick={() => handlePaymentMethod("paypal")}
                    className="w-full flex items-center justify-center gap-2 bg-black hover:bg-gray-800 text-white font-medium py-4 rounded-xl transition-colors duration-300"
                  >
                    Tiếp tục với PayPal
                  </button>
                  <button
                    type="submit"
                    onClick={() => handlePaymentMethod("momo")}
                    className="w-full flex items-center justify-center gap-2 bg-[#A50064] hover:bg-[#80004d] text-white font-medium py-4 rounded-xl transition-colors duration-300"
                  >
                    Tiếp tục với MoMo
                  </button>
                </div>
              ) : (
                <div className="p-8 bg-white border border-gray-200 rounded-2xl shadow-sm">
                  {paymentMethod === "paypal" && (
                    <div className="animate-fade-in-up">
                      <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">Thanh toán qua Paypal</h3>
                      <PaypalButton
                        amount={formatPrice(cart.totalPrice)}
                        onSuccess={handlePaymentSuccess}
                        onError={(err) => alert("Thanh toán thất bại. Vui lòng thử lại!")}
                      />
                    </div>
                  )}
                  {paymentMethod === "momo" && (
                    <div className="flex flex-col items-center animate-fade-in-up">
                      <h3 className="text-xl font-bold text-[#A50064] mb-6">Thanh toán qua MoMo</h3>
                      <img
                        src="https://cdn.haitrieu.com/wp-content/uploads/2022/10/Logo-MoMo-Square.png"
                        alt="MoMo Logo"
                        className="w-24 h-24 mb-6 drop-shadow-md rounded-2xl"
                      />
                      <button
                        type="button"
                        className="w-full max-w-sm bg-[#A50064] hover:bg-[#80004d] text-white font-semibold py-4 rounded-xl transition duration-300 shadow-md hover:shadow-lg"
                        onClick={handleMomoPayment}
                      >
                        Mở cổng thanh toán MoMo
                      </button>
                    </div>
                  )}
                  <button
                    onClick={() => setCheckoutId(false)}
                    className="block mx-auto mt-6 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
                  >
                    ← Chọn phương thức thanh toán khác
                  </button>
                </div>
              )}
            </div>
          </form>
        </div>

        {/* RIGHT SECTION (Order Summary) */}
        <div className="lg:col-span-5">
          <div className="bg-gray-50 p-8 rounded-3xl shadow-sm border border-gray-100 sticky top-8">
            {momoPaymentUrl ? (
              // View quét mã QR MoMo
              <div className="flex flex-col items-center text-center py-10 animate-fade-in">
                <h3 className="text-2xl font-bold text-[#A50064] mb-2">Quét mã thanh toán</h3>
                <p className="text-gray-500 text-sm mb-8">Sử dụng App MoMo để quét mã QR dưới đây</p>
                <div className="p-4 bg-white rounded-2xl shadow-md border border-gray-100 mb-8">
                  <QRCode value={momoPaymentUrl} size={220} />
                </div>
                <button
                  onClick={() => navigate("/order-confirmation")}
                  className="w-full bg-black text-white font-medium px-6 py-4 rounded-xl hover:bg-gray-800 transition-colors mb-4"
                >
                  Tôi đã thanh toán thành công
                </button>
                <button
                  onClick={() => setMomoPaymentUrl(null)}
                  className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
                >
                  Hủy và quay lại giỏ hàng
                </button>
              </div>
            ) : (
              // View Tóm tắt đơn hàng
              <>
                <h3 className="text-xl font-bold text-gray-900 mb-6">Tóm tắt đơn hàng</h3>
                
                {/* Product List */}
                <div className="flex flex-col gap-5 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {cart.products.map((product, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <div className="w-20 h-24 shrink-0 overflow-hidden rounded-xl bg-gray-200 border border-gray-200">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover object-center"
                        />
                      </div>
                      <div className="flex-1 flex flex-col justify-between">
                        <h4 className="text-sm font-medium text-gray-900 line-clamp-2">{product.name}</h4>
                        <div className="text-xs text-gray-500 mt-1 flex gap-2">
                          <span>Size: {product.size}</span>
                          <span>|</span>
                          <span>Color: {product.color}</span>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-sm font-medium text-gray-500">x{product.quantity}</span>
                          <span className="text-sm font-semibold text-gray-900">{formatPrice(product.price)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Price Breakdown */}
                <div className="mt-8 pt-6 border-t border-gray-200 space-y-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Tổng số lượng</span>
                    <span className="font-medium text-gray-900">{totalQuantity} sản phẩm</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Tạm tính</span>
                    <span className="font-medium text-gray-900">{formatPrice(cart.totalPrice)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Phí giao hàng</span>
                    <span className="font-medium text-green-600">Miễn phí</span>
                  </div>
                </div>

                {/* Total */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex justify-between items-end">
                    <span className="text-lg font-bold text-gray-900">Tổng cộng</span>
                    <div className="text-right">
                      <span className="block text-2xl font-extrabold text-gray-900">
                        {formatPrice(cart.totalPrice)}
                      </span>
                      <span className="text-xs text-gray-500">Đã bao gồm VAT (nếu có)</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default CheckOut;