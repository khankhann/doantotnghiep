import { useEffect, useRef, useState } from "react";
import { FaFilter } from "react-icons/fa";
import FilterSideBar from "@components/Common/FilterSideBar/FilterSideBar";
import SortOption from "@components/Common/SortOption/SortOption";
import ProductsGrid  from '@components/Products/ProductsGrid/ProductsGrid';
import { useParams, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from 'react-redux';
import { fetchProductsbyFilter } from "@redux/slices/productsSlice";
function CollectionPage() {
  const {collection } = useParams()
  const [searchParams] = useSearchParams()
  const dispatch = useDispatch()
  const {products , loading , error} = useSelector((state)=> state.products)
  const queryParams = Object.fromEntries([...searchParams])
  const [isSideBarOpen, setIsSideBarOpen] = useState(false);
  const sideBarRef = useRef(null);

console.log(products)
  
  const toggleSideBar = () => {
    setIsSideBarOpen(!isSideBarOpen);
  };
  const handleClickOutside = (e) => {
    if (sideBarRef.current && !sideBarRef.current.contains(e.target))
      setIsSideBarOpen(false);
  };

  useEffect(()=>{
    dispatch(fetchProductsbyFilter({
      collection, ...queryParams
    }))
  }, [dispatch, collection, searchParams])



  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  return (
    <div className="flex flex-col lg:flex-row">
      {/* mobile filter  */}
      <button
        className="lg:hidden border p-2 flex justify-center  items-center  "
        onClick={toggleSideBar}>
        <FaFilter className="mr-2" />
        Filters
      </button>
{isSideBarOpen && (
        <div 
          className="fixed inset-0  bg-[#0000004d] lg:hidden"
          onClick={() => setIsSideBarOpen(false)} 
        ></div>
      )}
      {/* Filrer sidebar  */}
      <div
        ref={sideBarRef}
        className={`${
          isSideBarOpen ? "translate-x-0" : "-translate-x-full"
        } fixed inset-y-0  
                left-0 w-64 bg-white overflow-y-auto
                 transition-transform duration-500 lg:static lg:translate-x-0 `}>
        <FilterSideBar />
      </div>
      <div className="flex-grow p-4">
        <h2 className="text-2xl uppercase mb-4">All collection</h2>

        {/* sort options  */}
        <SortOption />
        {/* products grid  */}
        <ProductsGrid products = {products} loading = {loading } error = {error} />
      </div>
    </div>
  );
}

export default CollectionPage;
