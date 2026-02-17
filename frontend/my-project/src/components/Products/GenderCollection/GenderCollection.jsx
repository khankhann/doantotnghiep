import { Link } from "react-router-dom";
import menCollection from "/src/assets/image/product/genderCollection/MenCollection.webp";
import womenCollection from "/src/assets/image/product/genderCollection/WomenCollection.png";
function GenderCollection() {
  return (
    <section className="py-16 px-4 lg:px-0">
      <div className="container mx-auto flex flex-col md:flex-row gap-8">
        {/* {women collection} */}
        <div className=" relative flex-1 ">
          <img
            src={womenCollection}
            alt="women's collection"
            className="w-full h-full object-cover "
          />
          <div className=" absolute bottom-8 left-8 bg-white/90 p-4 ">
            <h2 className=" text-2xl font-bold text-gray-900 mb-3 ">
              Women's Collection
            </h2>
            <Link
              to="/collection/all?gender=women"
              className=" text-gray-900 underline ">
              Shop Now
            </Link>
          </div>
        </div>
        {/* {men collection} */}
         <div className=" relative flex-1 ">
          <img
            src={menCollection}
            alt="men's collection"
            className="w-full h-full object-cover "
          />
          <div className=" absolute bottom-8 left-8 bg-white/90 p-4 ">
            <h2 className=" text-2xl font-bold text-gray-900 mb-3 ">
              Men's Collection
            </h2>
            <Link
              to="/collection/all?gender=men"
              className=" text-gray-900 underline ">
              Shop Now
            </Link>
          </div>
          </div>
      </div>
    </section>
  );
}

export default GenderCollection;
