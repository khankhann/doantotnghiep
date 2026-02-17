import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
function FilterSideBar() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate()
  const [filters, setFilters] = useState({
    category: "",
    gender: "",
    color: "",
    size: [],
    material: [],
    brand: [],
    minPrice: 0,
    maxPrice: 100,
  });
  const [priceRange, setPriceRange] = useState([0, 100]);
  const categories = ["Top Wear", "Bottom Wear"];
  const colors = [
    "Red",
    "Blue",
    "Black",
    "Green",
    "Yellow",
    "Gray",
    "White",
    "Pink",
    "Beige",
    "Navy",
  ];
  const sizes = ["XS", "S", "M", "L", "XL", "XXL"];
  const materials = [
    "Cotton",
    "Wool",
    "Denim",
    "Polyester",
    "Silk",
    "Linen",
    "Viscose",
    "Fleece",
  ];
  const brands = [
    "Urban Threads",
    "Modern Fit",
    "Street Style",
    "Beach Breeze",
    "Fashionista",
    "ChicStyle",
  ];
  const genders = ["Men", "Women"];
  useEffect(() => {
    const params = Object.fromEntries([...searchParams]);
    setFilters({
      category: params.category || "",
      gender: params.gender || "",
      color: params.color || "",
      size: params.size ? params.size.split(",") : [],
      material: params.material ? params.material.split(",") : [],
      brand: params.brand ? params.brand.split(",") : [],
      minPrice: params.minPrice || 0,
      maxPrice: params.maxPrice || 100,
    });
    setPriceRange([0, params.maxPrice || 100]);
  }, [searchParams]);

  const handleFilterChange = (e) => {
    const { name, value, checked, type } = e.target;
    let newFilters = {...filters}
    if(type === "checkbox"){
        if(checked){
            newFilters[name] = [...(newFilters[name] || []), value]  // ["XS", "S"]
        }else{
            newFilters[name] = newFilters[name].filter((item)=> {
                return item !== value
            })
        }
    }else{
        newFilters[name] = value
    }
    setFilters(newFilters)
    updateURLParams(newFilters)
    // navigate(`?${.toString()}`) // ?category=Bottom+Wear&size=XS%2CS
  };

const handleClear = ()=>{
  setFilters({
       category: "",
    gender: "",
    color: "",
    size: [],
    material: [],
    brand: [],
    minPrice: 0,
    maxPrice: 100,
  })
  setPriceRange([0, 100])
  setSearchParams({});
}

const isFilterActive = filters.category !== "" || filters.gender !== "" || filters.size.length > 0 || filters.material.length > 0 || filters.brand.length > 0 || filters.minPrice > 0 || filters.maxPrice < 100  

const updateURLParams = (newFilters)=>{
    const params = new URLSearchParams()
    //{category: "Top Wear", size : ["XS, S"]}
    Object.keys(newFilters).forEach((key)=> {
        if(Array.isArray(newFilters[key]) && newFilters[key].length > 0){
            params.append(key, newFilters[key].join(",")) // "SX, S"
        }else if (newFilters[key]) {
            params.append(key, newFilters[key])
        }
    })
    setSearchParams(params)
}
const handlePriceChange = (e)=>{
    const newPrice = e.target.value 
    setPriceRange([0 , newPrice])
    const newFilters = {...filters, minPrice: 0, maxPrice : newPrice}
    setFilters(newFilters)
    updateURLParams(newFilters)
}





  return (
    <div className="p-4">
      <h3 className="text-xl font-medium text-gray-800 mb-4 ">Filter</h3>

      {/* Category Filter  */}
      <div className="mb-6">
        <label className="block text-gray-600 font-medium mb-2 ">
          Category
        </label>
        {categories.map((category) => {
          return (
            <div key={category} className=" flex items-center mb-1 ">
              <input
                type="radio"
                name="category"
                value={category}
                checked= {filters.category === category}
                onChange={handleFilterChange}
                className="mr-2 h-4 w-4 text-blue-500 focus:ring-blue-400 border-gray-300"
              />
              <span className="text-gray-700">{category} </span>
            </div>
          );
        })}
      </div>
      {/* Gender filter  */}

      <div className="mb-6">
        <label className="block text-gray-600 font-medium mb-2 ">Gender</label>
        {genders.map((gender) => {
          return (
            <div key={gender} className=" flex items-center mb-1 ">
              <input
                type="radio"
                name="gender"
                value={gender}
                checked = {filters.gender === gender}
                onChange={handleFilterChange}
                className="mr-2 h-4 w-4 text-blue-500 focus:ring-blue-400 border-gray-300"
              />
              <span className="text-gray-700">{gender} </span>
            </div>
          );
        })}
      </div>
      {/* color filter  */}
      <div className="mb-6">
        <label className="block text-gray-600 font-medium mb-2 ">Color</label>
        <div className="flex flex-wrap gap-2 ">
          {colors.map((color) => {
            return (
              <button
                key={color}
                name="color"
                value={color}
                onClick={handleFilterChange}
                style={{ backgroundColor: color.toLowerCase() }}
                className={`w-8 h-8 rounded-full border border-gray-300 cursor-pointer transition hover:scale-105 ${filters.color === color ? "ring-2 ring-blue-500": "" } `}></button>
            );
          })}
        </div>
      </div>
      {/* size filter  */}
      <div className="mb-6">
        <label className="block text-gray-600 font-medium mb-2 ">size</label>
        {sizes.map((size) => {
          return (
            <div key={size} className="flex items-center mb-1">
              <input
                type="checkbox"
                name="size"
                value={size}
                checked= {filters.size.includes(size)}
                onChange={handleFilterChange}
                className="mr-2 h-4 w-4 text-blue-500 focus:ring-blue-400 border-gray-300"
              />
              <span className="text-gray-700">{size} </span>
            </div>
          );
        })}
      </div>
      {/* material filter  */}
      <div className="mb-6">
        <label className="block text-gray-600 font-medium mb-2 ">
          material
        </label>
        {materials.map((material) => {
          return (
            <div key={material} className="flex items-center mb-1">
              <input
                type="checkbox"
                name="material"
                value={material}
                checked = {filters.material.includes(material) }
                onChange={handleFilterChange}
                className="mr-2 h-4 w-4 text-blue-500 focus:ring-blue-400 border-gray-300"
              />
              <span className="text-gray-700">{material} </span>
            </div>
          );
        })}
      </div>
      {/* brand filter  */}
      <div className="mb-6">
        <label className="block text-gray-600 font-medium mb-2 ">brand</label>
        {brands.map((brand) => {
          return (
            <div key={brand} className="flex items-center mb-1">
              <input
                type="checkbox"
                name="brand"
                value={brand}
                checked={filters.brand.includes(brand)}
                onChange={handleFilterChange}
                className="mr-2 h-4 w-4 text-blue-500 focus:ring-blue-400 border-gray-300"
              />
              <span className="text-gray-700">{brand} </span>
            </div>
          );
        })}
      </div>

      {/* price range filter  */}
      <div className="mb-8">
        <label className="block text-gray-600 font-medium mb-2 ">
          Price Range
        </label>
        <input
          type="range"
          name="priceRange"
         value={priceRange[1]}
         onChange={handlePriceChange}
          min={0}
          max={100}
          className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer"
        />
        <div className="flex justify-between text-gray-600 mt-2">
          <span>$0</span>
          <span>${priceRange[1]}</span>
        </div>
      </div>


      {/* clear filter  */}
      { isFilterActive && (
 <div className="text-center">

          <button className="text-sm text-red-500 hover:text-red-700 cursor-pointer transition-all"
          onClick={handleClear}
          
          > Clear filter  </button>
           
        </div>

      )}
       


    </div>
  );
}

export default FilterSideBar;
