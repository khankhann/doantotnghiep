import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from 'react-redux';
import { fetchNews } from "@redux/slices/newsSlice";
function NewsPage() {
  const dispatch = useDispatch()
  const {newsList, loading , error}= useSelector((state)=> state.news)

  useEffect(()=>{
    dispatch(fetchNews())
  },[dispatch])

if(loading ) return <p className="text-center text-red-400"> Loading ...</p>
if(error ) return <p className="text-center text-red-400"> Error : {error}</p>

    return ( 
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 bg-white font-sans">
      
      {/* --- PHẦN HEADER & BREADCRUMB --- */}
      <div className="mb-12">
        <h1 className="text-4xl font-medium text-gray-900 mb-6 font-serif">Tin Tức</h1>
        {/* Thanh Breadcrumb màu xám nhạt */}
        <div className="flex items-center text-sm text-gray-500 bg-gray-50 py-3 px-4 border-l-4 border-gray-200">
          <Link to="/" className="hover:text-black transition-colors italic">
            Trang chủ
          </Link>
          <span className="mx-2">|</span>
          <span className="text-gray-900 italic">Tin Tức</span>
        </div>
      </div>

      {/* --- PHẦN GRID DANH SÁCH BÀI VIẾT --- */}
      {/* Responsive: Mobile 1 cột, Tablet 2 cột, Desktop 3 cột */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
        {newsList.length > 0 && newsList.map((item) => (
          <div key={item._id} className="group flex flex-col h-full">
            
            {/* Vùng chứa ảnh: Cắt ảnh tỉ lệ 3/2, hiệu ứng zoom nhẹ khi hover */}
            <Link 
              to={`/news/${item.slug}`} 
              className="overflow-hidden mb-5 block relative aspect-[3/2] bg-gray-100"
            >
              <img
                src={item.imageUrl}
                alt={item.title}
                className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 ease-in-out"
              />
            </Link>

            {/* Vùng nội dung chữ */}
            <div className="flex flex-col flex-grow">
              <Link to={`/news/${item.slug}`}>
                <h3 className="text-[15px] font-semibold text-gray-800 mb-2 uppercase group-hover:text-red-600 transition-colors tracking-wide">
                  {item.title}
                </h3>
              </Link>
              
              <p className="text-gray-600 mb-4 text-sm flex-grow">
                {item.content}
              </p>
              
              {/* Nút Xem thêm */}
              <Link
                to={`/news/${item.slug}`}
                className="text-red-600 italic text-sm hover:text-red-800 transition-colors mt-auto inline-block"
              >
                Xem thêm
              </Link>
            </div>

          </div>
        ))}
      </div>

    </div>
  )
     
};

export default NewsPage;