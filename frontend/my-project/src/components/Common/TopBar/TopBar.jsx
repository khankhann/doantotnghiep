import { TbBrandMeta } from "react-icons/tb";
import { FaInstagram } from "react-icons/fa";
import { FiYoutube } from "react-icons/fi";
function TopBar() {
  return (
    <div className="bg-[#ea2e0e] text-white">
      <div className="container mx-auto flex justify-between items-center py-3 px-4 ">
        <div className="hidden md:flex items-center space-x-4 ">
          <a href="#" className="hover:text-gray-300 transition-all duration-500 ease-in-out">
            <TbBrandMeta className="h-5 w-5" />
          </a>
          <a href="#" className="hover:text-gray-300 transition-all duration-500 ease-in-out">
            <FaInstagram className="h-5 w-5" />
          </a>{" "}
          <a href="#" className="hover:text-gray-300 transition-all duration-500 ease-in-out">
            <FiYoutube className="h-5 w-5" />
          </a>
        </div>
        <div className="text-sm text-center flex-grow ">
          <span> We ship worldwide - Fast and reliable shipping</span>
        </div>
        <div className="text-sm hidden md:block">
          <a href="tel: + 1234567890" className="hover:text-gray-500 transition duration-300 ease-in-out ">
           +1 (234) 456 789
          </a>
        </div>
      </div>
    </div>
  );
}

export default TopBar;
