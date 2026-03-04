import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, Link } from "react-router-dom";
import { fetchNewsBySlug } from "@redux/slices/newsSlice";
import { fetchNews } from "@redux/slices/newsSlice";




const NewsDetailPage = () => {
  const { slug } = useParams();
  const dispatch = useDispatch()
  const {newsDetail, newsList , loading , error } = useSelector((state)=> state.news)
 
useEffect(()=>{
  if(slug){

    window.scrollTo(0, 0);
    dispatch(fetchNewsBySlug(slug))
  }
  if(newsList.length === 0 ){
    dispatch(fetchNews())
  }

}, [dispatch, slug ])

  

  if (!newsDetail) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-gray-800">404 - Không tìm thấy bài viết!</h2>
        <Link to="/news" className="text-blue-600 hover:underline mt-4 inline-block">Quay lại danh sách Tin tức</Link>
      </div>
    );
  }

  // LOGIC LỌC BÀI VIẾT LIÊN QUAN: Lấy các bài khác slug hiện tại, cắt lấy 3 bài đầu
  const relatedArticles = newsList
    .filter((item) => item.slug !== slug)
    .slice(0, 5);

    console.log(newsDetail , newsList)
    if(loading ) return <p className="text-center text-red-400"> Loading ... </p>
    if(error ) return <p className="text-center text-red-400"> Error : {error} </p> 

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 font-sans text-gray-800">
      
      {/* --- PHẦN BÀI VIẾT CHÍNH --- */}
      <div className="flex items-center text-sm text-gray-500 bg-gray-50 py-3 px-4 border-l-4 border-gray-200 mb-8">
        <Link to="/" className="hover:text-black transition-colors italic">Trang chủ</Link>
        <span className="mx-2">»</span>
        <Link to="/news" className="hover:text-black transition-colors italic">Tin Tức</Link>
        <span className="mx-2">»</span>
        <span className="text-gray-900 italic uppercase">{newsDetail.title}</span>
      </div>

      <h1 className="text-3xl sm:text-4xl font-semibold text-red-600 mb-4 uppercase tracking-wide border-b pb-4">
        {newsDetail.title}
      </h1>

      <div className="flex items-center text-gray-500 text-sm italic mb-6">
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
        Đăng ngày  {newsDetail?.createdAt ? <p>  {new Date(newsDetail.createdAt).toLocaleDateString()} </p> :""}
      </div>

      <div className="leading-relaxed space-y-4">
        <p className="font-bold italic text-[16px]">{newsDetail.intro}</p>
        <p className="text-[15px] text-gray-700">{newsDetail.content}</p>
      </div>

      <div className="mt-8 mb-16">
        <img src={newsDetail.imageUrl} alt={newsDetail.title} className="w-full h-auto object-cover rounded-sm shadow-sm" />
      </div>

      {/* --- PHẦN BÀI VIẾT LIÊN QUAN --- */}
      <div className="border-t border-gray-200 pt-10">
        <h3 className="text-xl font-medium text-gray-900 mb-8 uppercase tracking-wide">
          Bài viết liên quan
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
          {relatedArticles.map((item) => (
            <div key={item.id} className="group flex flex-col h-full">
              
              <Link to={`/news/${item.slug}`} className="overflow-hidden mb-4 block relative aspect-[3/2] bg-gray-100">
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 ease-in-out"
                />
              </Link>

              <div className="flex flex-col flex-grow">
                <Link to={`/news/${item.slug}`}>
                  <h4 className="text-[14px] font-medium text-gray-800 mb-2 group-hover:text-red-600 transition-colors">
                    {item.title}
                  </h4>
                </Link>
                <p className="text-gray-500 text-[13px] line-clamp-2">
                  {item.intro}
                </p>
              </div>

            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default NewsDetailPage;