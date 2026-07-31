import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import bgRegister from "/src/assets/image/background/backgroundRegister.jpeg.webp";
import { registerUser } from "@redux/slices/authSlice";
import { useDispatch, useSelector } from "react-redux";
import { mergeCart } from '@redux/slices/cartSlice';
import { toast } from "sonner"; 
import PageTransition2 from "../../components/PageTransition/PageTransition2"; 
import { IoEyeOutline, IoEyeOffOutline } from "react-icons/io5";

function RegisterPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, guestId, loading } = useSelector((state) => state.auth);
  const { cart } = useSelector((state) => state.cart);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      return toast.error("Vui lòng điền đầy đủ thông tin!");
    }
    
    // Dispatch action đăng ký
    dispatch(registerUser({ name, email, password }))
      .unwrap()
      .then((res) => {
         // Thành công thì authSlice sẽ xử lý (ví dụ: báo check email)
      })
      .catch((err) => {
         // Lỗi
         toast.error(err || "Đăng ký thất bại. Vui lòng thử lại!");
      });
  };

  // Lấy tham số redirect để điều hướng
  const redirect = new URLSearchParams(location.search).get("redirect") || "/";
  const isCheckRedirect = redirect.includes("checkout");
  
  useEffect(() => {
    if (user) {
      if (cart?.products.length > 0 && guestId) {
        dispatch(mergeCart({ guestId, user })).then(() => {
          navigate(isCheckRedirect ? "/checkout" : "/");
        });
      } else {
        navigate(isCheckRedirect ? "/checkout" : "/");
      }
    }
  }, [user, guestId, cart, navigate, isCheckRedirect, dispatch]);

  return (
    <PageTransition2>
      {/* Set h-screen để giao diện chiếm đúng 100% chiều cao màn hình */}
      <div className="flex h-screen overflow-hidden bg-white">
        
        {/* CỘT TRÁI: FORM ĐĂNG KÝ */}
        <div className="w-full md:w-1/2 flex flex-col justify-center items-center p-8 md:p-12 overflow-y-auto">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg border border-gray-100"
          >
            <div className="flex justify-center mb-6">
              <h2 className="text-2xl font-black uppercase tracking-wider text-gray-900">Shop</h2>
            </div>
            
            <h2 className="text-2xl font-bold text-center mb-2">Create Account</h2>
            <p className="text-center text-gray-500 mb-8 text-sm">Please fill in the details to register</p>

            {/* Field: Name */}
            <div className="mb-5">
              <label className="block text-sm font-semibold mb-2">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:border-black focus:ring-1 focus:ring-black transition-all text-sm"
                placeholder="Enter your name"
              />
            </div>

            {/* Field: Email */}
            <div className="mb-5">
              <label className="block text-sm font-semibold mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:border-black focus:ring-1 focus:ring-black transition-all text-sm"
                placeholder="Enter your email address"
              />
            </div>

            {/* Field: Password */}
            <div className="mb-8">
              <label className="block text-sm font-semibold mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:border-black focus:ring-1 focus:ring-black transition-all text-sm pr-12"
                  placeholder="Create a strong password"
                />
                {/* 👉 Nút bấm Ẩn/Hiện mật khẩu */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-black transition-colors"
                >
                  {showPassword ? <IoEyeOutline size={20} /> : <IoEyeOffOutline size={20} />}
                </button>
              </div>
            </div>

            <button
              disabled={loading}
              className="w-full bg-black text-white p-3 rounded-lg font-semibold hover:bg-gray-800 transition-all duration-300 ease-in-out disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Signing Up...</span>
                </>
              ) : (
                "Sign Up"
              )}
            </button>

            <p className="mt-6 text-center text-sm">
              Already have an account?{" "}
              <Link
                to={`/login?redirect=${encodeURIComponent(redirect)}`}
                className="text-blue-600 font-semibold hover:underline"
              >
                Log In
              </Link>
            </p>
          </form>
        </div>

        {/* CỘT PHẢI: HÌNH ẢNH */}
        <div className="hidden md:block w-full flex-1 bg-gray-800 shadow-2xl">
          <div className="h-full w-full flex flex-col justify-center items-center relative">
            <img
              src={bgRegister}
              alt="Register Background"
              className="h-full w-full object-cover" // Xóa bỏ chiều cao cứng h-[750px], thay bằng h-full
            />
          </div>
        </div>

      </div>
    </PageTransition2>
  );
}

export default RegisterPage;