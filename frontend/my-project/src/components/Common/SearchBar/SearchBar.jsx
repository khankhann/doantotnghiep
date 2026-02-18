import { useContext, useEffect, useRef, useState } from "react";
import { SideBarContext } from "@context/SideBarContext";
import { HiMagnifyingGlass } from "react-icons/hi2";
import { IoCloseOutline } from "react-icons/io5";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { fetchProductsbyFilter } from "@redux/slices/productsSlice";
import api from "../../../api/axiosClients";

function SearchBar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { setIsOpen, isOpen } = useContext(SideBarContext);
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState([]);
const inputRef = useRef(null)
  const handleSearchToggle = () => {
    setIsOpen(!isOpen);
  };
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim() === "") return;
    navigate(`/collections/all?search=${searchTerm}`);
    setIsOpen(false);
    setSearchTerm("");
  };
  useEffect(()=> {
    if(searchTerm.trim() === ""){
      return setSuggestions([])
    }
    const delayCount = setTimeout(
      async()=>{
        try {
          const response = await api.get(`${import.meta.env.VITE_BACKEND_URL}/api/products?search=${searchTerm}&limit=5`)
          setSuggestions(response.data)


        }catch(err){
          console.error("loi tim kiem ", err)
        }
      }, 1000)
    return () => clearTimeout(delayCount)
  },[searchTerm])

  useEffect(()=> {
    if(isOpen){
      const timer = setTimeout(()=>{
        inputRef.current.focus()
      },500)
      return ()=> clearTimeout(timer)
    }
  }, [isOpen])


  return (
   <div className="relative">
      {/* Icon kính lúp để mở Search Bar */}
      {!isOpen && (
        <button onClick={() => setIsOpen(true)}>
          <HiMagnifyingGlass className="h-6 w-6" />
        </button>
      )}

      {/* Overlay mờ phía sau khi mở search (Tùy chọn giúp tập trung vào search bar) */}
      <div 
        className={`fixed inset-0 bg-black/30 z-40 transition-opacity duration-500 ${isOpen ? "opacity-100 visible" : "opacity-0 invisible"}`}
        onClick={() => setIsOpen(false)}
      />

      {/* Thanh Search Bar trượt từ trên xuống */}
      <div
        className={`fixed top-0 left-0 w-full bg-white shadow-xl z-50 transition-all duration-500 ease-in-out transform ${
          isOpen ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
        } h-32 flex items-center justify-center`}
      >
        <form
          onSubmit={handleSearch}
          className="relative flex items-center justify-center w-full max-w-2xl px-4 gap-12"
        >
          <div className="relative w-full">
            <input
              type="text"
              ref={inputRef}
              placeholder="Nhập tên sản phẩm cần tìm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-gray-100 px-6 py-3 pr-12 rounded-full focus:outline-none w-full border-2 focus:border-gray-400 transition-all "
            />

              {searchTerm && (
                <button
                onClick={()=> setSearchTerm("")}
                className=" absolute right-10 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors "
                >
                  <IoCloseOutline className=" w-5 h-5 "/> 
                </button>
              )}


            <button type="submit" className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600">
              <HiMagnifyingGlass className="h-6 w-6" />
            </button>

            {/* List gợi ý sản phẩm */}
            {suggestions.length > 0 && (
              <ul className="absolute top-full left-0 w-full bg-white border border-gray-200 rounded-xl shadow-2xl mt-3 max-h-80 overflow-y-auto animate-in fade-in slide-in-from-top-2">
                {suggestions.map((product) => (
                  <li
                    key={product._id}
                    onClick={() => {
                      navigate(`/product/${product._id}`);
                      setIsOpen(false);
                      setSearchTerm("");
                      setSuggestions([]);
                    }}
                    className="flex items-center p-3 hover:bg-gray-50 cursor-pointer border-b last:border-none"
                  >
                    <img src={product.images[0]?.url} alt="" className="w-12 h-12 object-cover rounded-md mr-4" />
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{product.name}</p>
                      <p className="text-xs text-red-500">{product.price.toLocaleString()}đ</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Nút đóng */}
          <button
            type="button"
            className="ml-4 text-gray-500 hover:text-black transition-transform hover:rotate-90 duration-300 "
            onClick={() => setIsOpen(false)}
          >
            <IoCloseOutline className="w-10 h-10  " />
          </button>
        </form>
      </div>
    </div>
  );
}

export default SearchBar;
