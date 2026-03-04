import { Link } from "react-router-dom";
import { motion } from "framer-motion"; // Thêm thư viện này để làm animation
import BannerImg from "/src/assets/image/background/cfl-nu-pc-png-2prq.webp";

function Banner() {
    return (
        <section className="relative w-full h-[85vh] overflow-hidden"> 
            {/* 1. Hình ảnh nền: Routine thường dùng ảnh có bối cảnh rộng */}
            <img 
                src={BannerImg}
                alt="Banner Routine Style"
                className="w-full h-full object-cover object-center"  
            />
            
            {/* 2. Lớp Overlay: Giảm độ đen lại (bg-black/5) để ảnh trông trong trẻo hơn */}
            <div className="absolute inset-0 bg-black/5 flex items-center justify-center">
                <div className="text-center p-6">
                    {/* 3. Heading: Chuyển sang font-black (900) và dùng màu hồng đặc trưng */}
                    <motion.h1 
                        initial={{ y: 30, opacity: 0 }}
                        whileInView={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="text-2xl md:text-[8rem] font-black tracking-tighter uppercase leading-[0.9] text-white/40"
                    >
                        Vacation <br/> Ready 
                    </motion.h1>

                    {/* 4. Description: Chuyển sang màu trắng hoặc xám nhẹ để không bị chìm */}
                    <motion.p 
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        transition={{ delay: 0.5, duration: 1 }}
                        className="text-xs md:text-sm font-black tracking-[0.2em] uppercase mt-4 mb-8 text-black"
                    >
                        Explore our vacation-ready outfits with fast worldwide shipping.
                    </motion.p>

                    {/* 5. Nút bấm: Làm tối giản, bo góc nhỏ (rounded-none hoặc rounded-sm) */}
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <Link 
                            to="/collections/all" 
                            className="inline-block border border-gray-900 bg-gray-900 text-white px-10 py-3 text-sm font-bold uppercase hover:bg-transparent hover:text-gray-900 transition-all duration-300"
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