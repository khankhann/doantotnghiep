import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { toast } from "sonner";
import { useDispatch, useSelector } from "react-redux";
import { createPOSOrder, fetchAllOrders } from "@redux/slices/adminOrderSlice"; 
import { Html5QrcodeScanner } from "html5-qrcode";
import { 
  IoScanOutline, 
  IoQrCodeOutline, 
  IoCameraOutline, 
  IoCloseCircleOutline,
  IoTrashOutline,
  IoCardOutline,
  IoCashOutline,
  IoArrowBackOutline,
  IoAddCircleOutline,
  IoBagCheckOutline,
  IoPersonOutline,
  IoCallOutline
} from "react-icons/io5";

function AdminCartPage() {
  const [viewMode, setViewMode] = useState("list"); 
  const [isScanningQR, setIsScanningQR] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  
  const currentScannedRef = useRef(""); 
  const scannerRef = useRef(null);
  
  const dispatch = useDispatch();
  const { orders } = useSelector((state) => state.adminOrders || { orders: [] }); 

  const totalAmount = cartItems.reduce((acc, item) => acc + (item.price * item.qty), 0);

  useEffect(() => {
    if (viewMode === "list") {
      dispatch(fetchAllOrders());
    }
  }, [viewMode, dispatch]);

  const handleOpenScan = () => {
    setViewMode("scan");
    setIsScanningQR(false); 
  };

  const handleBackToList = () => {
    if (cartItems.length > 0) {
      if (!window.confirm("Đơn hàng chưa thanh toán. Bạn có chắc muốn thoát và hủy đơn này?")) return;
    }
    setCartItems([]);
    setCustomerName("");
    setCustomerPhone("");
    setIsScanningQR(false);
    setViewMode("list");
  };

  const handleCheckoutSuccess = async () => {
    if (!customerName.trim() || !customerPhone.trim()) {
        toast.error("Vui lòng nhập Tên và Số điện thoại khách hàng!");
        return;
    }

    try {
      const orderItemsData = cartItems.map(item => ({
        name: item.name,
        quantity: item.qty,
        image: item.images?.[0]?.url,
        price: item.price,
        productId: item._id, 
      }));

      const orderData = {
        orderItems: orderItemsData,
        customerName,
        customerPhone,
        totalPrice: totalAmount
      };

      await dispatch(createPOSOrder(orderData)).unwrap();
      toast.success("Đã thanh toán & Lưu đơn hàng thành công!");
      
      setCartItems([]);
      setCustomerName("");
      setCustomerPhone("");
      setIsCheckoutModalOpen(false);
      setViewMode("list"); 

    } catch (error) {
       console.error("Lỗi lưu đơn:", error);
       toast.error("Lỗi khi tạo đơn hàng POS!");
    }
  };

  const handleAddToCart = (product) => {
    setCartItems((prevCart) => {
      const existingItem = prevCart.find((item) => item._id === product._id);
      const currentQty = existingItem ? existingItem.qty : 0;
      
      if (product.countInStock !== undefined && currentQty >= product.countInStock) {
        toast.error(`Sản phẩm ${product.name} chỉ còn ${product.countInStock} cái trong kho!`);
        return prevCart;
      }

      if (existingItem) {
        toast.success(`Đã tăng số lượng: ${product.name}`);
        return prevCart.map((item) => item._id === product._id ? { ...item, qty: item.qty + 1 } : item);
      } else {
        toast.success(`Đã thêm vào đơn: ${product.name}`);
        return [...prevCart, { ...product, qty: 1 }];
      }
    });
  };

  const handleUpdateQty = (id, newQty) => {
    if (newQty < 1) return;
    setCartItems((prev) => prev.map((item) => item._id === id ? { ...item, qty: newQty } : item));
  };

  const handleRemoveItem = (id) => setCartItems((prev) => prev.filter((item) => item._id !== id));

  useEffect(() => {
    if (viewMode !== "scan") return; 
    let intervalId;
    const checkLatestRFID = async () => {
      if (isScanningQR) return; 
      try {
        const token = localStorage.getItem("userToken");
        const { data } = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/iot/rfid/latest`, { headers: { Authorization: `Bearer ${token}` } });
        if (data && data.rfidTag && data.rfidTag !== currentScannedRef.current) {
            currentScannedRef.current = data.rfidTag; 
            if (data.productData) handleAddToCart(data.productData);
            else toast.error("Thẻ trống hoặc không hợp lệ!");
        }
      } catch (error) {}
    };
    intervalId = setInterval(checkLatestRFID, 1500);
    return () => clearInterval(intervalId);
  }, [isScanningQR, viewMode]);

  useEffect(() => {
    if (viewMode === "scan" && isScanningQR) {
      const timer = setTimeout(() => {
        if (!scannerRef.current) {
          scannerRef.current = new Html5QrcodeScanner("pos-qr-reader", { fps: 10, qrbox: { width: 250, height: 250 }, rememberLastUsedCamera: true }, false);
          scannerRef.current.render(
            async (decodedText) => {
              toast.info("Đang xử lý mã...");
              const parts = decodedText.split('/');
              const productId = parts[parts.length - 1];
              try {
                 const { data } = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/products/${productId}`);
                 handleAddToCart(data);
                 scannerRef.current.pause(true);
                 setTimeout(() => scannerRef.current.resume(), 1500);
              } catch(err) { toast.error("Mã QR không hợp lệ!"); }
            }, (err) => {}
          );
        }
      }, 200);
      return () => clearTimeout(timer);
    } else {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(e => console.log(e));
        scannerRef.current = null;
      }
    }
  }, [isScanningQR, viewMode]);

  return (
    <div className="max-w-7xl mx-auto p-3 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
      
      {/* ----------------------------------------------------------------- */}
      {/* MÀN HÌNH 1: DANH SÁCH ĐƠN HÀNG */}
      {/* ----------------------------------------------------------------- */}
      {viewMode === "list" && (
        <div className="animate-fade-in-up">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200 pb-4 mb-6">
            <div>
                <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight uppercase">Đơn POS</h2>
                <p className="text-gray-500 text-xs sm:text-sm mt-1">Quản lý các đơn hàng được tạo tại quầy</p>
            </div>
            <button 
              onClick={handleOpenScan}
              className="w-full sm:w-auto bg-black text-white px-5 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors shadow-lg cursor-pointer"
            >
              <IoAddCircleOutline size={22} /> Mở quầy (POS)
            </button>
          </div>

          {/* KHU VỰC BẢNG (HỖ TRỢ VUỐT NGANG TRÊN MOBILE) */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-xs sm:text-sm uppercase tracking-wider">
                    <th className="p-4 font-bold whitespace-nowrap">Mã Đơn</th>
                    <th className="p-4 font-bold whitespace-nowrap">Khách hàng</th>
                    <th className="p-4 font-bold whitespace-nowrap">Thu ngân</th>
                    <th className="p-4 font-bold whitespace-nowrap">Thời gian</th>
                    <th className="p-4 font-bold text-center whitespace-nowrap">SL</th>
                    <th className="p-4 font-bold text-right whitespace-nowrap">Tổng tiền</th>
                    <th className="p-4 font-bold text-center whitespace-nowrap">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {orders && orders.length > 0 ? (
                    orders.map((order) => {
                      const customerName = order.shippingAddress?.fullName || "Khách lẻ";
                      const customerPhone = order.shippingAddress?.phone || "";
                      const staffName = order.user?.name || "Admin";
                      
                      const timeString = order.paidAt || order.createdAt;
                      const paymentTime = timeString 
                        ? new Date(timeString).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }) 
                        : "N/A";

                      const totalAmount = order.totalPrice || 0;
                      const totalQty = order.orderItems ? order.orderItems.reduce((a, c) => a + c.quantity, 0) : 0;
                      const shortId = order._id && order._id.length > 10 ? order._id.substring(order._id.length - 6).toUpperCase() : order._id;

                      return (
                        <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                          <td className="p-4 font-bold text-gray-900 text-sm whitespace-nowrap">#{shortId}</td>
                          <td className="p-4 whitespace-nowrap">
                              <p className="font-bold text-gray-800 text-sm">{customerName}</p>
                              {customerPhone && <p className="text-xs text-gray-500 mt-0.5">{customerPhone}</p>}
                          </td>
                          <td className="p-4 whitespace-nowrap">
                              <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-semibold">
                                  {staffName}
                              </span>
                          </td>
                          <td className="p-4 text-xs sm:text-sm text-gray-600 font-medium whitespace-nowrap">
                              {paymentTime}
                          </td>
                          <td className="p-4 text-gray-900 font-medium text-center whitespace-nowrap">{totalQty}</td>
                          <td className="p-4 text-blue-600 font-bold text-right whitespace-nowrap">{new Intl.NumberFormat('vi-VN').format(totalAmount)} đ</td>
                          <td className="p-4 text-center whitespace-nowrap">
                            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-lg text-xs font-bold uppercase">
                              {order.status || (order.isPaid ? "Đã thanh toán" : "Chờ xử lý")}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="7" className="p-8 text-center text-gray-500 text-sm">
                          Chưa có đơn hàng POS nào được tạo.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* MÀN HÌNH 2: QUÉT MÃ & GIỎ HÀNG */}
      {/* ----------------------------------------------------------------- */}
      {viewMode === "scan" && (
        <div className="animate-fade-in-up">
          <button 
            onClick={handleBackToList}
            className="mb-4 sm:mb-6 text-gray-500 hover:text-black flex items-center gap-2 font-bold transition-colors cursor-pointer text-sm sm:text-base"
          >
            <IoArrowBackOutline size={20} /> Quay lại
          </button>

          <div className="flex flex-col lg:flex-row gap-6">
            {/* CỘT TRÁI: KHU VỰC QUÉT MÃ */}
            <div className="w-full lg:w-2/5">
              {isScanningQR ? (
                 <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-gray-200 shadow-lg relative">
                    <button onClick={() => setIsScanningQR(false)} className="absolute top-2 right-2 sm:top-4 sm:right-4 text-gray-400 hover:text-red-500 z-10 transition-colors cursor-pointer">
                       <IoCloseCircleOutline size={30} />
                    </button>
                    <h3 className="text-center font-bold text-gray-800 mb-4 flex justify-center items-center gap-2 text-sm sm:text-base">
                       <IoCameraOutline size={20} /> Đang quét mã...
                    </h3>
                    <div id="pos-qr-reader" className="w-full overflow-hidden rounded-xl border-2 border-dashed border-blue-400"></div>
                 </div>
              ) : (
                 <div className="bg-blue-600 p-6 sm:p-8 rounded-2xl sm:rounded-3xl text-center relative overflow-hidden shadow-lg flex flex-col justify-center items-center py-10 sm:py-12">
                    <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at center, white 2px, transparent 2px)', backgroundSize: '20px 20px' }}></div>
                    <div className="relative z-10 w-20 h-20 sm:w-24 sm:h-24 bg-white/20 rounded-full flex items-center justify-center mb-4 text-white animate-pulse">
                       <IoScanOutline size={40} className="sm:text-5xl" />
                    </div>
                    <h2 className="relative z-10 text-xl sm:text-2xl font-bold text-white mb-2">Đợi thẻ RFID...</h2>
                    <p className="relative z-10 text-blue-100 text-xs sm:text-sm mb-6 px-4">Đưa thẻ vào đầu đọc để tự động thêm vào giỏ.</p>
                    <button onClick={() => setIsScanningQR(true)} className="relative z-10 w-full sm:w-64 bg-white text-blue-700 font-bold py-3 px-6 rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 shadow-md cursor-pointer text-sm sm:text-base">
                       <IoQrCodeOutline size={20} /> Mở Camera Quét Mã
                    </button>
                 </div>
              )}
            </div>

            {/* CỘT PHẢI: GIỎ HÀNG & THANH TOÁN */}
            <div className="w-full lg:w-3/5 bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
              <div className="bg-gray-800 text-white p-4 sm:p-5 flex justify-between items-center">
                  <h3 className="text-base sm:text-lg font-bold flex items-center gap-2">
                      <IoBagCheckOutline size={20} className="sm:text-2xl" /> Giỏ Hàng
                  </h3>
                  <span className="bg-gray-700 px-2 py-1 sm:px-3 sm:py-1 rounded-lg text-xs sm:text-sm font-bold">{cartItems.reduce((a,c)=>a+c.qty,0)} món</span>
              </div>

              <div className="p-4 sm:p-6 bg-gray-50 flex-1 min-h-[250px] max-h-[50vh] overflow-y-auto custom-scrollbar">
                  {cartItems.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-gray-400 py-10">
                          <IoCardOutline size={50} className="mb-4 opacity-20 sm:text-6xl" />
                          <p className="font-medium text-base sm:text-lg">Giỏ hàng trống</p>
                          <p className="text-xs sm:text-sm mt-1 text-center">Quét sản phẩm để thêm vào đây</p>
                      </div>
                  ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                          {cartItems.map((item) => (
                              <div key={item._id} className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-white border border-gray-200 rounded-xl sm:rounded-2xl shadow-sm">
                                  <img src={item.images?.[0]?.url || 'https://via.placeholder.com/50'} alt={item.name} className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded-lg sm:rounded-xl border shrink-0"/>
                                  <div className="flex-1 min-w-0">
                                      <h4 className="font-bold text-gray-900 text-xs sm:text-sm line-clamp-1 truncate">{item.name}</h4>
                                      <p className="text-blue-600 font-bold text-xs sm:text-sm mt-1">{new Intl.NumberFormat('vi-VN').format(item.price)} ₫</p>
                                  </div>
                                  <div className="flex items-center gap-2 sm:gap-3 bg-gray-100 rounded-lg p-1 border shrink-0">
                                      <button onClick={() => handleUpdateQty(item._id, item.qty - 1)} className="w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center bg-white rounded shadow-sm font-bold cursor-pointer hover:bg-gray-200 text-xs sm:text-base">-</button>
                                      <span className="font-bold text-gray-800 w-3 sm:w-4 text-center text-xs sm:text-sm">{item.qty}</span>
                                      <button onClick={() => handleUpdateQty(item._id, item.qty + 1)} className="w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center bg-white rounded shadow-sm font-bold cursor-pointer hover:bg-gray-200 text-xs sm:text-base">+</button>
                                  </div>
                                  <button onClick={() => handleRemoveItem(item._id)} className="text-red-400 hover:text-red-600 p-1 sm:p-2 cursor-pointer shrink-0">
                                      <IoTrashOutline size={18} className="sm:text-xl" />
                                  </button>
                              </div>
                          ))}
                      </div>
                  )}
              </div>

              <div className="p-4 sm:p-6 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-6 bg-white">
                  <div className="w-full sm:w-auto text-center sm:text-left">
                      <span className="text-gray-500 font-semibold uppercase tracking-widest text-xs sm:text-sm block mb-1">Tổng thanh toán</span>
                      <span className="text-3xl sm:text-4xl font-black text-black">{new Intl.NumberFormat('vi-VN').format(totalAmount)} ₫</span>
                  </div>
                  
                  <button 
                    disabled={cartItems.length === 0}
                    onClick={() => setIsCheckoutModalOpen(true)}
                    className="w-full sm:w-auto px-6 sm:px-10 bg-black text-white font-black text-sm sm:text-lg py-3 sm:py-4 rounded-xl hover:bg-gray-800 transition-colors shadow-lg disabled:bg-gray-300 disabled:cursor-not-allowed cursor-pointer flex justify-center items-center gap-2"
                  >
                    <IoCashOutline size={20} className="sm:text-2xl" /> TẠO ĐƠN
                  </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* MODAL: NHẬP THÔNG TIN KHÁCH HÀNG & MÃ QR */}
      {/* ----------------------------------------------------------------- */}
      {isCheckoutModalOpen && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-3 sm:p-4 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 max-w-lg w-full shadow-2xl relative animate-fade-in-up my-4 sm:my-8">
                <button onClick={() => setIsCheckoutModalOpen(false)} className="absolute top-3 right-3 sm:top-4 sm:right-4 text-gray-400 hover:text-red-500 cursor-pointer z-10"><IoCloseCircleOutline size={28} className="sm:text-3xl"/></button>
                
                <h2 className="text-xl sm:text-2xl font-black text-gray-900 mb-1 text-center">Lưu Đơn Hàng</h2>
                <p className="text-gray-500 text-xs sm:text-sm mb-4 sm:mb-6 text-center">Nhập thông tin để tích điểm & bảo hành.</p>

                <div className="flex flex-col gap-3 sm:gap-4 mb-4 sm:mb-6 bg-gray-50 p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-gray-100">
                    <div>
                        <label className="flex items-center gap-2 text-xs sm:text-sm font-bold text-gray-700 mb-1 sm:mb-2">
                            <IoPersonOutline /> Tên khách hàng <span className="text-red-500">*</span>
                        </label>
                        <input 
                            type="text" 
                            placeholder="Nhập tên khách hàng..."
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg sm:rounded-xl p-2.5 sm:p-3 text-sm sm:text-base focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        />
                    </div>
                    <div>
                        <label className="flex items-center gap-2 text-xs sm:text-sm font-bold text-gray-700 mb-1 sm:mb-2">
                            <IoCallOutline /> Số điện thoại <span className="text-red-500">*</span>
                        </label>
                        <input 
                            type="tel" 
                            placeholder="Nhập số điện thoại..."
                            value={customerPhone}
                            onChange={(e) => setCustomerPhone(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg sm:rounded-xl p-2.5 sm:p-3 text-sm sm:text-base focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        />
                    </div>
                </div>

                <div className="bg-blue-50 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-blue-100 flex flex-col items-center justify-center mb-4 sm:mb-6">
                    <p className="text-xs sm:text-sm font-bold text-blue-800 mb-2 uppercase tracking-wider">Mã quét VietQR</p>
                    <img 
                      src={`https://img.vietqr.io/image/970436-9825078716-compact2.png?amount=${totalAmount}&addInfo=Thanh toan don hang POS&accountName=TEN KHONG DAU`} 
                      alt="VietQR Vietcombank" 
                      className="w-32 h-32 sm:w-48 sm:h-48 object-contain rounded-lg sm:rounded-xl mix-blend-multiply"
                    />
                </div>

                <div className="bg-gray-100 p-3 sm:p-4 rounded-lg sm:rounded-xl text-left mb-4 sm:mb-6 flex justify-between items-center">
                    <span className="text-gray-500 text-xs sm:text-sm font-medium">Cần thanh toán:</span>
                    <span className="font-black text-xl sm:text-2xl text-blue-600">{new Intl.NumberFormat('vi-VN').format(totalAmount)} đ</span>
                </div>

                <button 
                  onClick={handleCheckoutSuccess}
                  className="w-full bg-green-500 text-white font-bold py-3 sm:py-4 rounded-lg sm:rounded-xl hover:bg-green-600 transition-colors shadow-lg cursor-pointer flex justify-center items-center gap-2 text-sm sm:text-base"
                >
                    <IoCashOutline size={20} className="sm:text-2xl" /> HOÀN TẤT & LƯU ĐƠN
                </button>
            </div>
        </div>
      )}

    </div>
  );
}

export default AdminCartPage;