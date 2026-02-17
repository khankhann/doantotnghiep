  import { Link } from "react-router-dom";
  import { ProductTopWearWomen } from "./TopWearWomen";
function TopWearWomen() {
    return (
        <section className="container mx-auto">
            <h2 className="text-3xl text-center font-bold mb-4">
                Top Wears to Women
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 ">
        {ProductTopWearWomen.map((product, index) => {
          return (
            <Link key={index} to={`/product/${product._id}`} className="block ">
              <div className="bg-white p-4 rounded-lg">
                <div className="w-full h-96 mb-4">
                  <img
                    src={product.images[0].url}
                    alt={product.images[0].alText || product.name}
                    className=" w-full h-full object-cover rounded-lg "
                  />
                </div>
                <h3 className="text-sm mb-2 "> {product.name} </h3>
                <p className="text-gray-500 font-medium text-sm tracking-tighter">
                  {product.price}
                </p>
              </div>
            </Link>
          );
        })}
      </div>

        </section>
      );
}

export default TopWearWomen;