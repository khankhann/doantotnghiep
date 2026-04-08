import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { addUser, deleteUser, fetchUsers, updateUser } from "@redux/slices/adminSlice";
import { updateCurrentUser } from "@redux/slices/authSlice";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  IoSearchOutline, IoTrashOutline, IoCameraOutline, IoShieldCheckmarkOutline,
  IoPersonOutline, IoCreateOutline, IoChatbubbleEllipsesOutline, IoCloseOutline,
  IoLockClosedOutline // 🔥 Thêm icon ổ khóa
} from "react-icons/io5";

function UserManagement() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { users, loading, error } = useSelector((state) => state.admin);

  // --- STATE CHUNG ---
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");

  // --- STATE FORM THÊM MỚI ---
  const [formData, setFormData] = useState({ name: "", email: "", password: "", role: "customer" });
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);

  // --- STATE MODAL SỬA ---
  const [editingUser, setEditingUser] = useState(null);
  const [editFormData, setEditFormData] = useState({ name: "", email: "", role: "" });
  const [editAvatarPreview, setEditAvatarPreview] = useState(null);
  const [editAvatarFile, setEditAvatarFile] = useState(null);

  // 🔥 --- STATE MODAL XÁC THỰC MẬT KHẨU --- 🔥
  const [authModalConfig, setAuthModalConfig] = useState({
    isOpen: false,
    actionType: null, // "edit" | "delete" | "roleChange"
    targetUserId: null,
    pendingData: null // Lưu tạm FormData nếu đang edit
  });
  const [adminPassword, setAdminPassword] = useState("");

  useEffect(() => {
    if (user && user.role === "admin") { dispatch(fetchUsers()); }
  }, [dispatch, user]);

  useEffect(() => {
    if (!user && user?.role !== "admin") { navigate("/"); }
  }, [user, navigate]);

  // ==========================================
  // LOGIC THÊM USER (Không cần hỏi pass admin)
  // ==========================================
  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarPreview(URL.createObjectURL(file));
      setAvatarFile(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const submitData = new FormData();
    submitData.append("name", formData.name);
    submitData.append("email", formData.email);
    submitData.append("password", formData.password);
    submitData.append("role", formData.role);
    if (avatarFile) submitData.append("avatar", avatarFile);

    dispatch(addUser(submitData)).then(() => {
      toast.success("Tạo người dùng thành công!");
    });

    setFormData({ name: "", email: "", password: "", role: "customer" });
    setAvatarPreview(null);
    setAvatarFile(null);
  };


  // ==========================================
  // LOGIC CHUẨN BỊ XÓA / ĐỔI ROLE NHANH (Mở Modal hỏi pass)
  // ==========================================
  const handleRoleChangeQuick = (userId, newRole) => {
    // Lưu ý: Nếu Backend bắt gửi FormData, ta tạo FormData ảo chứa pass
    const tempForm = new FormData();
    tempForm.append("id", userId);
    tempForm.append("role", newRole);
    // Tớ giữ lại thông tin cũ kẻo API đè mất
    const targetUser = users.find(u => u._id === userId);
    if(targetUser) {
        tempForm.append("name", targetUser.name);
        tempForm.append("email", targetUser.email);
    }

    setAuthModalConfig({ isOpen: true, actionType: "roleChange", targetUserId: userId, pendingData: tempForm });
  };

  const initiateDelete = (userId) => {
    setAuthModalConfig({ isOpen: true, actionType: "delete", targetUserId: userId, pendingData: null });
  };


  // ==========================================
  // LOGIC MODAL SỬA USER (Chuẩn bị mở Modal xác thực)
  // ==========================================
  const handleEditClick = (userData) => {
    setEditingUser(userData);
    setEditFormData({ name: userData.name, email: userData.email, role: userData.role });
    setEditAvatarPreview(userData.avatar || null);
    setEditAvatarFile(null);
  };

  const closeEditModal = () => {
    setEditingUser(null);
    setEditFormData({ name: "", email: "", role: "" });
    setEditAvatarPreview(null);
    setEditAvatarFile(null);
  };

  const handleEditAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setEditAvatarPreview(URL.createObjectURL(file));
      setEditAvatarFile(file);
    }
  };

  const initiateEditSubmit = (e) => {
    e.preventDefault();
    const updateData = new FormData();
    updateData.append("id", editingUser._id);
    updateData.append("name", editFormData.name);
    updateData.append("email", editFormData.email);
    updateData.append("role", editFormData.role);
    if (editAvatarFile) updateData.append("avatar", editAvatarFile);

    // Thay vì gửi luôn, Mở Modal Xác Thực Mật Khẩu
    setAuthModalConfig({ isOpen: true, actionType: "edit", targetUserId: editingUser._id, pendingData: updateData });
  };


  // ==========================================
  // 🔥 LOGIC THỰC THI CHÍNH (Sau khi đã nhập mật khẩu) 🔥
  // ==========================================
  const executeSecureAction = async (e) => {
    e.preventDefault();
    if (!adminPassword) return toast.error("Vui lòng nhập mật khẩu!");

    const { actionType, targetUserId, pendingData } = authModalConfig;

    try {
      if (actionType === "delete") {
        // Gửi lệnh xóa (Nếu Backend yêu cầu pass để xóa, fen phải độ thêm API delete nhận body)
        // Hiện tại deleteUser thunk của fen chỉ nhận ID. Nếu cần gửi pass, phải sửa lại Thunk.
        // Tạm thời tớ ví dụ việc gọi hàm xóa cũ, fen tự customize thêm pass vào Redux nếu Backend bắt buộc.
        await dispatch(deleteUser({id : targetUserId, currentPassword: adminPassword})).unwrap();
        toast.success("Đã xóa người dùng!");

      } else if (actionType === "edit" || actionType === "roleChange") {
        // Nhét thêm mật khẩu admin vào gói hàng FormData
        pendingData.append("currentPassword", adminPassword);

        const actionResult = await dispatch(updateUser(pendingData)).unwrap();
        
        if (actionResult && actionResult._id === user._id) {
           dispatch(updateCurrentUser(actionResult));
        }
        toast.success("Cập nhật thành công!");
        if(actionType === "edit") closeEditModal();
        dispatch(fetchUsers());
      }
      
      closeAuthModal();
    } catch (error) {
      // Bắt lỗi từ Backend (Ví dụ: Sai mật khẩu)
      toast.error(error || "Xác thực thất bại hoặc có lỗi xảy ra!");
    }
  };

  const closeAuthModal = () => {
    setAuthModalConfig({ isOpen: false, actionType: null, targetUserId: null, pendingData: null });
    setAdminPassword("");
  };


  const handleChat = (userData) => { toast.success(`Đang kết nối chat với ${userData.name}...`); };

  const processedUsers = [...(users || [])]
    .filter(u => (roleFilter === "all" || u.role === roleFilter) && (!searchTerm || u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || u.email?.toLowerCase().includes(searchTerm.toLowerCase())))
    .sort((a, b) => {
      if (sortBy === "name") return a.name?.localeCompare(b.name);
      if (sortBy === "email") return a.email?.localeCompare(b.email);
      if (sortBy === "role") return a.role?.localeCompare(b.role);
      return 0;
    });

  if (loading) return <div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div></div>;

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen relative">
      
      {/* HEADER TỔNG */}
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Quản lý Tài khoản</h2>
          <p className="text-gray-500 text-sm mt-1">Thêm mới, chỉnh sửa và quản lý quyền truy cập.</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100 flex gap-4">
           <div className="text-center px-4 border-r border-gray-100">
              <p className="text-xs text-gray-400 uppercase font-bold">Tổng User</p>
              <p className="text-xl font-bold text-gray-800">{users?.length || 0}</p>
           </div>
           <div className="text-center px-4">
              <p className="text-xs text-gray-400 uppercase font-bold">Admin</p>
              <p className="text-xl font-bold text-blue-600">{users?.filter(u => u.role === 'admin').length || 0}</p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* CỘT TRÁI: FORM THÊM NGƯỜI DÙNG */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 sticky top-6">
            <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-sm">+</span>
              Thêm Người Dùng
            </h3>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="flex flex-col items-center justify-center mb-6">
                <label className="relative cursor-pointer group">
                  <div className={`w-24 h-24 rounded-full border-2 border-dashed flex items-center justify-center overflow-hidden transition-all ${avatarPreview ? 'border-transparent shadow-md' : 'border-gray-300 hover:border-gray-500 bg-gray-50'}`}>
                    {avatarPreview ? <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" /> : <IoCameraOutline size={30} className="text-gray-400 group-hover:text-gray-600" />}
                  </div>
                  <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
                </label>
              </div>
              <div><label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Họ và Tên</label><input type="text" name="name" value={formData.name} onChange={handleChange} required className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black" /></div>
              <div><label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Email</label><input type="email" name="email" value={formData.email} onChange={handleChange} required className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black" /></div>
              <div><label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Mật khẩu</label><input type="password" name="password" value={formData.password} onChange={handleChange} required className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black" /></div>
              <div><label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Vai trò (Role)</label><select name="role" value={formData.role} onChange={handleChange} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black"><option value="customer">Khách hàng</option><option value="admin">Quản trị viên</option></select></div>
              <button type="submit" className="w-full bg-black text-white font-bold py-3 px-4 rounded-xl hover:bg-gray-800 active:scale-[0.98] transition-all shadow-md mt-4">Tạo Tài Khoản</button>
            </form>
          </div>
        </div>

        {/* CỘT PHẢI: DANH SÁCH */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-96">
              <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input type="text" placeholder="Tìm tên hoặc email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black" />
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left border-collapse">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase">Người dùng</th>
                    <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase">Vai trò</th>
                    <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {processedUsers.map((u) => {
                    const avatarInitials = u.name ? u.name.charAt(0).toUpperCase() : '?';
                    const avatarBg = u.role === 'admin' ? 'bg-blue-600' : 'bg-gray-800';
                    return (
                      <tr key={u._id} className="hover:bg-gray-50/50 transition-colors group">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-4">
                            {u.avatar ? <img src={u.avatar} alt={u.name} className="w-10 h-10 rounded-full object-cover shadow-sm border border-gray-200" /> : <div className={`w-10 h-10 rounded-full ${avatarBg} text-white flex items-center justify-center font-bold shadow-sm`}>{avatarInitials}</div>}
                            <div><p className="text-sm font-bold text-gray-900">{u.name}</p><p className="text-xs text-gray-500">{u.email}</p></div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                           <div className="relative inline-block">
                              <select value={u.role} onChange={(e) => handleRoleChangeQuick(u._id, e.target.value)} className={`appearance-none text-xs font-bold pl-3 pr-8 py-1.5 rounded-lg border-2 focus:outline-none cursor-pointer transition-all ${u.role === 'admin' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-gray-50 text-gray-700 border-gray-100'}`}><option value="admin">Admin</option><option value="customer">Customer</option></select>
                              {u.role === 'admin' ? <IoShieldCheckmarkOutline className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-500 pointer-events-none" size={14}/> : <IoPersonOutline className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={14}/>}
                           </div>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-200">
                            <button onClick={() => handleChat(u)} className="p-2 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><IoChatbubbleEllipsesOutline size={20} /></button>
                            <button onClick={() => handleEditClick(u)} className="p-2 text-amber-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg"><IoCreateOutline size={20} /></button>
                            {/* 🔥 GỌI HÀM MỚI KHI BẤM XÓA */}
                            <button onClick={() => initiateDelete(u._id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><IoTrashOutline size={20} /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* 🔥 MODAL 1: SỬA THÔNG TIN USER 🔥 */}
      <AnimatePresence>
        {editingUser && !authModalConfig.isOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeEditModal} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9997]" />
            <div className="fixed inset-0 flex items-center justify-center z-[9998] pointer-events-none px-4">
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-white rounded-[24px] p-8 w-full max-w-[480px] shadow-2xl pointer-events-auto relative">
                <button onClick={closeEditModal} className="absolute top-5 right-5 p-2 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-600 transition-colors"><IoCloseOutline size={24} /></button>
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Chỉnh sửa thông tin</h3>
                {/* Thay thế onSubmit bằng initiateEditSubmit để nó bật Modal Pass lên */}
                <form onSubmit={initiateEditSubmit} className="space-y-5">
                  <div className="flex flex-col items-center justify-center mb-6">
                    <label className="relative cursor-pointer group">
                      <div className="w-28 h-28 rounded-full border-4 border-gray-100 flex items-center justify-center overflow-hidden shadow-md">
                        {editAvatarPreview ? <img src={editAvatarPreview} alt="Edit" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gray-800 text-white flex items-center justify-center text-4xl font-bold">{editFormData.name.charAt(0).toUpperCase()}</div>}
                      </div>
                      <input type="file" className="hidden" accept="image/*" onChange={handleEditAvatarChange} />
                    </label>
                  </div>
                  <div><label className="block text-xs font-bold text-gray-500 uppercase mb-2">Họ và Tên</label><input type="text" value={editFormData.name} onChange={(e) => setEditFormData({...editFormData, name: e.target.value})} required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black" /></div>
                  <div><label className="block text-xs font-bold text-gray-500 uppercase mb-2">Email</label><input type="email" value={editFormData.email} onChange={(e) => setEditFormData({...editFormData, email: e.target.value})} required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black" /></div>
                  <div><label className="block text-xs font-bold text-gray-500 uppercase mb-2">Vai trò</label><select value={editFormData.role} onChange={(e) => setEditFormData({...editFormData, role: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black"><option value="customer">Khách hàng</option><option value="admin">Quản trị viên</option></select></div>
                  <div className="flex gap-3 pt-4">
                    <button type="button" onClick={closeEditModal} className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-all">Hủy bỏ</button>
                    <button type="submit" className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-md">Tiếp tục</button>
                  </div>
                </form>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* 🔥 MODAL 2: XÁC THỰC MẬT KHẨU ADMIN BẮT BUỘC 🔥 */}
      <AnimatePresence>
        {authModalConfig.isOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 backdrop-blur-md z-[9999]" />
            <div className="fixed inset-0 flex items-center justify-center z-[10000] px-4">
              <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="bg-white rounded-3xl p-8 w-full max-w-[400px] shadow-2xl relative overflow-hidden">
                
                {/* Header trang trí */}
                <div className="absolute top-0 left-0 w-full h-2 bg-red-500"></div>
                
                <div className="flex flex-col items-center text-center mb-6 mt-2">
                    <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-4">
                        <IoLockClosedOutline size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">Xác thực Admin</h3>
                    <p className="text-sm text-gray-500">Vui lòng nhập mật khẩu của bạn để xác nhận hành động này.</p>
                </div>

                <form onSubmit={executeSecureAction} className="space-y-5">
                  <div>
                    <input 
                      type="password" 
                      value={adminPassword} 
                      onChange={(e) => setAdminPassword(e.target.value)} 
                      required 
                      autoFocus
                      placeholder="Nhập mật khẩu Admin..."
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all text-center tracking-widest font-mono" 
                    />
                  </div>

                  <div className="flex gap-3">
                    <button type="button" onClick={closeAuthModal} className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-all">Hủy</button>
                    <button type="submit" className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 shadow-md">Xác nhận</button>
                  </div>
                </form>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}

export default UserManagement;