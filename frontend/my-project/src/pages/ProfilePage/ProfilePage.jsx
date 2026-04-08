import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import MyOrderPage from "../MyOrderPage/MyOrderPage";
import { clearCart } from "@redux/slices/cartSlice";
import { logout, updateCurrentUser } from "@redux/slices/authSlice";
import { clearAdminMessages, clearAIMessages } from "@redux/slices/chatSlice";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { IoCameraOutline, IoCloseOutline } from "react-icons/io5";
import axios from "axios"; // Import axios để gọi API

function ProfilePage() {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // 🔥 STATE CHO MODAL CHỈNH SỬA
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editData, setEditData] = useState({ name: "", email: "", password: "" });
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  const handleLogout = () => {
    dispatch(logout());
    dispatch(clearCart());
    dispatch(clearAIMessages());
    dispatch(clearAdminMessages());
    navigate("/login");
  };

  // --- LOGIC MỞ/ĐÓNG MODAL ---
  const openEditModal = () => {
    setEditData({ name: user?.name || "", email: user?.email || "", password: "" });
    setAvatarPreview(user?.avatar || null);
    setAvatarFile(null);
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarPreview(URL.createObjectURL(file));
      setAvatarFile(file);
    }
  };

  // --- LOGIC GỬI API UPDATE ---
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsUpdating(true);

    // Gói dữ liệu vào FormData vì có chứa file ảnh
    const formData = new FormData();
    formData.append("name", editData.name);
    formData.append("email", editData.email);
    
    // Chỉ gửi mật khẩu lên nếu người dùng có nhập mật khẩu mới
    if (editData.password.trim() !== "") {
      formData.append("password", editData.password);
    }
    
    if (avatarFile) {
      formData.append("avatar", avatarFile);
    }

    try {
      const token = localStorage.getItem("userToken");
      // Gọi thẳng API cập nhật profile của user (Nhớ check lại link API của fen nhé)
      const { data } = await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/api/users/profile`, 
        formData, 
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Bắn Redux để update UI mượt mà không cần F5
      dispatch(updateCurrentUser(data)); 
      
      toast.success("Cập nhật hồ sơ thành công!");
      closeEditModal();
    } catch (error) {
      toast.error(error.response?.data?.message || "Có lỗi xảy ra khi cập nhật!");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col py-8 relative">
      <div className="flex-grow container mx-auto px-4 md:px-6">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* CỘT TRÁI: THÔNG TIN CÁ NHÂN */}
          <div className="w-full lg:w-1/3 xl:w-1/4">
            <div className="bg-white shadow-sm border border-gray-100 rounded-2xl p-8 flex flex-col items-center text-center sticky top-8">
              
              <div className="relative mb-6">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg bg-gray-100 flex items-center justify-center">
                  {user?.avatar ? (
                    <img src={user.avatar} alt={user?.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-5xl font-bold text-gray-400">
                      {user?.name?.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
              </div>

              <h1 className="text-2xl font-extrabold text-gray-900 mb-1">{user?.name}</h1>
              <p className="text-sm font-medium text-gray-500 mb-2">{user?.email}</p>

              <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full mb-6 ${user?.role === 'admin' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                {user?.role === 'admin' ? 'Quản trị viên' : 'Khách hàng'}
              </span>

              {/* NÚT CHỈNH SỬA HỒ SƠ */}
              <button 
                onClick={openEditModal}
                className="w-full bg-blue-600 text-white font-bold py-3.5 px-4 rounded-xl hover:bg-blue-700 active:scale-[0.98] transition-all shadow-md mb-3"
              >
                Chỉnh sửa hồ sơ
              </button>

              <button 
                onClick={handleLogout}
                className="w-full bg-gray-100 text-gray-700 font-bold py-3.5 px-4 rounded-xl hover:bg-gray-200 active:scale-[0.98] transition-all"
              >
                Đăng xuất
              </button>

            </div>
          </div>

          {/* CỘT PHẢI: LỊCH SỬ ĐƠN HÀNG */}
          <div className="w-full lg:w-2/3 xl:w-3/4">
            <div className="bg-white shadow-sm border border-gray-100 rounded-2xl p-6 md:p-8 min-h-[500px]">
               <h2 className="text-xl font-bold text-gray-900 mb-6 border-b pb-4">Lịch sử Đơn hàng</h2>
               <MyOrderPage />
            </div>
          </div>

        </div>
      </div>

      {/* 🔥 MODAL CHỈNH SỬA HỒ SƠ 🔥 */}
      <AnimatePresence>
        {isEditModalOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={closeEditModal}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]"
            />
            
            <div className="fixed inset-0 flex items-center justify-center z-[9999] pointer-events-none px-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white rounded-[24px] p-8 w-full max-w-[420px] shadow-2xl pointer-events-auto relative"
              >
                <button onClick={closeEditModal} className="absolute top-5 right-5 p-2 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-600 transition-colors">
                  <IoCloseOutline size={24} />
                </button>

                <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Cập nhật hồ sơ</h3>

                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  
                  {/* Khu vực đổi Avatar */}
                  <div className="flex flex-col items-center justify-center mb-4">
                    <label className="relative cursor-pointer group">
                      <div className="w-24 h-24 rounded-full border-4 border-gray-100 flex items-center justify-center overflow-hidden shadow-md">
                        {avatarPreview ? (
                          <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-3xl font-bold text-gray-400">{editData.name?.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
                      <div className="absolute inset-0 bg-black/50 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <IoCameraOutline size={20} className="text-white mb-1" />
                        <span className="text-white text-[10px] font-bold">ĐỔI ẢNH</span>
                      </div>
                    </label>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Họ và Tên</label>
                    <input type="text" value={editData.name} onChange={(e) => setEditData({...editData, name: e.target.value})} required
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent transition-all" />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Email</label>
                    <input type="email" value={editData.email} onChange={(e) => setEditData({...editData, email: e.target.value})} required
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent transition-all" />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Mật khẩu mới</label>
                    <input type="password" value={editData.password} onChange={(e) => setEditData({...editData, password: e.target.value})} 
                      placeholder="Bỏ trống nếu không muốn đổi"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent transition-all placeholder:text-gray-400 text-sm" />
                  </div>

                  <button 
                    type="submit" 
                    disabled={isUpdating}
                    className="w-full py-3.5 bg-black text-white font-bold rounded-xl hover:bg-gray-800 active:scale-[0.98] transition-all shadow-md mt-4 disabled:bg-gray-400"
                  >
                    {isUpdating ? "Đang xử lý..." : "Lưu thay đổi"}
                  </button>
                </form>

              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}

export default ProfilePage;