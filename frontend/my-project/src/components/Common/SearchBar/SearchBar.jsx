import { useContext, useEffect, useRef, useState } from "react";
import { SideBarContext } from "@context/SideBarContext";
import { HiMagnifyingGlass, HiXMark } from "react-icons/hi2";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import api from "../../../api/axiosClients";

function SearchBar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { setIsOpen, isOpen } = useContext(SideBarContext);
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef(null);

    const handleSearch = (e) => {
    e.preventDefault();
  };

  const closeSearch = () => {
    setIsOpen(false);
    setSearchTerm("");
    setSuggestions([]);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setSuggestions([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const delayCount = setTimeout(async () => {
      try {
         const response = await api.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/products?search=${searchTerm}&limit=50`
        );
        
          const strictNameMatch = response.data.filter(product =>
          product.name.toLowerCase().includes(searchTerm.toLowerCase())
        );

        setSuggestions(strictNameMatch);
      } catch (err) {
        console.error("Lỗi tìm kiếm: ", err);
      } finally {
        setIsSearching(false);
      }
    }, 400); 

    return () => clearTimeout(delayCount);
  }, [searchTerm]);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        if (inputRef.current) inputRef.current.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  return (
    <div className="relative font-sans">
    {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="text-gray-700 hover:text-black transition-colors flex items-center"
        >
          <HiMagnifyingGlass className="h-6 w-6" />
        </button>
      )}

       <div
        className={`fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          isOpen ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
        onClick={closeSearch}
      />

       <div
        className={`fixed top-0 left-0 w-full bg-white shadow-md z-50 transition-transform duration-300 ease-out ${
          isOpen ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <div className="max-w-4xl mx-auto px-4 py-4 sm:py-5 relative">
          
          <form onSubmit={handleSearch} className="flex items-center gap-3">
            <HiMagnifyingGlass className="h-6 w-6 text-gray-400 shrink-0" />
            
            <input
              type="text"
              ref={inputRef}
              placeholder="Nhập chính xác tên sản phẩm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-transparent text-base sm:text-lg text-gray-800 placeholder-gray-400 focus:outline-none py-2"
            />

            <div className="flex items-center gap-3 shrink-0">
              {isSearching && (
                <div className="w-5 h-5 border-2 border-gray-200 border-t-gray-800 rounded-full animate-spin"></div>
              )}
              
              {searchTerm && !isSearching && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="text-gray-400 hover:text-gray-800 p-1"
                >
                  <HiXMark className="h-6 w-6" />
                </button>
              )}
              
              <div className="w-px h-6 bg-gray-200 mx-1 hidden sm:block"></div>

              <button
                type="button"
                onClick={closeSearch}
                className="hidden sm:block text-gray-500 hover:text-red-500 text-sm font-semibold uppercase tracking-wide transition-colors"
              >
                Đóng
              </button>
            </div>
          </form>

            {suggestions.length > 0 && (
            <div className="mt-4 border-t border-gray-100 pt-4 pb-2 animate-fade-in">
              <div className="flex justify-between items-center mb-3">
                 <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                   Tìm thấy {suggestions.length} sản phẩm
                 </span>
              </div>
              
               <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
                {suggestions.map((product) => (
                  <li
                    key={product._id}
                    onClick={() => {
                      navigate(`/product/${product._id}`);
                      closeSearch();
                    }}
                    className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-gray-100"
                  >
                    <div className="w-12 h-14 sm:w-14 sm:h-16 shrink-0 bg-gray-100 rounded overflow-hidden">
                      <img
                        src={product.images[0]?.url}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {product.name}
                      </p>
                      <p className="text-xs font-semibold text-gray-500 mt-0.5">
                        {formatPrice(product.price)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Trạng thái không tìm thấy */}
          {searchTerm && !isSearching && suggestions.length === 0 && (
            <div className="mt-4 border-t border-gray-100 pt-6 pb-4 text-center animate-fade-in">
              <p className="text-gray-500 text-sm">
                Không tìm thấy sản phẩm nào có tên khớp với "<span className="font-semibold text-gray-800">{searchTerm}</span>"
              </p>
            </div>
          )}
          
        </div>
      </div>
    </div>
  );
}

export default SearchBar;