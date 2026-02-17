import { Link } from "react-router-dom";
import { TbBrandMeta } from "react-icons/tb";
import { FaInstagram } from "react-icons/fa";
import { FiYoutube } from "react-icons/fi";
import { MdOutlinePermPhoneMsg } from "react-icons/md"

function Footer() {
  return (
    <footer className="border-t py-12">
      <div
        className="container mx-auto grid grid-cols-1 md:grid-cols-4 gap-8
        px-4 lg:px-0
        ">
        <div>
          <h3 className="text-lg text-gray-800 mb-4">Newsletter</h3>
          <p className="text-gray-500 mb-4">
            Be ther first to hear about new products, exclusive events, and
            online offers
          </p>
          <p className="font-medium text-sm text-gray-600 mb-6 ">
            {" "}
            Sign up and ger 10% off your first order
          </p>
          {/* {news letter} */}
          <form className="flex">
            <input
              type="email"
              placeholder="enter your email "
              className="p-3 w-full text-sm border-t border-l border-b
              border-gray-300 rounded-l-md
               forcus:outline-none 
               focus:ring-2
                focus:ring-gray-500 
                transition-all"
              required
            />
            <button
              type="submit"
              className="bg-black text-white px-6 py-3 text-sm rounded-r-md 
                  hover:bg-gray800  transition-all">
              Subscribe
            </button>
          </form>
        </div>
        {/* {show link} */}
        <div>
          <h3 className="text-lg text-gray-800 mb-4 ">Shop</h3>
          <ul className="space-y-2 text-gray-600">
            <li>
              <Link to="#" className="hover:text-gray-500 transition-color ">
                Men's top wear{" "}
              </Link>
            </li>
            <li>
              <Link to="#" className="hover:text-gray-500 transition-color ">
                Women's top wear{" "}
              </Link>
            </li>
            <li>
              <Link to="#" className="hover:text-gray-500 transition-color ">
                Men's bottom wear{" "}
              </Link>
            </li>
            <li>
              <Link to="#" className="hover:text-gray-500 transition-color ">
                Women's bottom wear{" "}
              </Link>
            </li>
          </ul>
        </div>
        {/* { suport link } */}

        <div>
          <h3 className="text-lg text-gray-800 mb-4 ">Suport</h3>
          <ul className="space-y-2 text-gray-600">
            <li>
              <Link to="#" className="hover:text-gray-500 transition-color ">
                Contact Us{" "}
              </Link>
            </li>
            <li>
              <Link to="#" className="hover:text-gray-500 transition-color ">
                About Us{" "}
              </Link>
            </li>
            <li>
              <Link to="#" className="hover:text-gray-500 transition-color ">
                FAQs{" "}
              </Link>
            </li>
            <li>
              <Link to="#" className="hover:text-gray-500 transition-color ">
                Features{" "}
              </Link>
            </li>
          </ul>
        </div>

        {/* {follow us} */}
        <div>
          <h3 className="text-lg text-gray-800 mb-4 "> Follow Us</h3>
          <div className="flex items-center space-x-4 mb-6">
            <a
              href="https://www.facebook.com/khangeward/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-500
              transition-all duration-500 ease-in-out
              ">
                
              <TbBrandMeta className="h-5 w-5" />
            </a>
            <a
              href="https://www.instagram.com/khangz_cat/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-500
              transition-all duration-500 ease-in-out
              ">
              <FaInstagram className="h-5 w-5" />
            </a>{" "}
            <a
              href="https://www.youtube.com/@khang01nguyen91"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-500 
              transition-all duration-500 ease-in-out
              
              ">
              <FiYoutube className="h-5 w-5" />
            </a>
          </div>
          <p className="text-gray-500">Call Us</p>
          <p>
            <MdOutlinePermPhoneMsg className="w-5 h-5 inline-block mr-2 "/>
            0123 - 456789
          </p>
        </div>
      </div>
      {/* {footer bottom} */}
      <div className="container mx-auto mt-12 px-4 lg:px-0 border-t border-gray-200 pt-6 ">
        <p className="text-gray-500 text-sm tracking-tighter text-center"> ©2025, compiteTab. All Rights Reserver.</p>
      </div>
    </footer>
  );
}

export default Footer;
