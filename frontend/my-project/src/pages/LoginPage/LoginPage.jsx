import { useEffect, useState } from "react";
import bgLogin from "/src/assets/image/background/backgroundLogin.webp";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { loginUser } from "@redux/slices/authSlice";
import { useDispatch, useSelector } from "react-redux";
import { mergeCart } from "@redux/slices/cartSlice";
import { toast } from "sonner";
import PageTransition2 from "../../components/PageTransition/PageTransition2";
import { IoEyeOutline, IoEyeOffOutline } from "react-icons/io5";

function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, guestId, loading } = useSelector((state) => state.auth);
  const { cart } = useSelector((state) => state.cart);

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

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // State quản lý ẩn/hiện mật khẩu
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !password) {
      return toast.error("Vui lòng nhập đầy đủ email và mật khẩu");
    }
    dispatch(loginUser({ email, password }))
      .unwrap()
      .then((res) => {
        toast.success(`Chào mừng trở lại!`);
      })
      .catch((err) => {
        toast.error("Đăng nhập thất bại. Kiểm tra lại thông tin nhé!");
      });
  };

  return (
    <PageTransition2>
      {/* Set h-screen để giao diện chiếm đúng 100% chiều cao màn hình */}
      <div className="flex h-screen overflow-hidden bg-white">
        
        {/* CỘT TRÁI: FORM ĐĂNG NHẬP (Giữ nguyên kích thước 1/2 như cũ) */}
        <div className="w-full md:w-1/2 flex flex-col justify-center items-center p-8 md:p-12 overflow-y-auto">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg border border-gray-100"
          >
            <div className="flex justify-center mb-6">
              <h2 className="text-2xl font-black uppercase tracking-wider text-gray-900">Shop</h2>
            </div>
            
            <h2 className="text-2xl font-bold text-center mb-2">Hey There!</h2>
            <p className="text-center text-gray-500 mb-8 text-sm">Enter your username and password</p>

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

            <div className="mb-8">
              <label className="block text-sm font-semibold mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:border-black focus:ring-1 focus:ring-black transition-all text-sm pr-12"
                  placeholder="Enter your password"
                />
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
                  <span>Loading...</span>
                </>
              ) : (
                "Sign In"
              )}
            </button>

            <p className="mt-6 text-center text-sm">
              Don't have an account?{" "}
              <Link
                to={`/register?redirect=${encodeURIComponent(redirect)}`}
                className="text-blue-600 font-semibold hover:underline"
              >
                Register
              </Link>
            </p>
          </form>
        </div>

        {/* CỘT PHẢI: HÌNH ẢNH (Trả về w-full flex-1 để nó chiếm trọn không gian to như bản gốc) */}
        <div className="hidden md:block w-full flex-1 bg-gray-800 shadow-2xl">
          <div className="h-full w-full flex flex-col justify-center items-center relative">
            <img
              src={bgLogin}
              alt="Login Background"
              className="h-full w-full object-cover"
            />
          </div>
        </div>

      </div>
    </PageTransition2>
  );
}

export default LoginPage;