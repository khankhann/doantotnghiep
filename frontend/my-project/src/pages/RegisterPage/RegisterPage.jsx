import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import bgRegister from "/src/assets/image/background/backgroundRegister.jpeg.webp";
import { registerUser } from "@redux/slices/authSlice";
import { useDispatch, useSelector } from "react-redux";
import { mergeCart } from '@redux/slices/cartSlice';
function RegisterPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, guestId } = useSelector((state) => state.auth);
  const { cart } = useSelector((state) => state.cart);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(registerUser({ name, email, password }));
  };

// get redirect parameter and check if is's checkout or something 
const redirect = new URLSearchParams(location.search).get("redirect") || "/";
const isCheckRedirect = redirect.includes("checkout")
useEffect(()=> {
  if(user){
    if(cart?.products.length > 0 && guestId ){
      dispatch(mergeCart({guestId, user}))
      .then(()=> {
        navigate(isCheckRedirect ? "/checkout" : "/")
      })
    }else {
      navigate(isCheckRedirect ? "/checkout" : "/")
    }
  }
}, [user , guestId , cart , navigate, isCheckRedirect , dispatch])



  return (
    <div className="flex">
      <div className="w-full md:w-1/2 flex flex-col justify-center items-center p-8 md:p-12 ">
        <form
          onSubmit={handleSubmit}
          className=" w-full max-w-md bg-white p-8 rounded-lg border shadow-2xl ">
          <div className="flex justify-center mb-6 ">
            <h2 className="text-xl font-medium">Shop</h2>
          </div>
          <h2 className="text-2xl font-bold text-center mb-6">Hey There!</h2>
          <p className="text-center mb-6">Enter your username and passwod</p>
          {/* name */}
          <div className="mb-4">
            <label className=" block text-sm font-semibold mb-2 "> Name</label>
            <input
              type="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="Enter your name"
            />
          </div>
          {/* email  */}
          <div className="mb-4">
            <label className=" block text-sm font-semibold mb-2 "> Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="Enter your email address"
            />
          </div>
          {/* password  */}
          <div className="mb-4">
            <label className="block text-sm font-semibold mb-2">
              {" "}
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="Enter your password"
            />
          </div>
          <button
            className="w-full bg-black text-white p-2 rounded-lg 
          font-semibold hover:bg-gray-500 transition-all duration-500 ease-in-out  ">
            Sign Up
          </button>
          <p className="mt-6 text-center text-sm">
            Don't have an account ? {""}
            <Link to={`/login?redirect=${encodeURIComponent(redirect)}`} className="text-blue-500">
              Login
            </Link>
          </p>
        </form>
      </div>
      <div className=" hidden md:block w-full bg-gray-800 shadow-2xl ">
        <div className=" h-full w-full flex flex-col justify-center items-center  ">
          <img
            src={bgRegister}
            alt="Register "
            className=" h-[750px] w-full object-cover "
          />
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
