import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { createNews } from "../../../redux/slices/newsSlice"; // Nhớ check lại đường dẫn nha
import { toast } from "sonner";
import axios from "axios"; // 👇 1. Thêm axios để gọi API upload ảnh

function CreateNewsPage  () {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading } = useSelector((state) => state.news);

  const [formData, setFormData] = useState({
    title: "",
    intro: "",
    content: "",
    imageUrl: "",
  });

  // 👇 2. State quản lý trạng thái đang tải ảnh
  const [uploading, setUploading] = useState(false);

  // Hàm bắt sự kiện khi gõ vào input
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // ==========================================
  // 👇 3. HÀM XỬ LÝ UPLOAD ẢNH TỪ MÁY TÍNH
  // ==========================================
  const uploadFileHandler = async (e) => {
    const file = e.target.files[0];
    const bodyFormData = new FormData();
    bodyFormData.append("image", file);

    setUploading(true);
    try {
      const config = {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${localStorage.getItem("userToken")}`, 
        },
      };

      const { data } = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/upload`, 
        bodyFormData, 
        config
      );

      // Cập nhật link ảnh mới vào formData
      setFormData({
        ...formData,
        imageUrl: data.imageUrl || data.url || data, 
      });
      toast.success("Tải ảnh lên thành công!");
    } catch (error) {
      toast.error(error.response?.data?.message || "Lỗi khi tải ảnh lên");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title || !formData.intro || !formData.content || !formData.imageUrl) {
      toast.error("Vui lòng điền đầy đủ tất cả các trường!");
      return;
    }

    try {
      await dispatch(createNews(formData)).unwrap();
      toast.success("Thêm bài viết thành công!");
      navigate("/admin/news"); 
    } catch (error) {
      toast.error(error || "Có lỗi xảy ra khi thêm bài viết!");
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md mt-6">
      <div className="flex justify-between items-center mb-6 border-b pb-4">
        <h2 className="text-2xl font-bold text-gray-800">Thêm Bài Viết Mới</h2>
        <Link
          to="/admin/news"
          className="text-gray-600 hover:text-gray-900 underline"
        >
          Quay lại danh sách
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 1. Tiêu đề */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tiêu đề bài viết <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Nhập tiêu đề (VD: Tầm nhìn sứ mệnh Atino)"
            className="w-full border border-gray-300 rounded-md p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* 2. Khu vực Nhập / Tải Link Ảnh */}
        <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Hình ảnh bài viết <span className="text-red-500">*</span>
          </label>
          
          <div className="space-y-3">
            {/* Nút Upload File */}
            <div>
              <input
                type="file"
                id="image-upload"
                accept="image/*"
                onChange={uploadFileHandler}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer border border-gray-300 rounded-md bg-white"
              />
              {uploading && <p className="text-sm text-blue-500 mt-1">Đang tải ảnh lên...</p>}
            </div>

            <div className="text-center text-sm text-gray-500 font-medium">HOẶC NHẬP URL</div>

            {/* Input nhập URL truyền thống */}
            <input
              type="text"
              name="imageUrl"
              value={formData.imageUrl}
              onChange={handleChange}
              placeholder="Nhập link ảnh (https://...)"
              className="w-full border border-gray-300 rounded-md p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Hiển thị ảnh Preview CÓ NÚT XOÁ */}
          {formData.imageUrl && (
            <div className="mt-4">
              <p className="text-sm text-gray-500 mb-2">Ảnh xem trước:</p>
              <div className="relative inline-block">
                <img 
                  src={formData.imageUrl} 
                  alt="Preview" 
                  className="h-40 w-auto object-cover rounded shadow-sm border border-gray-300"
                />
                {/* 👇 4. Nút Xoá Ảnh (Icon dấu X) */}
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, imageUrl: "" })}
                  className="absolute -top-3 -right-3 bg-red-100 hover:bg-red-600 text-red-600 hover:text-white border border-red-200 w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-colors"
                  title="Xoá ảnh này"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 3. Đoạn Intro (Tóm tắt) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Đoạn giới thiệu (Intro) <span className="text-red-500">*</span>
          </label>
          <textarea
            name="intro"
            value={formData.intro}
            onChange={handleChange}
            rows="2"
            placeholder="Đoạn tóm tắt ngắn hiển thị ở đầu bài viết..."
            className="w-full border border-gray-300 rounded-md p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          ></textarea>
        </div>

        {/* 4. Nội dung chính */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nội dung chi tiết <span className="text-red-500">*</span>
          </label>
          <textarea
            name="content"
            value={formData.content}
            onChange={handleChange}
            rows="8"
            placeholder="Nhập nội dung bài viết vào đây..."
            className="w-full border border-gray-300 rounded-md p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          ></textarea>
        </div>

        {/* Nút Submit */}
        <div className="flex justify-end pt-4 border-t mt-8">
          <button
            type="button"
            onClick={() => navigate("/admin/news")}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 mr-4 transition"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={loading || uploading}
            className="px-6 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 disabled:bg-gray-400 transition flex items-center shadow-sm"
          >
            {loading || uploading ? "Đang xử lý..." : "Lưu Bài Viết"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateNewsPage;