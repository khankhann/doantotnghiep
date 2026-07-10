import { useEffect, useState, useRef } from "react"; 
import { useDispatch, useSelector } from "react-redux";
import { addUser, deleteUser, fetchUsers, updateUser } from "@redux/slices/adminSlice";
import { updateCurrentUser } from "@redux/slices/authSlice";
import { fetchLastRfid, resetLastRfid, clearBackendRfid } from "@redux/slices/iotSensorSlice";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  IoSearchOutline, IoTrashOutline, IoCameraOutline, IoIdCardOutline, 
  IoCreateOutline, IoCloseOutline, IoLockClosedOutline, IoFilterOutline, IoPersonAddOutline, IoRefreshOutline
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

  // 👉 STATE MỚI: Dành riêng cho Modal Chỉnh Sửa
  const [editingUser, setEditingUser] = useState(null);
  const [editFormData, setEditFormData] = useState({ name: "", email: "", role: "", rfidCard: "" });
  const [editAvatarPreview, setEditAvatarPreview] = useState(null);
  const [editAvatarFile, setEditAvatarFile] = useState(null);
  const [isScanningEditRfid, setIsScanningEditRfid] = useState(false); // Trạng thái đang quét thẻ ở form Edit

  const [authModalConfig, setAuthModalConfig] = useState({ isOpen: false, actionType: null, targetUserId: null, pendingData: null });
  const [adminPassword, setAdminPassword] = useState("");

  useEffect(() => {
    if (user?.role === "admin") { dispatch(fetchUsers()); }
  }, [dispatch, user]);

  // 🔥 NÂNG CẤP LOGIC LẮNG NGHE RFID CHUNG CHO CẢ 2 FORM
  useEffect(() => {
    let interval;
    // Bật máy quét nếu Modal Tạo Mới đang mở HOẶC bấm nút Quét ở Modal Edit
    if (rfidModalOpen || isScanningEditRfid) {
      interval = setInterval(() => { dispatch(fetchLastRfid()); }, 1000);
      if (rfidModalOpen && rfidInputRef.current) rfidInputRef.current.focus();
    } else {
      // Khi không quét nữa thì dọn dẹp bộ nhớ
      dispatch(resetLastRfid());     
      dispatch(clearBackendRfid());  
      if (!rfidModalOpen) setRfidValue(""); 
    }
    return () => clearInterval(interval);
  }, [rfidModalOpen, isScanningEditRfid, dispatch]);

  // 🔥 XỬ LÝ KHI NHẬN ĐƯỢC MÃ THẺ
  useEffect(() => {
    if (lastRfid) {
      if (rfidModalOpen) {
        // Đang ở form Tạo Mới
        setRfidValue(lastRfid);
        toast.success("Đã nhận diện thẻ RFID!");
      } else if (isScanningEditRfid) {
        // Đang ở form Chỉnh Sửa
        setEditFormData(prev => ({ ...prev, rfidCard: lastRfid }));
        setIsScanningEditRfid(false); // Quét xong tự động tắt chế độ quét
        toast.success("Đã cập nhật mã thẻ mới!");
      }
    }
  }, [lastRfid, rfidModalOpen, isScanningEditRfid]);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarPreview(URL.createObjectURL(file));
      setAvatarFile(file);
    }
  };

  const handleInitiateCreate = (e) => {
    e.preventDefault();
    const { name, email, password } = formData;
    if(!name || !email || !password) return toast.error("Điền đủ thông tin đã fen!");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return toast.error("Email sai định dạng!");
    if (password.length < 6) return toast.error("Mật khẩu ít nhất 6 ký tự!");
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
        toast.success("Tạo user thành công!");
        dispatch(resetLastRfid());
        setFormData({ name: "", email: "", password: "", role: "customer" });
        setAvatarPreview(null);
        setRfidModalOpen(false);
        setRfidValue("");
      } else {
        const errorMsg = res.payload?.message || res.payload || "Có lỗi xảy ra!";
        toast.error(errorMsg);
      }
    });
  };

  const handleEditClick = (userData) => {
    setEditingUser(userData);
    // 👉 Đổ dữ liệu cũ vào (bao gồm cả rfidCard)
    setEditFormData({ 
      name: userData.name, 
      email: userData.email, 
      role: userData.role,
      rfidCard: userData.rfidCard || "" // Tránh lỗi null nếu user cũ chưa có thẻ
    });
    setEditAvatarPreview(userData.avatar || null);
    setEditAvatarFile(null);
    setIsScanningEditRfid(false); // Reset trạng thái quét
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    const updateData = new FormData();
    updateData.append("id", editingUser._id);
    updateData.append("name", editFormData.name);
    updateData.append("email", editFormData.email);
    updateData.append("role", editFormData.role);
    // 👉 Đóng gói mã RFID mới (nếu có) để gửi lên server
    updateData.append("rfidCard", editFormData.rfidCard);
    
    if (editAvatarFile) updateData.append("avatar", editAvatarFile);
    
    setAuthModalConfig({ isOpen: true, actionType: "edit", targetUserId: editingUser._id, pendingData: updateData });
  };

  const executeSecureAction = async (e) => {
    e.preventDefault();
    const { actionType, targetUserId, pendingData } = authModalConfig;
    try {
      if (actionType === "delete") {
        await dispatch(deleteUser({id : targetUserId, currentPassword: adminPassword})).unwrap();
        toast.success("Đã xóa thành công!");
      } else {
        pendingData.set("currentPassword", adminPassword);
        const result = await dispatch(updateUser(pendingData)).unwrap();
        if (result._id === user._id) dispatch(updateCurrentUser(result));
        toast.success("Cập nhật thành công!");
        setEditingUser(null);
        dispatch(fetchUsers());
      }
      setAuthModalConfig({ ...authModalConfig, isOpen: false }); setAdminPassword("");
    } catch (err) { 
      toast.error(err?.payload || "Xác thực Admin thất bại!"); 
    }
  };

  const processedUsers = [...(users || [])]
    .filter(u => (roleFilter === "all" || u.role === roleFilter) && (!searchTerm || u.name?.toLowerCase().includes(searchTerm.toLowerCase())))
    .sort((a, b) => a.name?.localeCompare(b.name));

  return (
    <div className="relative min-h-screen p-4 sm:p-8 bg-[#fdfdfd]">
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-[-5%] left-[-5%] w-[400px] h-[400px] bg-blue-100/40 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-5%] right-[-5%] w-[400px] h-[400px] bg-pink-100/40 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-7xl mx-auto">
        <header className="mb-10">
          <h2 className="text-3xl font-black tracking-tighter uppercase italic">User Control Center</h2>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* CỘT TRÁI: FORM ĐĂNG KÝ */}
          <div className="lg:col-span-4 order-2 lg:order-1">
            <div className="bg-white/70 backdrop-blur-xl border border-white p-8 rounded-[2rem] shadow-xl sticky top-8">
              <div className="flex items-center gap-3 mb-8">
                <IoPersonAddOutline className="text-blue-600" size={24}/>
                <h3 className="text-lg font-bold">Thêm Thành Viên</h3>
              </div>
              <form onSubmit={handleInitiateCreate} className="space-y-5">
                <div className="flex justify-center mb-4">
                  <label className="relative cursor-pointer group">
                    <div className="w-24 h-24 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-white hover:border-blue-500 transition-all">
                      {avatarPreview ? <img src={avatarPreview} className="w-full h-full object-cover" /> : <IoCameraOutline size={30} className="text-gray-300" />}
                    </div>
                    <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
                  </label>
                </div>
                <input type="text" placeholder="Họ và tên" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-4 bg-white/80 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-400/30" required />
                <input type="email" placeholder="Email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full p-4 bg-white/80 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-400/30" required />
                <input type="password" placeholder="Mật khẩu (6+ ký tự)" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full p-4 bg-white/80 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-400/30" required />
                <button type="submit" disabled={adminLoading} className="w-full py-4 bg-black text-white rounded-2xl font-bold hover:bg-gray-800 transition-all uppercase tracking-widest disabled:opacity-50">
                  {adminLoading ? "Đang xử lý..." : "Tiếp tục quẹt thẻ"}
                </button>
              </form>
            </div>
          </div>

          {/* CỘT PHẢI: DANH SÁCH */}
          <div className="lg:col-span-8 order-1 lg:order-2 space-y-6">
            <div className="flex bg-white/60 backdrop-blur-md p-2 rounded-2xl border border-white shadow-sm">
                <IoSearchOutline className="my-auto ml-4 text-gray-400" size={20} />
                <input type="text" placeholder="Tìm tên/email..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="flex-1 p-3 bg-transparent outline-none" />
                <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="bg-transparent font-bold text-[10px] px-4 uppercase outline-none border-l border-gray-200">
                    <option value="all">Tất cả</option>
                    <option value="admin">Admin</option>
                    <option value="customer">User</option>
                </select>
            </div>

            <div className="bg-white/70 backdrop-blur-xl border border-white rounded-[2.5rem] overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[600px]">
                  <thead>
                    <tr className="border-b border-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      <th className="p-6">User</th>
                      <th className="p-6">Vai trò</th>
                      <th className="p-6 text-right">Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {processedUsers.map(u => (
                      <tr key={u._id} className="group hover:bg-white/50 transition-all">
                        <td className="p-6 flex items-center gap-4">
                          <div className="w-11 h-11 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center overflow-hidden font-bold">
                            {u.avatar ? <img src={u.avatar} className="w-full h-full object-cover"/> : u.name.charAt(0)}
                          </div>
                          <div><p className="font-bold text-sm">{u.name}</p><p className="text-[10px] text-gray-400">{u.email}</p></div>
                        </td>
                        <td className="p-6"><span className={`px-3 py-1 rounded-full text-[10px] font-black ${u.role === 'admin' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>{u.role.toUpperCase()}</span></td>
                        <td className="p-6 text-right">
                          <div className="flex justify-end gap-2 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleEditClick(u)} className="p-2.5 bg-white rounded-xl text-amber-500 shadow-sm border border-gray-50 hover:scale-110 transition-transform"><IoCreateOutline size={18}/></button>
                            <button onClick={() => setAuthModalConfig({isOpen: true, actionType: "delete", targetUserId: u._id})} className="p-2.5 bg-white rounded-xl text-red-500 shadow-sm border border-gray-50 hover:scale-110 transition-transform"><IoTrashOutline size={18}/></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL RFID TẠO MỚI */}
      <AnimatePresence>
        {rfidModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center z-[1000] px-4">
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-black/40 backdrop-blur-md" />
            <motion.div initial={{scale:0.9, y:30}} animate={{scale:1, y:0}} exit={{scale:0.9, y:30}} className="bg-white/80 backdrop-blur-2xl rounded-[3rem] p-10 w-full max-w-[400px] z-[1001] text-center shadow-2xl border border-white">
                <IoIdCardOutline size={50} className="mx-auto mb-6 text-blue-600 animate-pulse" />
                <h3 className="text-2xl font-black mb-1 uppercase tracking-tighter text-gray-800">ĐANG ĐỢI THẺ</h3>
                <p className="text-sm text-gray-500 mb-10">Mã thẻ sẽ tự động xuất hiện khi bạn quẹt</p>
                <form onSubmit={handleRfidSubmit}>
                  <input ref={rfidInputRef} type="text" value={rfidValue} onChange={e => setRfidValue(e.target.value)} className="w-full p-4 bg-white border border-gray-100 rounded-2xl text-center text-2xl tracking-[0.2em] outline-none mb-6 font-mono font-bold text-blue-600" placeholder="--------" readOnly />
                  <div className="flex flex-col gap-2">
                    <button type="submit" disabled={!rfidValue || adminLoading} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg disabled:opacity-30">XÁC NHẬN TẠO</button>
                    <button type="button" onClick={() => setRfidModalOpen(false)} className="text-gray-400 font-bold hover:text-black py-2 text-xs tracking-widest transition-colors">HỦY BỎ</button>
                  </div>
                </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL CHỈNH SỬA USER */}
      <AnimatePresence>
        {editingUser && (
          <div className="fixed inset-0 flex items-center justify-center z-[1000] px-4">
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={() => setEditingUser(null)} className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div initial={{y:50, opacity:0}} animate={{y:0, opacity:1}} exit={{y:50, opacity:0}} className="bg-white rounded-[2.5rem] p-8 w-full max-w-[480px] z-[1001] shadow-2xl relative border border-white">
                <button onClick={() => setEditingUser(null)} className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-full transition-all text-gray-400"><IoCloseOutline size={20}/></button>
                <h3 className="text-xl font-bold mb-6 italic uppercase tracking-tighter">Edit Member</h3>
                
                <form onSubmit={handleEditSubmit} className="space-y-4">
                  {/* Ảnh đại diện */}
                  <div className="flex justify-center mb-2">
                    <label className="relative cursor-pointer group">
                      <div className="w-20 h-20 rounded-2xl border-4 border-gray-50 shadow-sm overflow-hidden flex items-center justify-center bg-gray-100">
                        {editAvatarPreview ? <img src={editAvatarPreview} className="w-full h-full object-cover" /> : <span className="text-3xl font-bold text-gray-300">{editFormData.name.charAt(0)}</span>}
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"><IoCameraOutline className="text-white" size={20} /></div>
                      </div>
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) { setEditAvatarPreview(URL.createObjectURL(file)); setEditAvatarFile(file); }
                      }} />
                    </label>
                  </div>

                  {/* Tên & Email */}
                  <div className="flex gap-4">
                    <input type="text" value={editFormData.name} onChange={e => setEditFormData({...editFormData, name: e.target.value})} className="w-1/2 p-4 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-blue-400/20 text-sm" required placeholder="Họ và tên"/>
                    <select value={editFormData.role} onChange={e => setEditFormData({...editFormData, role: e.target.value})} className="w-1/2 p-4 bg-gray-50 rounded-xl outline-none font-bold text-sm text-gray-600">
                      <option value="customer">CUSTOMER</option>
                      <option value="admin">ADMIN</option>
                    </select>
                  </div>
                  <input type="email" value={editFormData.email} onChange={e => setEditFormData({...editFormData, email: e.target.value})} className="w-full p-4 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-blue-400/20 text-sm" required placeholder="Email"/>

                  {/* 👉 KHU VỰC THAY ĐỔI MÃ RFID */}
                  <div className="flex flex-col gap-2 p-4 bg-blue-50/50 rounded-xl border border-blue-100 mt-2">
                    <label className="text-xs font-bold text-blue-600 uppercase tracking-widest flex items-center gap-2">
                      <IoIdCardOutline size={16} /> Liên kết thẻ RFID
                    </label>
                    <div className="flex items-center gap-3">
                       <input
                         type="text"
                         value={isScanningEditRfid ? "Đang đợi thẻ..." : (editFormData.rfidCard || "Chưa có thẻ")}
                         className={`flex-1 p-3 rounded-lg font-mono text-sm outline-none border transition-colors ${isScanningEditRfid ? 'bg-white text-blue-600 border-blue-300 animate-pulse' : 'bg-gray-100 text-gray-500 border-transparent'}`}
                         readOnly
                       />
                       
                       {/* Nút Hủy / Quét mới */}
                       {isScanningEditRfid ? (
                         <button type="button" onClick={() => setIsScanningEditRfid(false)} className="px-4 py-3 bg-red-100 text-red-600 rounded-lg font-bold text-sm hover:bg-red-200 transition-colors">
                           Hủy
                         </button>
                       ) : (
                         <button type="button" onClick={() => {
                             dispatch(resetLastRfid());
                             dispatch(clearBackendRfid()); // Xóa bộ nhớ đệm trước khi quét thẻ mới
                             setIsScanningEditRfid(true);
                         }} className="px-4 py-3 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 transition-colors shadow-md whitespace-nowrap flex items-center gap-2">
                            <IoRefreshOutline size={16}/> Cập nhật
                         </button>
                       )}
                    </div>
                  </div>

                  <button type="submit" disabled={adminLoading || isScanningEditRfid} className="w-full py-4 mt-4 bg-black text-white rounded-xl font-bold shadow-lg hover:bg-gray-800 transition-all uppercase tracking-widest disabled:opacity-50">
                    {adminLoading ? "Đang lưu..." : "Lưu thay đổi"}
                  </button>
                </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL XÁC THỰC ADMIN */}
      <AnimatePresence>
        {authModalConfig.isOpen && (
          <div className="fixed inset-0 flex items-center justify-center z-[2000] px-4">
             <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
             <motion.div initial={{scale:0.9}} animate={{scale:1}} exit={{scale:0.9}} className="bg-white rounded-[2rem] p-8 w-full max-w-[380px] z-[2001] text-center shadow-2xl">
                <IoLockClosedOutline size={40} className="mx-auto text-red-500 mb-4" />
                <h3 className="font-bold text-lg mb-2 uppercase tracking-tighter">Security Check</h3>
                <p className="text-xs text-gray-400 mb-8 font-medium italic">Vui lòng nhập mật khẩu Admin để xác nhận</p>
                <form onSubmit={executeSecureAction}>
                   <input type="password" value={adminPassword} onChange={e => setAdminPassword(e.target.value)} className="w-full p-4 bg-gray-50 rounded-2xl mb-6 text-center tracking-widest outline-none border focus:border-red-500 transition-all font-mono font-bold" placeholder="********" required autoFocus />
                   <div className="flex gap-3">
                      <button type="button" onClick={() => setAuthModalConfig({...authModalConfig, isOpen: false})} className="flex-1 py-3 bg-gray-100 rounded-xl font-bold text-gray-400 hover:bg-gray-200 transition-colors">HỦY</button>
                      <button type="submit" disabled={adminLoading} className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl shadow-md hover:bg-red-700 transition-colors">OK</button>
                   </div>
                </form>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default UserManagement;