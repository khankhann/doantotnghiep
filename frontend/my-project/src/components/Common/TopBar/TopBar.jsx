import { TbBrandMeta } from "react-icons/tb";
import { FaInstagram } from "react-icons/fa";
import { FiYoutube } from "react-icons/fi";

function TopBar() {
  return (
    <div className="bg-[#ea2e0e] text-white">
    
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-marquee {
          display: inline-block;
          white-space: nowrap;
         padding-left : 50%;
          animation: marquee 20s linear infinite; 
        }
        /* Dừng lại khi hơ chuột  */
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>

      <div className="container mx-auto flex justify-between items-center py-3 px-4 ">
        {/* Mạng xã hội */}
        <div className="hidden md:flex items-center space-x-4 min-w-max">
          <a href="#" className="hover:text-gray-300 transition-all duration-500 ease-in-out">
            <TbBrandMeta className="h-5 w-5" />
          </a>
          <a href="#" className="hover:text-gray-300 transition-all duration-500 ease-in-out">
            <FaInstagram className="h-5 w-5" />
          </a>
          <a href="#" className="hover:text-gray-300 transition-all duration-500 ease-in-out">
            <FiYoutube className="h-5 w-5" />
          </a>
        </div>

        {/* 👇 2. KHU VỰC CHỮ CHẠY (Băng rôn) */}
        {/* Thêm overflow-hidden để chữ bị cắt khi chạy tới viền, mx-4 để cách 2 bên ra xíu */}
        <div className="text-sm flex-grow overflow-hidden mx-4 relative flex">
          <span className="animate-marquee font-medium tracking-wide">
             We ship worldwide - Fast and reliable shipping 
          </span>
        </div>

        {/* Số điện thoại */}
        <div className="text-sm hidden md:block min-w-max">
          <a href="tel: + 1234567890" className="hover:text-gray-300 transition duration-300 ease-in-out font-medium">
           +1 (234) 456 789
          </a>
        </div>
      </div>
    </div>
  );
}

export default TopBar;