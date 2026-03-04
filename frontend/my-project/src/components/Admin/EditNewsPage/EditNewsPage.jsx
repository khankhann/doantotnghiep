import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams, Link } from "react-router-dom";
import { updateNews } from "@redux/slices/newsSlice"; 
import { toast } from "sonner";
import axios from "axios"; // Nhớ import axios để gọi API upload ảnh

const EditNewsPage = () => {
  const { id } = useParams(); 
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const { newsList, loading } = useSelector((state) => state.news);

  const [formData, setFormData] = useState({
    title: "",
    intro: "",
    content: "",
    imageUrl: "",
  });

  // State mới để quản lý lúc đang tải ảnh lên
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const existingNews = newsList.find((news) => news._id === id);
    
    if (existingNews) {
      setFormData({
        title: existingNews.title,
        intro: existingNews.intro,
        content: existingNews.content,
        imageUrl: existingNews.imageUrl,
      });
    } else {
      toast.error("Không tìm thấy dữ liệu bài viết!");
      navigate("/admin/news");
    }
  }, [id, newsList, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // ==========================================
  // HÀM XỬ LÝ UPLOAD ẢNH TỪ MÁY TÍNH
  // ==========================================
  const uploadFileHandler = async (e) => {
    const file = e.target.files[0];
    const bodyFormData = new FormData();
    bodyFormData.append("image", file); // Tên field "image" tuỳ thuộc vào backend quy định

    setUploading(true);
    try {
      const config = {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${localStorage.getItem("userToken")}`, // Nhớ truyền token nếu backend yêu cầu
        },
      };

      // Gọi API upload của fen (nhớ đổi URL cho đúng với backend)
      const { data } = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/upload`, 
        bodyFormData, 
        config
      );

      // Cập nhật link ảnh mới vào formData
      setFormData({
        ...formData,
        imageUrl: data.imageUrl || data.url || data, // Tuỳ cấu trúc data backend trả về
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
      await dispatch(updateNews({ id, newsData: formData })).unwrap();
      toast.success("Cập nhật bài viết thành công!");
      navigate("/admin/news");
    } catch (error) {
      toast.error(error || "Có lỗi xảy ra khi cập nhật!");
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md mt-6">
      <div className="flex justify-between items-center mb-6 border-b pb-4">
        <h2 className="text-2xl font-bold text-gray-800">Chỉnh Sửa Bài Viết</h2>
        <Link
          to="/admin/news"
          className="text-gray-600 hover:text-gray-900 underline"
        >
          Quay lại danh sách
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tiêu đề bài viết <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Khu vực Nhập / Tải Link Ảnh */}
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
              placeholder="https://vidu.com/anh.jpg"
              className="w-full border border-gray-300 rounded-md p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Hiển thị ảnh Preview */}
         {formData.imageUrl && (
            <div className="mt-4">
              <p className="text-sm text-gray-500 mb-2">Ảnh xem trước:</p>
              <div className="relative inline-block">
                {/* Hình ảnh */}
                <img 
                  src={formData.imageUrl} 
                  alt="Preview" 
                  className="h-40 w-auto object-cover rounded shadow-sm border border-gray-300"
                />
                
                {/* Nút X dấu chéo góc trên bên phải ảnh */}
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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Đoạn giới thiệu (Intro) <span className="text-red-500">*</span>
          </label>
          <textarea
            name="intro"
            value={formData.intro}
            onChange={handleChange}
            rows="2"
            className="w-full border border-gray-300 rounded-md p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          ></textarea>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nội dung chi tiết <span className="text-red-500">*</span>
          </label>
          <textarea
            name="content"
            value={formData.content}
            onChange={handleChange}
            rows="8"
            className="w-full border border-gray-300 rounded-md p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          ></textarea>
        </div>

        <div className="flex justify-end pt-4 border-t">
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
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition flex items-center"
          >
            {loading ? "Đang lưu..." : "Lưu Thay Đổi"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditNewsPage;