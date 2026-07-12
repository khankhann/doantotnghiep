import { useEffect, useState, useRef } from "react"; 
import { useDispatch, useSelector } from "react-redux";
import { addUser, deleteUser, fetchUsers, updateUser } from "@redux/slices/adminSlice";
import { updateCurrentUser } from "@redux/slices/authSlice";
import { fetchLastRfid, resetLastRfid, clearBackendRfid } from "@redux/slices/iotSensorSlice";
import { toast } from "sonner";
import {
  IoSearchOutline, IoTrashOutline, IoCameraOutline, IoIdCardOutline, 
  IoCreateOutline, IoCloseOutline, IoLockClosedOutline, IoPersonAddOutline, IoRefreshOutline
} from "react-icons/io5";

function UserManagement() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { users, loading: adminLoading } = useSelector((state) => state.admin);
  const { lastRfid } = useSelector((state) => state.iotSensor);

  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const [formData, setFormData] = useState({ name: "", email: "", password: "", role: "customer" });
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);

  const [rfidModalOpen, setRfidModalOpen] = useState(false);
  const [rfidValue, setRfidValue] = useState("");
  const rfidInputRef = useRef(null);

  const [editingUser, setEditingUser] = useState(null);
  const [editFormData, setEditFormData] = useState({ name: "", email: "", role: "", rfidCard: "" });
  const [editAvatarPreview, setEditAvatarPreview] = useState(null);
  const [editAvatarFile, setEditAvatarFile] = useState(null);
  const [isScanningEditRfid, setIsScanningEditRfid] = useState(false);

  // 👉 CẤU HÌNH MODAL XÁC THỰC (Cho phép nhập cả Thẻ và Password)
  const [authModalConfig, setAuthModalConfig] = useState({ isOpen: false, actionType: null, targetUserId: null, pendingData: null });
  const [authScannedRfid, setAuthScannedRfid] = useState("");
  const [adminPassword, setAdminPassword] = useState("");

  useEffect(() => {
    if (user?.role === "admin") { dispatch(fetchUsers()); }
  }, [dispatch, user]);

  // LẮNG NGHE THẺ RFID
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

  // XỬ LÝ NHẬN THẺ
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
        // Tự động clear password nếu người dùng quét thẻ
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
      rfidCard: userData.rfidCard || "" 
    });
    setEditAvatarPreview(userData.avatar || null);
    setEditAvatarFile(null);
    setIsScanningEditRfid(false);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    const updateData = new FormData();
    updateData.append("id", editingUser._id);
    updateData.append("name", editFormData.name);
    updateData.append("email", editFormData.email);
    updateData.append("role", editFormData.role);
    updateData.append("rfidCard", editFormData.rfidCard);
    if (editAvatarFile) updateData.append("avatar", editAvatarFile);
    
    dispatch(resetLastRfid());
    dispatch(clearBackendRfid());
    setAuthModalConfig({ isOpen: true, actionType: "edit", targetUserId: editingUser._id, pendingData: updateData });
  };

  const executeSecureAction = async (e) => {
    e.preventDefault();
    
    // Phải có 1 trong 2: Quẹt thẻ HOẶC Nhập mật khẩu
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

      {/* MODAL XÁC THỰC BẢO MẬT (HỖ TRỢ THẺ + PASSWORD) */}
      {authModalConfig.isOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-[2000] px-4 bg-gray-900/60 backdrop-blur-sm">
           <div className="bg-white rounded-sm p-6 w-full max-w-sm shadow-xl border border-gray-200">
              <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-4">
                  <IoLockClosedOutline size={20} className="text-red-500" />
                  <h3 className="font-bold text-gray-800">Xác thực hệ thống</h3>
              </div>
              
              <p className="text-xs text-gray-500 mb-4">Vui lòng quét thẻ hoặc nhập mật khẩu Admin để phê duyệt hành động này.</p>
              
              <form onSubmit={executeSecureAction}>
                 {/* Lựa chọn 1: Quẹt thẻ */}
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

                 {/* Lựa chọn 2: Nhập Password */}
                 <div className="mb-6">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Mật khẩu Admin</label>
                    <input 
                       type="password" 
                       value={adminPassword}
                       onChange={(e) => {
                         setAdminPassword(e.target.value);
                         if(authScannedRfid) setAuthScannedRfid(""); // Xóa thẻ nếu người dùng cố tình gõ pass
                       }}
                       placeholder="Nhập mật khẩu..."
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