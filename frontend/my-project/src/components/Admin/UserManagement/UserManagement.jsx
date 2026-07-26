import { useEffect, useState, useRef } from "react"; 
import { useDispatch, useSelector } from "react-redux";
import { addUser, deleteUser, fetchUsers, updateUser } from "@redux/slices/adminSlice";
import { updateCurrentUser } from "@redux/slices/authSlice";
import { fetchLastRfid, resetLastRfid, clearBackendRfid } from "@redux/slices/iotSensorSlice";
import { toast } from "sonner";
import {
  IoSearchOutline, IoTrashOutline, IoCameraOutline, IoIdCardOutline, 
  IoCreateOutline, IoCloseOutline, IoLockClosedOutline, IoPersonAddOutline, IoRefreshOutline,
  IoReceiptOutline 
} from "react-icons/io5";

function UserManagement() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { users, loading: adminLoading } = useSelector((state) => state.admin);
  const { lastRfid } = useSelector((state) => state.iotSensor);

  // STATE TÌM KIẾM VÀ LỌC
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  // STATE FORM TẠO MỚI
  const [formData, setFormData] = useState({ name: "", email: "", password: "", role: "customer" });
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);

  // STATE RFID
  const [rfidModalOpen, setRfidModalOpen] = useState(false);
  const [rfidValue, setRfidValue] = useState("");
  const rfidInputRef = useRef(null);

  // STATE CHỈNH SỬA
  const [editingUser, setEditingUser] = useState(null);
  const [editFormData, setEditFormData] = useState({ name: "", email: "", role: "", rfidCard: "", newPassword: "" });
  const [editAvatarPreview, setEditAvatarPreview] = useState(null);
  const [editAvatarFile, setEditAvatarFile] = useState(null);
  const [isScanningEditRfid, setIsScanningEditRfid] = useState(false);

  // STATE LỊCH SỬ ĐƠN HÀNG
  const [viewingUserOrders, setViewingUserOrders] = useState(null);
  const [userOrders, setUserOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // STATE XÁC THỰC (MODAL DELETE / EDIT)
  const [authModalConfig, setAuthModalConfig] = useState({ isOpen: false, actionType: null, targetUserId: null, pendingData: null });
  const [authScannedRfid, setAuthScannedRfid] = useState("");
  const [adminPassword, setAdminPassword] = useState("");

  // FETCH DANH SÁCH USER
  useEffect(() => {
    if (user?.role === "admin") { dispatch(fetchUsers()); }
  }, [dispatch, user]);

  useEffect(() => {
    const fetchUserOrders = async () => {
      if (!viewingUserOrders) return;
      setLoadingOrders(true);
      try {
        // 👇👇👇 ĐỔI SỐ 5000 THÀNH 9000 Ở ĐÂY NÈ FEN 👇👇👇
        const res = await fetch(`http://localhost:9000/api/admin/orders/user/${viewingUserOrders._id}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("userToken")}`, 
          },
        });
        const data = await res.json();
        
        if (res.ok) {
          setUserOrders(data);
        } else {
          toast.error(data.message || "Lỗi khi tải đơn hàng");
        }
      } catch (error) {
        console.error(error);
        toast.error("Mất kết nối đến server!");
      } finally {
        setLoadingOrders(false);
      }
    };

    if (viewingUserOrders) {
      fetchUserOrders();
    } else {
      setUserOrders([]);
    }
  }, [viewingUserOrders, user?.token]);

  // LẮNG NGHE TÍN HIỆU RFID
  useEffect(() => {
    let interval;
    if (rfidModalOpen || isScanningEditRfid || authModalConfig.isOpen) {
      interval = setInterval(() => { dispatch(fetchLastRfid()); }, 1000);
      if (rfidModalOpen && rfidInputRef.current) rfidInputRef.current.focus();
    } else {
      dispatch(resetLastRfid());     
      dispatch(clearBackendRfid());  
      if (!rfidModalOpen) setRfidValue(""); 
      if (!authModalConfig.isOpen) {
        setAuthScannedRfid("");
        setAdminPassword("");
      }
    }
    return () => clearInterval(interval);
  }, [rfidModalOpen, isScanningEditRfid, authModalConfig.isOpen, dispatch]);

  // XỬ LÝ DỮ LIỆU THẺ RFID
  useEffect(() => {
    if (lastRfid) {
      if (rfidModalOpen) {
        setRfidValue(lastRfid);
        toast.success("Đã nhận diện mã thẻ!");
      } else if (isScanningEditRfid) {
        setEditFormData(prev => ({ ...prev, rfidCard: lastRfid }));
        setIsScanningEditRfid(false);
        toast.success("Đã cập nhật mã thẻ cho User!");
      } else if (authModalConfig.isOpen) {
        setAuthScannedRfid(lastRfid);
        setAdminPassword(""); 
        toast.success("Đã quét thẻ xác thực!");
      }
    }
  }, [lastRfid, rfidModalOpen, isScanningEditRfid, authModalConfig.isOpen]);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) { setAvatarPreview(URL.createObjectURL(file)); setAvatarFile(file); }
  };

  const handleInitiateCreate = (e) => {
    e.preventDefault();
    const { name, email, password } = formData;
    if(!name || !email || !password) return toast.error("Vui lòng điền đủ thông tin!");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return toast.error("Email sai định dạng!");
    if (password.length < 6) return toast.error("Mật khẩu ít nhất 6 ký tự!");
    
    dispatch(resetLastRfid());
    dispatch(clearBackendRfid());
    setRfidModalOpen(true);
  };

  const handleRfidSubmit = (e) => {
    e.preventDefault();
    if (!rfidValue) return toast.error("Chưa có mã thẻ!");

    const submitData = new FormData();
    Object.keys(formData).forEach((key) => submitData.append(key, formData[key]));
    submitData.append("rfidCard", rfidValue);
    if (avatarFile) submitData.append("avatar", avatarFile);

    dispatch(addUser(submitData)).then((res) => {
      if (!res.error) {
        toast.success("Tạo người dùng thành công!");
        dispatch(resetLastRfid());
        setFormData({ name: "", email: "", password: "", role: "customer" });
        setAvatarPreview(null);
        setRfidModalOpen(false);
        setRfidValue("");
      } else {
        toast.error(res.payload?.message || res.payload || "Có lỗi xảy ra!");
      }
    });
  };

  const handleEditClick = (userData) => {
    setEditingUser(userData);
    setEditFormData({ 
      name: userData.name, 
      email: userData.email, 
      role: userData.role,
      rfidCard: userData.rfidCard || "",
      newPassword: "" 
    });
    setEditAvatarPreview(userData.avatar || null);
    setEditAvatarFile(null);
    setIsScanningEditRfid(false);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (editFormData.newPassword && editFormData.newPassword.length < 6) {
      return toast.error("Mật khẩu mới phải có ít nhất 6 ký tự!");
    }

    const updateData = new FormData();
    updateData.append("id", editingUser._id);
    updateData.append("name", editFormData.name);
    updateData.append("email", editFormData.email);
    updateData.append("role", editFormData.role);
    updateData.append("rfidCard", editFormData.rfidCard);
    
    if (editFormData.newPassword) {
      updateData.append("password", editFormData.newPassword);
    }
    if (editAvatarFile) updateData.append("avatar", editAvatarFile);
    
    dispatch(resetLastRfid());
    dispatch(clearBackendRfid());
    setAuthModalConfig({ isOpen: true, actionType: "edit", targetUserId: editingUser._id, pendingData: updateData });
  };

  const executeSecureAction = async (e) => {
    e.preventDefault();
    if (!authScannedRfid && !adminPassword) {
      return toast.error("Vui lòng quẹt thẻ hoặc nhập mật khẩu để xác thực!");
    }

    const { actionType, targetUserId, pendingData } = authModalConfig;
    try {
      if (actionType === "delete") {
        await dispatch(deleteUser({ 
          id: targetUserId, 
          authRfid: authScannedRfid || undefined, 
          currentPassword: adminPassword || undefined 
        })).unwrap();
        toast.success("Đã xóa thành công!");
      } else {
        if (authScannedRfid) pendingData.append("authRfid", authScannedRfid);
        if (adminPassword) pendingData.append("currentPassword", adminPassword);
        
        const result = await dispatch(updateUser(pendingData)).unwrap();
        if (result._id === user._id) dispatch(updateCurrentUser(result));
        toast.success("Cập nhật thành công!");
        setEditingUser(null);
        dispatch(fetchUsers());
      }
      setAuthModalConfig({ isOpen: false, actionType: null, targetUserId: null, pendingData: null }); 
    } catch (err) { 
      toast.error(err?.payload || "Xác thực thất bại! Kiểm tra lại mật khẩu hoặc thẻ."); 
    }
  };

  const processedUsers = [...(users || [])]
    .filter(u => (roleFilter === "all" || u.role === roleFilter) && (!searchTerm || u.name?.toLowerCase().includes(searchTerm.toLowerCase())))
    .sort((a, b) => a.name?.localeCompare(b.name));

  return (
    <div className="min-h-screen p-6 bg-gray-50 text-gray-800 font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER */}
        <div className="mb-6 border-b border-gray-200 pb-4">
          <h2 className="text-2xl font-bold text-gray-900">Quản lý Người dùng</h2>
          <p className="text-sm text-gray-500 mt-1">Hệ thống cấp quyền và quản lý tài khoản</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* CỘT TRÁI: FORM ĐĂNG KÝ */}
          <div className="lg:col-span-4 order-2 lg:order-1">
            <div className="bg-white p-6 rounded-sm shadow-sm border border-gray-200 sticky top-6">
              <div className="flex items-center gap-2 mb-6 border-b border-gray-100 pb-4">
                <IoPersonAddOutline className="text-blue-600" size={20}/>
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-800">Thêm Thành Viên Mới</h3>
              </div>
              <form onSubmit={handleInitiateCreate} className="space-y-4">
                <div className="flex justify-center mb-4">
                  <label className="relative cursor-pointer group">
                    <div className="w-20 h-20 rounded-sm border border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50 hover:border-blue-500 transition-colors">
                      {avatarPreview ? <img src={avatarPreview} className="w-full h-full object-cover" /> : <IoCameraOutline size={24} className="text-gray-400" />}
                    </div>
                    <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
                  </label>
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Họ và tên</label>
                  <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-2.5 bg-white border border-gray-300 rounded-sm outline-none focus:border-blue-500 text-sm" required />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Email</label>
                  <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full p-2.5 bg-white border border-gray-300 rounded-sm outline-none focus:border-blue-500 text-sm" required />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Mật khẩu</label>
                  <input type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full p-2.5 bg-white border border-gray-300 rounded-sm outline-none focus:border-blue-500 text-sm" required />
                </div>
                
                <button type="submit" disabled={adminLoading} className="w-full py-2.5 mt-2 bg-blue-600 text-white rounded-sm font-bold hover:bg-blue-700 transition-colors text-sm disabled:opacity-50 flex items-center justify-center gap-2">
                  Tiếp tục gắn thẻ RFID
                </button>
              </form>
            </div>
          </div>

          {/* CỘT PHẢI: DANH SÁCH */}
          <div className="lg:col-span-8 order-1 lg:order-2 space-y-4">
            
            {/* Thanh tìm kiếm */}
            <div className="flex items-center bg-white p-3 rounded-sm border border-gray-200 shadow-sm gap-2">
                <IoSearchOutline className="text-gray-400 ml-2" size={18} />
                <input type="text" placeholder="Tìm tên/email..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="flex-1 p-2 text-sm bg-transparent outline-none" />
                <div className="h-6 w-px bg-gray-200 mx-2"></div>
                <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="bg-transparent font-bold text-xs uppercase outline-none text-gray-600 cursor-pointer pr-2">
                    <option value="all">Tất cả vai trò</option>
                    <option value="admin">Quản trị viên</option>
                    <option value="customer">Người dùng</option>
                </select>
            </div>

            {/* Bảng dữ liệu */}
            <div className="bg-white rounded-sm border border-gray-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left whitespace-nowrap">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr className="text-[10px] font-bold text-gray-500 uppercase">
                      <th className="px-6 py-4">Người dùng</th>
                      <th className="px-6 py-4 text-center">Phân quyền</th>
                      <th className="px-6 py-4 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {processedUsers.map(u => (
                      <tr key={u._id} className="hover:bg-gray-50 transition-colors group">
                        <td className="px-6 py-4 flex items-center gap-3">
                          <div className="w-9 h-9 bg-gray-100 rounded-sm border border-gray-200 flex items-center justify-center overflow-hidden font-bold text-gray-500">
                            {u.avatar ? <img src={u.avatar} className="w-full h-full object-cover"/> : u.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-sm text-gray-800">{u.name}</p>
                            <p className="text-xs text-gray-500">{u.email}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-2 py-1 rounded-sm text-[10px] font-bold uppercase ${u.role === 'admin' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-gray-100 text-gray-600 border border-gray-200'}`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {/* Nút Xem Lịch Sử Hóa Đơn */}
                            <button onClick={() => setViewingUserOrders(u)} className="p-1.5 text-green-600 hover:bg-green-50 border border-transparent hover:border-green-200 rounded-sm transition-colors" title="Lịch sử đơn hàng">
                              <IoReceiptOutline size={18}/>
                            </button>

                            <button onClick={() => handleEditClick(u)} className="p-1.5 text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-200 rounded-sm transition-colors" title="Chỉnh sửa">
                              <IoCreateOutline size={18}/>
                            </button>
                            
                            <button onClick={() => {
                                dispatch(resetLastRfid());
                                dispatch(clearBackendRfid());
                                setAuthModalConfig({isOpen: true, actionType: "delete", targetUserId: u._id, pendingData: null});
                            }} className="p-1.5 text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 rounded-sm transition-colors" title="Xóa">
                              <IoTrashOutline size={18}/>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {processedUsers.length === 0 && (
                      <tr>
                        <td colSpan="3" className="px-6 py-8 text-center text-sm text-gray-400">Không tìm thấy người dùng nào.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL HIỂN THỊ LỊCH SỬ ĐƠN HÀNG */}
      {viewingUserOrders && (
        <div className="fixed inset-0 flex items-center justify-center z-50 px-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-sm w-full max-w-4xl shadow-xl border border-gray-200 flex flex-col max-h-[80vh]">
            <div className="p-5 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <div>
                <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                  <IoReceiptOutline className="text-green-600" />
                  Lịch sử mua hàng
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Khách hàng: <span className="font-bold text-gray-700">{viewingUserOrders.name}</span> ({viewingUserOrders.email})
                </p>
              </div>
              <button onClick={() => setViewingUserOrders(null)} className="text-gray-400 hover:text-gray-800 transition-colors bg-white p-1 rounded-sm border border-gray-200 shadow-sm">
                <IoCloseOutline size={22}/>
              </button>
            </div>
            
            <div className="p-0 overflow-y-auto flex-1 bg-white">
              {loadingOrders ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                  <p className="text-sm font-bold text-gray-500">Đang tải dữ liệu đơn hàng...</p>
                </div>
              ) : userOrders && userOrders.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left whitespace-nowrap">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr className="text-[10px] font-bold text-gray-500 uppercase">
                        <th className="px-6 py-4">Mã đơn (Order ID)</th>
                        <th className="px-6 py-4">Ngày tạo</th>
                        <th className="px-6 py-4">Địa chỉ giao</th>
                        <th className="px-6 py-4 text-center">Số SP</th>
                        <th className="px-6 py-4 text-right">Tổng tiền</th>
                        <th className="px-6 py-4 text-center">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {userOrders.map((order) => (
                        <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <span className="font-mono font-bold text-gray-700 text-sm">
                              #{order._id.substring(0, 6).toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {new Date(order.createdAt).toLocaleDateString("vi-VN")}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600 truncate max-w-[150px]">
                            {order.shippingAddress?.address || "Tại quầy, VN"}
                          </td>
                          <td className="px-6 py-4 text-center text-sm font-bold text-gray-700">
                            {order.orderItems?.length || 0}
                          </td>
                          <td className="px-6 py-4 text-right font-bold text-red-600 text-sm">
                            {order.totalPrice?.toLocaleString("vi-VN")} đ
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="px-2 py-1 bg-green-50 text-green-700 border border-green-200 rounded-sm text-[10px] font-bold uppercase">
                              {order.isPaid ? "PAID" : "UNPAID"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-20 bg-gray-50/50">
                  <IoReceiptOutline size={40} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-sm font-bold text-gray-600">Không có đơn hàng nào</p>
                  <p className="text-xs text-gray-500 mt-1">Khách hàng này chưa thực hiện giao dịch nào trên hệ thống.</p>
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-gray-200 bg-gray-50 text-right">
              <button onClick={() => setViewingUserOrders(null)} className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-sm font-bold text-sm hover:bg-gray-100 transition-colors shadow-sm">
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL RFID TẠO MỚI */}
      {rfidModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 px-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-sm p-8 w-full max-w-sm text-center shadow-xl border border-gray-200">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-100">
                <IoIdCardOutline size={30} className="text-blue-600 animate-pulse" />
              </div>
              <h3 className="text-lg font-bold mb-1 text-gray-800">Quét Thẻ RFID</h3>
              <p className="text-xs text-gray-500 mb-6">Đưa thẻ vào máy quét để hoàn tất đăng ký</p>
              
              <form onSubmit={handleRfidSubmit}>
                <input ref={rfidInputRef} type="text" value={rfidValue} onChange={e => setRfidValue(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-300 rounded-sm text-center text-lg tracking-widest outline-none mb-6 font-mono font-bold text-gray-800" placeholder="Đang đợi..." readOnly />
                <div className="flex gap-2">
                  <button type="button" onClick={() => setRfidModalOpen(false)} className="flex-1 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-sm font-bold text-sm hover:bg-gray-50">Hủy</button>
                  <button type="submit" disabled={!rfidValue || adminLoading} className="flex-1 py-2.5 bg-blue-600 text-white rounded-sm font-bold text-sm hover:bg-blue-700 disabled:opacity-50">Lưu dữ liệu</button>
                </div>
              </form>
          </div>
        </div>
      )}

      {/* MODAL CHỈNH SỬA USER */}
      {editingUser && (
        <div className="fixed inset-0 flex items-center justify-center z-50 px-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-sm p-6 w-full max-w-md shadow-xl relative border border-gray-200">
              <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                <h3 className="text-base font-bold text-gray-800">Cập nhật thông tin</h3>
                <button onClick={() => setEditingUser(null)} className="text-gray-400 hover:text-gray-800"><IoCloseOutline size={20}/></button>
              </div>
              
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div className="flex justify-center mb-2">
                  <label className="relative cursor-pointer group">
                    <div className="w-16 h-16 rounded-sm border border-gray-300 overflow-hidden flex items-center justify-center bg-gray-50 hover:border-blue-500">
                      {editAvatarPreview ? <img src={editAvatarPreview} className="w-full h-full object-cover" /> : <span className="text-xl font-bold text-gray-400">{editFormData.name.charAt(0)}</span>}
                    </div>
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) { setEditAvatarPreview(URL.createObjectURL(file)); setEditAvatarFile(file); }
                    }} />
                  </label>
                </div>

                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-gray-600 mb-1">Họ và tên</label>
                    <input type="text" value={editFormData.name} onChange={e => setEditFormData({...editFormData, name: e.target.value})} className="w-full p-2.5 bg-white border border-gray-300 rounded-sm outline-none focus:border-blue-500 text-sm" required/>
                  </div>
                  <div className="w-1/3">
                    <label className="block text-xs font-bold text-gray-600 mb-1">Quyền</label>
                    <select value={editFormData.role} onChange={e => setEditFormData({...editFormData, role: e.target.value})} className="w-full p-2.5 bg-white border border-gray-300 rounded-sm outline-none focus:border-blue-500 text-sm">
                      <option value="customer">Người dùng</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Email</label>
                  <input type="email" value={editFormData.email} onChange={e => setEditFormData({...editFormData, email: e.target.value})} className="w-full p-2.5 bg-white border border-gray-300 rounded-sm outline-none focus:border-blue-500 text-sm" required/>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Đổi mật khẩu (Bỏ trống nếu giữ nguyên)</label>
                  <input 
                    type="password" 
                    value={editFormData.newPassword} 
                    onChange={e => setEditFormData({...editFormData, newPassword: e.target.value})} 
                    className="w-full p-2.5 bg-white border border-gray-300 rounded-sm outline-none focus:border-blue-500 text-sm" 
                    placeholder="Nhập mật khẩu mới..."
                  />
                </div>

                <div className="p-3 bg-gray-50 border border-gray-200 rounded-sm mt-2">
                  <label className="text-[10px] font-bold text-gray-500 uppercase mb-2 block">Cập nhật thẻ RFID (Tùy chọn)</label>
                  <div className="flex items-center gap-2">
                     <input
                       type="text"
                       value={isScanningEditRfid ? "Đang chờ tín hiệu..." : (editFormData.rfidCard || "Chưa gán thẻ")}
                       className={`flex-1 p-2 rounded-sm font-mono text-sm outline-none border transition-colors ${isScanningEditRfid ? 'bg-blue-50 text-blue-600 border-blue-300' : 'bg-white text-gray-500 border-gray-300'}`}
                       readOnly
                     />
                     {isScanningEditRfid ? (
                       <button type="button" onClick={() => setIsScanningEditRfid(false)} className="px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-sm font-bold text-xs hover:bg-gray-100">
                         Hủy
                       </button>
                     ) : (
                       <button type="button" onClick={() => {
                           dispatch(resetLastRfid());
                           dispatch(clearBackendRfid()); 
                           setIsScanningEditRfid(true);
                       }} className="px-3 py-2 bg-white border border-gray-300 text-blue-600 rounded-sm font-bold text-xs hover:bg-blue-50 flex items-center gap-1">
                          <IoRefreshOutline size={14}/> Quét lại
                       </button>
                     )}
                  </div>
                </div>

                <button type="submit" disabled={adminLoading || isScanningEditRfid} className="w-full py-2.5 mt-2 bg-blue-600 text-white rounded-sm font-bold hover:bg-blue-700 transition-colors text-sm disabled:opacity-50">
                  Lưu thay đổi
                </button>
              </form>
          </div>
        </div>
      )}

      {/* MODAL XÁC THỰC BẢO MẬT */}
      {authModalConfig.isOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-[2000] px-4 bg-gray-900/60 backdrop-blur-sm">
           <div className="bg-white rounded-sm p-6 w-full max-w-sm shadow-xl border border-gray-200">
              <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-4">
                  <IoLockClosedOutline size={20} className="text-red-500" />
                  <h3 className="font-bold text-gray-800">Xác thực hệ thống</h3>
              </div>
              
              <p className="text-xs text-gray-500 mb-4">Vui lòng quét thẻ hoặc nhập mật khẩu Admin để phê duyệt hành động này.</p>
              
              <form onSubmit={executeSecureAction}>
                 <div className="mb-3">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Mã thẻ RFID</label>
                    <input 
                       type="text" 
                       value={authScannedRfid || ""} 
                       placeholder="Chưa nhận tín hiệu thẻ..."
                       className="w-full p-2.5 bg-gray-50 rounded-sm outline-none border border-gray-300 text-sm font-mono text-gray-700 focus:border-blue-500" 
                       readOnly 
                    />
                 </div>

                 <div className="flex items-center justify-center gap-4 my-4">
                    <div className="h-px bg-gray-200 flex-1"></div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Hoặc</span>
                    <div className="h-px bg-gray-200 flex-1"></div>
                 </div>

                 <div className="mb-6">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Mật khẩu Admin</label>
                    <input 
                       type="password" 
                       value={adminPassword}
                       onChange={(e) => {
                         setAdminPassword(e.target.value);
                         if(authScannedRfid) setAuthScannedRfid("");
                       }}
                       placeholder="Nhập mật khẩu xác nhận..."
                       className="w-full p-2.5 bg-white rounded-sm outline-none border border-gray-300 text-sm focus:border-blue-500" 
                    />
                 </div>

                 <div className="flex gap-2">
                    <button type="button" onClick={() => setAuthModalConfig({isOpen: false, actionType: null, targetUserId: null, pendingData: null})} className="flex-1 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-sm font-bold text-sm hover:bg-gray-50">Hủy</button>
                    <button type="submit" disabled={adminLoading || (!authScannedRfid && !adminPassword)} className="flex-1 py-2.5 bg-blue-600 text-white font-bold rounded-sm hover:bg-blue-700 disabled:opacity-50 text-sm">Phê duyệt</button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}

export default UserManagement;