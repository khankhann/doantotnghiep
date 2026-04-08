import { useState } from 'react'; // 🔥 Thêm useState
import { useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import ImageVisualizer from '../ImageVisualizer/ImageVisualizer';

function VisualSearchResults() {
    const navigate = useNavigate();
    
    //  STATE ĐỂ LƯU BỘ LỌC GIỚI TÍNH ('All', 'Men', 'Women')
    const [genderFilter, setGenderFilter] = useState('All');

    const { results, isDetected, isLoading, error, uploadedImage } = useSelector((state) => state.visualSearch);

    if (!isLoading && !isDetected && (!results || results.length === 0)) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
                <p className="text-xl text-gray-600 mb-4">{error || "Không có dữ liệu tìm kiếm."}</p>
                <button onClick={() => navigate('/')} className="bg-black text-white px-6 py-2 rounded-full hover:bg-gray-800 transition shadow-lg">
                    Quay về trang chủ
                </button>
            </div>
        );
    }

    //  LOGIC LỌC SẢN PHẨM TRƯỚC KHI RENDER
    const displayResults = results ? results.map(group => {
        const filteredProducts = group.products.filter(product => {
            if (genderFilter === 'All') return true; // Lấy hết
            // Kiểm tra thuộc tính gender của product (Chữ 'Men' hoặc 'Women')
            // Nếu Database của fen dùng chữ khác (ví dụ 'Nam', 'Nữ') thì nhớ đổi lại nhé!
            return product.gender === genderFilter; 
        });
        
        // Trả về group với danh sách sản phẩm đã được lọc
        return { ...group, products: filteredProducts };
    }) : [];

    return (
        <div className="container mx-auto px-4 py-12 min-h-screen">
            {/* TIÊU ĐỀ & ẢNH GỐC */}
           <div className="text-center mb-10">
                <h1 className="text-4xl font-extrabold mb-8 text-gray-900 tracking-tight">Kết quả phân tích AI</h1>
                
                {uploadedImage && (
                    <div className="flex justify-center mb-10">
                        <div className="relative inline-block group w-full max-w-md"> 
                            <div className="absolute -inset-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-2xl blur-lg opacity-40 group-hover:opacity-70 transition duration-500"></div>
                            
                            <div className="relative z-10 rounded-2xl overflow-hidden border-4 border-white shadow-2xl bg-gray-500">
                                <ImageVisualizer 
                                    imageUrl={uploadedImage} 
                                    aiResults={isLoading ? [] : results} 
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* 🔥 BỘ LỌC NAM / NỮ MỚI THÊM */}
                {!isLoading && isDetected && (
                    <div className="flex justify-center gap-4 mt-8">
                        <button 
                            onClick={() => setGenderFilter('All')}
                            className={`px-6 py-2 rounded-full font-semibold transition-all ${genderFilter === 'All' ? 'bg-black text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                        >
                            Tất cả
                        </button>
                        <button 
                            onClick={() => setGenderFilter('Men')}
                            className={`px-6 py-2 rounded-full font-semibold transition-all ${genderFilter === 'Men' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                        >
                            Cho Nam
                        </button>
                        <button 
                            onClick={() => setGenderFilter('Women')}
                            className={`px-6 py-2 rounded-full font-semibold transition-all ${genderFilter === 'Women' ? 'bg-pink-500 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                        >
                            Cho Nữ
                        </button>
                    </div>
                )}
            </div>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <div className="w-16 h-16 border-4 border-gray-200 border-t-black rounded-full animate-spin mb-6"></div>
                    <p className="text-xl font-medium text-gray-600 animate-pulse">🤖 AI đang bóc tách từng món đồ trên ảnh...</p>
                </div>
            ) : (
                <div className="space-y-16">
                    {/* 🔥 DUYỆT QUA displayResults (Mảng đã được lọc) THAY VÌ results GỐC */}
                    {displayResults.map((group, index) => (
                        <div key={index} className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                            
                            <div className="flex flex-col md:flex-row items-center justify-between border-b border-gray-100 pb-6 mb-8">
                                <div className="flex items-center gap-4">
                                    <span className="text-3xl">🎯</span>
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-800">
                                            AI nhận diện: <span className="text-blue-600">{group.ai_data.class_name}</span>
                                        </h2>
                                        <p className="text-sm text-gray-500 mt-1 font-medium">
                                            Độ chính xác: <span className="text-green-600 bg-green-50 px-2 py-1 rounded-md">{(group.ai_data.confidence * 100).toFixed(1)}%</span>
                                        </p>
                                    </div>
                                </div>
                                <span className="text-sm text-gray-400 mt-4 md:mt-0 italic">
                                    Tìm thấy {group.products.length} sản phẩm tương tự
                                </span>
                            </div>

                            {group.products.length > 0 ? (
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                    {group.products.map((product) => (
                                        <div key={product._id} className="group relative bg-white rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 border border-gray-50">
                                            <Link to={`/product/${product._id}`}>
                                                <div className="relative overflow-hidden aspect-[3/4]">
                                                    {/* Nhãn giới tính nhỏ ở góc (Tùy chọn) */}
                                                    <div className="absolute top-2 right-2 z-10 bg-white/90 px-2 py-1 text-[10px] font-bold uppercase rounded-md shadow-sm">
                                                        {product.gender}
                                                    </div>
                                                    <img 
                                                        src={product.image || (product.images && product.images[0]?.url)} 
                                                        alt={product.name} 
                                                        className="w-full h-full object-cover object-top transition duration-700 group-hover:scale-110"
                                                    />
                                                </div>
                                                <div className="p-5">
                                                    <h3 className="text-md font-semibold text-gray-800 truncate mb-2 group-hover:text-blue-600 transition-colors">
                                                        {product.name}
                                                    </h3>
                                                    <p className="text-red-500 font-bold text-lg">
                                                        {product.price ? product.price.toLocaleString('vi-VN') : '0'} đ
                                                    </p>
                                                </div>
                                            </Link>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-10 bg-gray-50 rounded-2xl">
                                    <p className="text-gray-500">
                                        Không tìm thấy mẫu <b>{group.ai_data.class_name}</b> nào phù hợp với bộ lọc hiện tại 😢
                                    </p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default VisualSearchResults;