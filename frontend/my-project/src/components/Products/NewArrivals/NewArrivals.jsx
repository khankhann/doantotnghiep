import { Link } from "react-router-dom";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { useEffect, useRef, useState } from "react";
import api from "../../../api/axiosClients";


function NewArrivals() {
  const scrollRef = useRef(null);
  const [isDrag, setIsDrag] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [newArrivals , setNewArrivals] = useState([])
  const scroll = (direction) => {
    const scrollAmount = direction === "left" ? -480 : 480;
    scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
  };

  const handleMouseDown = (e) => {
    setIsDrag(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };
  const handleMouseMove = (e) => {
    if (!isDrag) return;
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = x - startX;
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };
  const handleMouseUp = () => {
    setIsDrag(false);
  };
  
  const updateScrollButton = () => {
    const container = scrollRef.current;
    if (container) {
      const leftScroll = container.scrollLeft;
      const rightScrollable =
      container.scrollWidth > container.clientWidth + leftScroll;
      setCanScrollLeft(leftScroll > 0);
      setCanScrollRight(rightScrollable);
    }
    
    // console.log({
      //   scrollLeft: container.scrollLeft,
      //   clientWidth: container.clientWidth,
      //   containerScrollWidth: container.scrollWidth,
      // });
    };
    
    
    useEffect(()=> {
     const fetchNewArrivals = async ()=>{
      try{
    
        const response = await api.get(`${import.meta.env.VITE_BACKEND_URL}/api/products/new-arrivals`)
        setNewArrivals(response.data)
      }catch(err){
        console.error(err)
      }
     } 
     fetchNewArrivals()
    },[])


    useEffect(() => {
      const container = scrollRef.current;
      
      if (container) {
        container.addEventListener("scroll", updateScrollButton);
        updateScrollButton();
      }
      return () => container.removeEventListener("scroll", updateScrollButton);
    }, [newArrivals]);
    
    
    






  return (
    <section className="py-16 px-4 lg:px-0">
      <div className="container mx-auto text-center mb-10 relative ">
        <h2 className="text-3xl font-bold mb-4 "> Explore New Arrivals </h2>
        <p>
          {" "}
          Discover the latest styles straight off the runway, freshly added to
          keep your wardrobe on the cutting edge of fashion
        </p>
        {/* {button scoll} */}
        <div className=" absolute right-0 bottom-[-60px] flex space-x-2 ">
          <button
            className={` p-2 rounded border ${
              canScrollLeft
                ? " bg-white text-black "
                : "bg-gray-200 text-gray-400 cursor-not-allowed "
            }  `}
            onClick={() => scroll("left")}>
            <FaChevronLeft className="text-2xl " />
          </button>
          <button
            className={` p-2 rounded border ${
              canScrollRight
                ? " bg-white text-black"
                : "bg-gray-200 text-gray-400 cursor-not-allowed "
            } `}
            onClick={() => scroll("right")}>
            <FaChevronRight className="text-2xl " />
          </button>
        </div>
      </div>
      {/* {scoll content} */}
      <div
        ref={scrollRef}
        className={` container mx-auto overflow-x-scroll my-20 flex space-x-6 relative ${
          isDrag ? "cursor-grabbing" : "cursor-grab"
        } `}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}>
        {newArrivals.map((product, index) => {
          return (
            <div
              key={index}
              className=" min-w-[100%] sm:min-w-[50%] lg:min-w-[30%] relative  ">
              <img
                src={product.images[0].url}
                alt={product.images[0].altText || product.name}
                className="w-full h-[500px] object-cover rounded-lg"
                draggable="false"
              />
              <div className="absolute bottom-0 left-0 right-0 bg/50 backdrop-blur-md text-white p-4 rounded-b-lg  ">
                <Link to={`/product/${product._id}`} className=" block  ">
                  <h4 className="font-medium ">{product.name} </h4>
                  <p className="mt-1 ">{product.price} </p>
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default NewArrivals;
