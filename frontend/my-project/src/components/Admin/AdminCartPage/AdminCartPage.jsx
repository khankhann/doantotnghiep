import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { toast } from "sonner";
import { useDispatch, useSelector } from "react-redux";
import { createPOSOrder, fetchAllOrders } from "@redux/slices/adminOrderSlice"; 
import { Html5QrcodeScanner } from "html5-qrcode";
import { 
  IoQrCodeOutline, 
  IoCloseCircleOutline,
  IoTrashOutline,
  IoArrowBackOutline,
  IoAddOutline
} from "react-icons/io5";

function AdminCartPage() {
  const [viewMode, setViewMode] = useState("list"); 
  const [isScanningQR, setIsScanningQR] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  
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
      toast.success("Thanh toán thành công!");
      
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
        toast.error(`Kho chỉ còn ${product.countInStock} sản phẩm!`);
        return prevCart;
      }

      if (existingItem) {
        return prevCart.map((item) => item._id === product._id ? { ...item, qty: item.qty + 1 } : item);
      } else {
        return [...prevCart, { ...product, qty: 1 }];
      }
    });
  };

  const handleUpdateQty = (id, newQty) => {
    if (newQty < 1) return;
    setCartItems((prev) => prev.map((item) => item._id === id ? { ...item, qty: newQty } : item));
  };

  const handleRemoveItem = (id) => setCartItems((prev) => prev.filter((item) => item._id !== id));

  // LOGIC BẬT/TẮT QUÉT QR CODE
  useEffect(() => {
    if (viewMode === "scan" && isScanningQR) {
      const timer = setTimeout(() => {
        if (!scannerRef.current) {
          scannerRef.current = new Html5QrcodeScanner("pos-qr-reader", { 
            fps: 10, 
            qrbox: { width: 250, height: 250 }, 
            rememberLastUsedCamera: true 
          }, false);
          
          scannerRef.current.render(
            async (decodedText) => {
              const parts = decodedText.split('/');
              const productId = parts[parts.length - 1];
              try {
                 const { data } = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/products/${productId}`);
                 handleAddToCart(data);
                 scannerRef.current.pause(true);
                 setTimeout(() => scannerRef.current.resume(), 1500);
              } catch(err) { 
                 toast.error("Mã QR không hợp lệ!"); 
              }
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
    <div className="w-full bg-slate-50 min-h-screen">
       
      {viewMode === "list" && (
        <div className="p-6 mx-auto max-w-7xl">
          <div className="flex justify-between items-center mb-6">
            <div>
                <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Đơn hàng tại quầy (POS)</h2>
                <p className="text-slate-500 text-sm mt-1">Quản lý lịch sử giao dịch trực tiếp</p>
            </div>
            <button 
              onClick={handleOpenScan}
              className="bg-slate-900 text-white px-5 py-2.5 rounded-md font-medium text-sm flex items-center gap-2 hover:bg-slate-800 transition-colors"
            >
              <IoAddOutline size={18} /> Tạo đơn mới
            </button>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600 whitespace-nowrap">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700">
                  <tr>
                    <th className="py-3 px-5 font-semibold">Mã Đơn</th>
                    <th className="py-3 px-5 font-semibold">Khách hàng</th>
                    <th className="py-3 px-5 font-semibold">Thu ngân</th>
                    <th className="py-3 px-5 font-semibold">Thời gian</th>
                    <th className="py-3 px-5 font-semibold text-center">Số lượng</th>
                    <th className="py-3 px-5 font-semibold text-right">Tổng tiền</th>
                    <th className="py-3 px-5 font-semibold text-center">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders && orders.length > 0 ? (
                    orders.map((order) => {
                      const customerName = order.shippingAddress?.fullName || "Khách lẻ";
                      const staffName = order.user?.name || "Admin";
                      const timeString = order.paidAt || order.createdAt;
                      const paymentTime = timeString ? new Date(timeString).toLocaleString('vi-VN') : "N/A";
                      const totalQty = order.orderItems ? order.orderItems.reduce((a, c) => a + c.quantity, 0) : 0;
                      const shortId = order._id?.substring(order._id.length - 6).toUpperCase();

                      return (
                        <tr key={order._id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-5 font-medium text-slate-900">#{shortId}</td>
                          <td className="py-3 px-5">{customerName}</td>
                          <td className="py-3 px-5 text-slate-500">{staffName}</td>
                          <td className="py-3 px-5 text-slate-500">{paymentTime}</td>
                          <td className="py-3 px-5 text-center">{totalQty}</td>
                          <td className="py-3 px-5 font-semibold text-slate-900 text-right">{new Intl.NumberFormat('vi-VN').format(order.totalPrice || 0)} ₫</td>
                          <td className="py-3 px-5 text-center">
                            <span className="bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-sm text-xs font-medium">
                              Hoàn tất
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="7" className="py-12 text-center text-slate-500 text-sm">
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

      {viewMode === "scan" && (
        <div className="h-screen flex flex-col">
          {/* Header thanh công cụ POS */}
          <div className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 shrink-0">
            <div className="flex items-center gap-4">
              <button 
                onClick={handleBackToList}
                className="text-slate-600 hover:text-slate-900 flex items-center gap-1.5 font-medium text-sm transition-colors"
              >
                <IoArrowBackOutline size={18} /> Thoát
              </button>
              <div className="h-5 w-px bg-slate-300"></div>
              <h1 className="font-bold text-slate-800">Bán hàng tại quầy</h1>
            </div>
          </div>
 
          <div className="flex-1 flex overflow-hidden bg-slate-100 p-4 gap-4">
             
            <div className="flex-1 bg-white rounded-md border border-slate-200 shadow-sm flex flex-col overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                <span className="font-semibold text-slate-700 text-sm">Quét mã vạch / QR</span>
                <button 
                  onClick={() => setIsScanningQR(!isScanningQR)}
                  className={`text-xs px-3 py-1.5 rounded-sm font-medium transition-colors border ${isScanningQR ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'}`}
                >
                  {isScanningQR ? "Tắt Camera" : "Bật Camera"}
                </button>
              </div>

              <div className="flex-1 flex items-center justify-center bg-slate-100 relative">
                {isScanningQR ? (
                   <div className="w-full max-w-md p-4">
                      <div id="pos-qr-reader" className="w-full bg-white rounded-md border border-slate-300 overflow-hidden shadow-sm"></div>
                   </div>
                ) : (
                   <div className="text-center">
                      <div className="w-16 h-16 bg-white border border-slate-200 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400 shadow-sm">
                         <IoQrCodeOutline size={32} />
                      </div>
                      <p className="text-slate-500 font-medium">Camera đang tắt</p>
                      <p className="text-slate-400 text-sm mt-1">Bấm "Bật Camera" ở góc trên để quét sản phẩm</p>
                   </div>
                )}
              </div>
            </div>
 
            <div className="w-[450px] bg-white rounded-md border border-slate-200 shadow-sm flex flex-col shrink-0 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                  <span className="font-semibold text-slate-700 text-sm">Giỏ hàng hiện tại</span>
                  <span className="text-slate-500 text-xs font-medium">{cartItems.reduce((a,c)=>a+c.qty,0)} sản phẩm</span>
              </div>

              {/* Danh sách món hàng */}
              <div className="flex-1 overflow-y-auto p-2">
                  {cartItems.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-slate-400">
                          <p className="text-sm">Đơn hàng trống</p>
                      </div>
                  ) : (
                      <div className="flex flex-col gap-2">
                          {cartItems.map((item) => (
                              <div key={item._id} className="flex items-center gap-3 p-2 bg-white border border-slate-100 rounded hover:border-slate-300 transition-colors">
                                  <img src={item.images?.[0]?.url || 'https://via.placeholder.com/50'} alt={item.name} className="w-12 h-12 object-cover rounded border border-slate-200 shrink-0"/>
                                  
                                  <div className="flex-1 min-w-0">
                                      <h4 className="font-medium text-slate-800 text-sm truncate">{item.name}</h4>
                                      <p className="text-slate-600 font-semibold text-sm mt-0.5">{new Intl.NumberFormat('vi-VN').format(item.price)} ₫</p>
                                  </div>

                                  <div className="flex flex-col items-end gap-2 shrink-0">
                                      <button onClick={() => handleRemoveItem(item._id)} className="text-slate-400 hover:text-red-500 p-1">
                                          <IoTrashOutline size={16} />
                                      </button>
                                      <div className="flex items-center border border-slate-200 rounded-sm">
                                          <button onClick={() => handleUpdateQty(item._id, item.qty - 1)} className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-slate-100 bg-slate-50 transition-colors">-</button>
                                          <span className="w-8 text-center text-sm font-medium text-slate-800 border-x border-slate-200 bg-white">{item.qty}</span>
                                          <button onClick={() => handleUpdateQty(item._id, item.qty + 1)} className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-slate-100 bg-slate-50 transition-colors">+</button>
                                      </div>
                                  </div>
                              </div>
                          ))}
                      </div>
                  )}
              </div>

              {/* Box Thanh Toán */}
              <div className="p-4 border-t border-slate-200 bg-slate-50">
                  <div className="flex justify-between items-center mb-4">
                      <span className="text-slate-600 font-medium text-sm">Tổng cộng</span>
                      <span className="text-xl font-bold text-slate-900">{new Intl.NumberFormat('vi-VN').format(totalAmount)} ₫</span>
                  </div>
                  
                  <button 
                    disabled={cartItems.length === 0}
                    onClick={() => setIsCheckoutModalOpen(true)}
                    className="w-full bg-blue-600 text-white font-medium text-sm py-3 rounded-md hover:bg-blue-700 transition-colors disabled:bg-slate-300 disabled:text-slate-500 shadow-sm"
                  >
                    Thanh toán
                  </button>
              </div>
            </div>
          </div>
        </div>
      )}
 
      {isCheckoutModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-xl">
                <div className="flex justify-between items-center mb-5">
                  <h2 className="text-lg font-bold text-slate-900">Hoàn tất thanh toán</h2>
                  <button onClick={() => setIsCheckoutModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                    <IoCloseCircleOutline size={24} />
                  </button>
                </div>

                <div className="space-y-4 mb-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Tên khách hàng <span className="text-red-500">*</span></label>
                        <input 
                            type="text" 
                            placeholder="Nhập tên..."
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Số điện thoại <span className="text-red-500">*</span></label>
                        <input 
                            type="tel" 
                            placeholder="Nhập số điện thoại..."
                            value={customerPhone}
                            onChange={(e) => setCustomerPhone(e.target.value)}
                            className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                        />
                    </div>
                </div>

                {/* Mã VietQR */}
                <div className="bg-slate-50 p-4 rounded-md border border-slate-200 mb-6 text-center">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Mã chuyển khoản</p>
                    <img 
                      src={`https://img.vietqr.io/image/970436-9825078716-compact2.png?amount=${totalAmount}&addInfo=Thanh toan don hang POS&accountName=TEN KHONG DAU`} 
                      alt="VietQR Vietcombank" 
                      className="w-36 h-36 object-contain mx-auto mix-blend-multiply border border-slate-200 rounded bg-white p-1"
                    />
                </div>

                <div className="flex justify-between items-center mb-4">
                  <span className="text-slate-500 text-sm">Khách cần trả:</span>
                  <span className="font-bold text-lg text-slate-900">{new Intl.NumberFormat('vi-VN').format(totalAmount)} ₫</span>
                </div>

                <button 
                  onClick={handleCheckoutSuccess}
                  className="w-full bg-slate-900 text-white font-medium py-2.5 rounded-md hover:bg-slate-800 transition-colors"
                >
                    Đã nhận tiền & Tạo đơn
                </button>
            </div>
        </div>
      )}

    </div>
  );
}

export default AdminCartPage;