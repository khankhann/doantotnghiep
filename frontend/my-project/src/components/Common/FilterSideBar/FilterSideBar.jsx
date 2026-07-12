import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

function FilterSideBar() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [filters, setFilters] = useState({
    category: "",
    gender: "",
    color: "",
    size: [],
    material: [],
    brand: [],
    minPrice: 0,
    maxPrice: 5000000, 
  });
  
  const [priceRange, setPriceRange] = useState([0, 5000000]);
  
  const categories = ["Top Wear", "Bottom Wear"];
  const colors = [
    "Red", "Blue", "Black", "Green", "Yellow",
    "Gray", "White", "Pink", "Beige", "Navy",
  ];
  const sizes = ["XS", "S", "M", "L", "XL", "XXL"];
  const materials = [
    "Cotton", "Wool", "Denim", "Polyester", 
    "Silk", "Linen", "Viscose", "Fleece",
  ];
  const brands = [
    "Urban Threads", "Modern Fit", "Street Style", 
    "Beach Breeze", "Fashionista", "ChicStyle",
  ];
  const genders = ["Men", "Women"];

  useEffect(() => {
    const params = Object.fromEntries([...searchParams]);
    
    const urlMinPrice = params.minPrice ? Number(params.minPrice) : 0;
    const urlMaxPrice = params.maxPrice ? Number(params.maxPrice) : 5000000;

    setFilters({
      category: params.category || "",
      gender: params.gender || "",
      color: params.color || "",
      size: params.size ? params.size.split(",") : [],
      material: params.material ? params.material.split(",") : [],
      brand: params.brand ? params.brand.split(",") : [],
      minPrice: urlMinPrice,
      maxPrice: urlMaxPrice, 
    });
    setPriceRange([urlMinPrice, urlMaxPrice]);
  }, [searchParams]);

  const updateURLParams = (updatedFilters) => {
    const params = new URLSearchParams();
    Object.keys(updatedFilters).forEach((key) => {
      if (Array.isArray(updatedFilters[key]) && updatedFilters[key].length > 0) {
        params.append(key, updatedFilters[key].join(","));
      } else if (updatedFilters[key] !== "" && updatedFilters[key] !== undefined && updatedFilters[key] !== null && !Array.isArray(updatedFilters[key])) {
        params.append(key, updatedFilters[key]);
      }
    });
    setSearchParams(params);
  };

  const handleFilterChange = (e) => {
    const { name, value, checked, type } = e.target;
    
    setFilters((prev) => {
      let newFilters = { ...prev };
      if (type === "checkbox") {
        if (checked) {
          newFilters[name] = [...(newFilters[name] || []), value];
        } else {
          newFilters[name] = newFilters[name].filter((item) => item !== value);
        }
      } else {
        // Hỗ trợ bấm chọn màu hoặc đổi radio
        newFilters[name] = newFilters[name] === value ? "" : value; 
      }
      
      updateURLParams(newFilters);
      return newFilters;
    });
  };

  // Riêng cho nút Color (dạng button bấm chọn)
  const handleColorClick = (colorValue) => {
    setFilters((prev) => {
      const newColor = prev.color === colorValue ? "" : colorValue;
      const newFilters = { ...prev, color: newColor };
      updateURLParams(newFilters);
      return newFilters;
    });
  };

  const handleClear = () => {
    const resetState = {
      category: "",
      gender: "",
      color: "",
      size: [],
      material: [],
      brand: [],
      minPrice: 0,
      maxPrice: 5000000, 
    };
    setFilters(resetState);
    setPriceRange([0, 5000000]); 
    setSearchParams({});
  };

  const isFilterActive =
    filters.category !== "" ||
    filters.gender !== "" ||
    filters.color !== "" ||
    filters.size.length > 0 ||
    filters.material.length > 0 ||
    filters.brand.length > 0 ||
    filters.minPrice > 0 ||
    filters.maxPrice < 5000000;

  // Thanh kéo giá cục bộ mượt mà
  const handlePriceChange = (e) => {
    const newPrice = Number(e.target.value); 
    setPriceRange([0, newPrice]);
    setFilters((prev) => ({ ...prev, minPrice: 0, maxPrice: newPrice }));
  };

  const handlePriceCommit = () => {
    updateURLParams(filters);
  };

  return (
    <div className="p-4 font-sans">
      <h3 className="text-xl font-medium text-gray-800 mb-4">Filter</h3>

      {/* Category Filter */}
      <div className="mb-6">
        <label className="block text-gray-600 font-medium mb-2">Category</label>
        {categories.map((category) => (
          <div key={category} className="flex items-center mb-1 cursor-pointer" onClick={() => handleFilterChange({ target: { name: "category", value: category, type: "radio" } })}>
            <input
              type="radio"
              name="category"
              value={category}
              checked={filters.category === category}
              onChange={handleFilterChange}
              className="mr-2 h-4 w-4 text-blue-500 focus:ring-blue-400 border-gray-300 cursor-pointer"
            />
            <span className="text-gray-700 cursor-pointer">{category}</span>
          </div>
        ))}
      </div>

      {/* Gender filter */}
      <div className="mb-6">
        <label className="block text-gray-600 font-medium mb-2">Gender</label>
        {genders.map((gender) => (
          <div key={gender} className="flex items-center mb-1 cursor-pointer" onClick={() => handleFilterChange({ target: { name: "gender", value: gender, type: "radio" } })}>
            <input
              type="radio"
              name="gender"
              value={gender}
              checked={filters.gender === gender}
              onChange={handleFilterChange}
              className="mr-2 h-4 w-4 text-blue-500 focus:ring-blue-400 border-gray-300 cursor-pointer"
            />
            <span className="text-gray-700 cursor-pointer">{gender}</span>
          </div>
        ))}
      </div>

      {/* Color filter */}
      <div className="mb-6">
        <label className="block text-gray-600 font-medium mb-2">Color</label>
        <div className="flex flex-wrap gap-2">
          {colors.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => handleColorClick(color)}
              style={{ backgroundColor: color.toLowerCase() }}
              className={`w-8 h-8 rounded-full border border-gray-300 cursor-pointer transition hover:scale-105 ${
                filters.color === color ? "ring-2 ring-blue-500 shadow-md scale-110" : ""
              }`}
              title={color}
            />
          ))}
        </div>
      </div>

      {/* Size filter */}
      <div className="mb-6">
        <label className="block text-gray-600 font-medium mb-2">Size</label>
        {sizes.map((size) => (
          <div key={size} className="flex items-center mb-1">
            <input
              type="checkbox"
              name="size"
              value={size}
              checked={filters.size.includes(size)}
              onChange={handleFilterChange}
              className="mr-2 h-4 w-4 text-blue-500 focus:ring-blue-400 border-gray-300 rounded cursor-pointer"
            />
            <span className="text-gray-700">{size}</span>
          </div>
        ))}
      </div>

      {/* Material filter */}
      <div className="mb-6">
        <label className="block text-gray-600 font-medium mb-2">Material</label>
        {materials.map((material) => (
          <div key={material} className="flex items-center mb-1">
            <input
              type="checkbox"
              name="material"
              value={material}
              checked={filters.material.includes(material)}
              onChange={handleFilterChange}
              className="mr-2 h-4 w-4 text-blue-500 focus:ring-blue-400 border-gray-300 rounded cursor-pointer"
            />
            <span className="text-gray-700">{material}</span>
          </div>
        ))}
      </div>

      {/* Brand filter */}
      <div className="mb-6">
        <label className="block text-gray-600 font-medium mb-2">Brand</label>
        {brands.map((brand) => (
          <div key={brand} className="flex items-center mb-1">
            <input
              type="checkbox"
              name="brand"
              value={brand}
              checked={filters.brand.includes(brand)}
              onChange={handleFilterChange}
              className="mr-2 h-4 w-4 text-blue-500 focus:ring-blue-400 border-gray-300 rounded cursor-pointer"
            />
            <span className="text-gray-700">{brand}</span>
          </div>
        ))}
      </div>

      {/* Price Range */}
      <div className="mb-8">
        <label className="block text-gray-600 font-medium mb-3">
          Price Range
        </label>
        <input
          type="range"
          name="priceRange"
          value={priceRange[1]}
          onChange={handlePriceChange}
          onMouseUp={handlePriceCommit}   
          onTouchEnd={handlePriceCommit}  
          min={0}
          max={5000000} 
          step={50000} 
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
        />
        <div className="flex justify-between text-gray-700 mt-3 font-medium text-sm">
          <span>0 ₫</span>
          <span className="text-gray-700 font-bold">
            {new Intl.NumberFormat("vi-VN").format(priceRange[1])} ₫
          </span>
        </div>
      </div>

      {/* Clear filter */}
      {isFilterActive && (
        <div className="text-center">
          <button
            type="button"
            className="text-sm font-bold text-red-500 hover:text-red-700 cursor-pointer transition-all border border-red-200 hover:bg-red-50 py-2 px-6 rounded-full w-full"
            onClick={handleClear}
          >
            Xóa bộ lọc
          </button>
        </div>
      )}
    </div>
  );
}

export default FilterSideBar;