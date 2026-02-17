import { Link } from "react-router-dom";
import BannerImg from "/src/assets/image/background/background.webp";
function Banner() {
    return ( 
        <section className="relative "> 
            <img src={BannerImg}
            alt=""
             className="w-full h-[400px] md:h-[600px] lg:h-[750px] object-cover  "  />
            <div className=" absolute inset-0 bg-black/10 flex items-center justify-center ">
                <div className="text-center text-white p-6">
                    <h1 className="text-4xl md:text-9xl font-bold tracking-tighter uppercase mb-4 ">
                        Vacation <br/> ready 
                    </h1>
                    <p className="text-sm tracking-tighter md:text-lg mb-6 text-black">
                        Explore out vacation-ready outfits with fast wordlwide shipping.
                    </p>
                    <Link to="#" className="bg-white text-gray-950 px-6 py-2 rounded-sm text-lg hover:bg-amber-50 transition-all duration-500 ease-in-out">
                    Shop now</Link>
                </div>
            </div>
        </section>
     );
}

export default Banner;