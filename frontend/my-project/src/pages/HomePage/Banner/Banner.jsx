import { Link } from "react-router-dom";
import { motion } from "framer-motion"; 
import BannerImg from "/src/assets/image/background/cfl-nu-pc-png-2prq.webp";
// 🔥 Đã có PhoneImg ở đây rồi nhé
import PhoneImg from "/src/assets/image/background/premium_photo-1679619558250-41fa96ef187c.avif";

function Banner() {
    return (
        // Chiều cao linh hoạt: Mobile cao 60vh cho đẹp, Laptop 85vh
        <section className="relative w-full h-[60vh] md:h-[85vh] overflow-hidden"> 
            
            {/* 🔥 SỬ DỤNG THẺ PICTURE ĐỂ TỰ ĐỘNG ĐỔI ẢNH THEO MÀN HÌNH */}
            <picture>
                {/* Nếu màn hình từ 768px trở lên (Desktop), dùng BannerImg */}
                <source media="(min-width: 768px)" srcSet={BannerImg} />
                
                {/* Mặc định (Mobile), dùng PhoneImg */}
                <img 
                    src={PhoneImg}
                    alt="Banner Routine Style"
                    className="w-full h-full object-cover object-center"  
                />
            </picture>
            
            {/* Lớp phủ nội dung (Giữ nguyên logic cũ của fen) */}
            <div className="absolute inset-0 bg-black/5 flex items-center justify-center">
                <div className="text-center p-4">
                   <motion.h1 
    initial={{ y: 30, opacity: 0 }}
    whileInView={{ y: 0, opacity: 1 }}
    transition={{ duration: 0.8, ease: "easeOut" }}
    // 🔥 SỬA: text-black (mặc định cho mobile) và md:text-white/40 (cho máy tính)
    className="text-5xl md:text-[8rem] font-black tracking-tighter uppercase leading-[0.9] text-white md:text-white/40 mb-2"
>
    Vacation <br/> Ready 
</motion.h1>

                    <motion.p 
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        transition={{ delay: 0.5, duration: 1 }}
                        className="text-[10px] md:text-sm font-black tracking-[0.2em] uppercase mt-2 mb-6 text-black"
                    >
                        Explore our vacation-ready outfits with fast worldwide shipping.
                    </motion.p>

                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <Link 
                            to="/collections/all" 
                            className="inline-block border border-gray-900 bg-gray-900 text-white px-8 md:px-10 py-2.5 md:py-3 text-xs md:text-sm font-bold uppercase hover:bg-transparent hover:text-gray-900 transition-all duration-300 shadow-lg"
                        >
                            Shop now
                        </Link>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}

export default Banner;