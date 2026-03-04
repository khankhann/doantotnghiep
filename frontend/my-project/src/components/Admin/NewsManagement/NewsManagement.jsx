import  { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { fetchNews, deleteNews } from "@redux/slices/newsSlice"; // Nhớ trỏ đúng đường dẫn file slice của fen

const NewsManagement = () => {
  const dispatch = useDispatch();
  // Lấy dữ liệu từ store ra xài
  const { newsList, loading, error } = useSelector((state) => state.news);

  // Gọi API lấy danh sách bài viết khi vừa vào trang
  useEffect(() => {
    dispatch(fetchNews());
  }, [dispatch]);

  // Hàm xử lý nút Xóa
  const handleDelete = (id) => {
    if (window.confirm("Fen có chắc chắn muốn xóa bài viết này không?")) {
      dispatch(deleteNews(id));
    }
  };
console.log("News List:", newsList)  
  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* HEADER CỦA BẢNG */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Quản lý Tin Tức</h2>
        <Link
          to="/admin/news/create"
          className="bg-gray-900 text-white px-4 py-2 rounded hover:bg-gray-800 transition"
        >
          + Thêm Bài Viết Mới
        </Link>
      </div>

      {/* HIỂN THỊ LOADING / ERROR */}
      {loading && <p className="text-blue-500 mb-4">Đang tải dữ liệu...</p>}
      {error && <p className="text-red-500 mb-4">Lỗi: {error}</p>}

      {/* BẢNG DANH SÁCH TIN TỨC */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hình ảnh</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tiêu đề</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày tạo </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày chỉnh sửa </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Người tạo </th>

              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Hành động</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {newsList && newsList.length > 0 ? (
              newsList.map((news) => (
                <tr key={news._id} className="hover:bg-gray-50">
             
                  <td className="px-6 py-4 whitespace-nowrap">
                    <img src={news.imageUrl} alt={news.title} className="w-16 h-10 object-cover rounded" />
                  </td>
                  
                  {/* Cột 2: Tiêu đề */}
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900 line-clamp-2">{news.title}</div>
                  </td>
                  
                  {/* Cột 3: ngay tao */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-500">{news?.createdAt ? <p > {new Date(news.createdAt).toLocaleString()} </p> : ""}</span>
                  </td>
                  {/* Cột 4: Ngày chỉnh sửa */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-500">{news?.updatedAt ? <p > {new Date(news.updatedAt).toLocaleString()} </p> : ""}</span>
                  </td>
                    {/* Cột 5: Người tạo */}
                   <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-500">{news?.user?.name ? <p > {news.user.name} </p> : ""}</span>
                  </td>
                  {/* Cột 4: Nút Sửa / Xóa */}
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link
                      to={`/admin/news/${news._id}/edit`}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      Sửa
                    </Link>
                    <button
                      onClick={() => handleDelete(news._id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                  Chưa có bài viết nào. Hãy thêm mới nhé!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default NewsManagement;