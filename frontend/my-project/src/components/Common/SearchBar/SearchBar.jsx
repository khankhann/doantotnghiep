import { useContext, useEffect, useState } from "react";
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
  return (
    <div
      className={`flex items-center justify-center w-full transition-all duration-500 ${
        isOpen ? "absolute top-0 left-0 w-full bg-white h-24 z-50" : "w-auto"
      } `}>
      {isOpen ? (
        <form
          onSubmit={handleSearch}
          className="relative flex items-center justify-center w-full ">
          <div className="relative w-1/2 ">
            <input
              type="text"
              placeholder="Nhap tim kiem "
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-gray-200 px-4 py-2 pl-2 pr-12 rounded-lg focus:outline-none w-full placeholder:text-gray-700 "
            />
            {/* {search icon } */}
            <button
              type="submit"
              className="absolute right-2  top-1/2 transform -translate-y-1/2
            text-gray-600 hover:text-gray-800">
              <HiMagnifyingGlass className=" h-6 w-6 " />
            </button>
            {/* list suggest  */}
            {suggestions.length > 0 && (
              <ul className="absolute top-full left-0 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-2 max-h-60 overflow-y-auto z-50 ">
                {suggestions.map((product) => {
                  return (
                    <li
                      key={product._id}
                      onClick={() => {
                        navigate(`/product/${product._id}`);
                        setIsOpen(false);
                        setSearchTerm("");
                        setSuggestions([]);
                      }}
                      className="flex items-center p-2 hover:bg-gray-300 cursor-pointer transition ">
                      {/* anh san pham  */}
                      <img
                        src={product.images[0]?.url}
                        alt={product.name}
                        className="w-10 h-10 object-cover rounded mr-3   "
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-800 ">
                          {product.name}{" "}
                        </p>
                        <p className="text-xs text-gray-500 ">
                          {" "}
                          {product.price}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          <button
            type="button"
            className=" absolute right-8 top-1/2 transform -translate-y-1/2
           text-gray-600 hover:text-gray-800 "
            onClick={() => handleSearchToggle()}>
            <IoCloseOutline
              className=" w-8 h-8 cursor-pointer
             transition-all duration-300 ease-in-out hover:rotate-180 "
            />
          </button>
        </form>
      ) : (
        <button onClick={() => handleSearchToggle()}>
          <HiMagnifyingGlass className="h-6 w-6  " />
        </button>
      )}
    </div>
  );
}

export default SearchBar;
