import axios from "axios";

// Đặt Base URL ra ngoài để tái sử dụng ở dưới chỗ Refresh Token
const BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:9000";

const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        "Content-Type": "application/json"
    }
});

// --- INTERCEPTOR REQUEST ---
api.interceptors.request.use(
    (config) => {
        try {
            // SỬA: Bỏ await đi vì localStorage là đồng bộ
            const token = localStorage.getItem("userToken");
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        } catch (error) {
            console.error(error);
            return Promise.reject(error);
        }
    },
    (error) => Promise.reject(error)
);

// --- INTERCEPTOR RESPONSE ---
api.interceptors.response.use(
   (response) => response,  
   async (error) => {
    const originalRequest = error.config;
    
    // Nếu lỗi 401 và chưa từng thử refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true; 

        try {
            const refreshToken = localStorage.getItem("refreshToken");

            if (!refreshToken) {
                const publicPages = ["/", "/news", "/collections"];
        if (!publicPages.includes(window.location.pathname)) {
            window.location.href = "/login";
        }
                // Không có refreshToken thì đá về login
                localStorage.removeItem("userToken");
                localStorage.removeItem("refreshToken");
                localStorage.removeItem("userInfo");
                
           
                window.location.href = "/login";
                return Promise.reject(error);
            }
            
            // Dùng axios thuần để gọi API refresh token (tránh bị dính vòng lặp interceptor)
            const response = await axios.post(
                `${BASE_URL}/api/users/refresh-token`, 
                { refreshToken }
            );

            // Lấy accessToken mới
            const newAccessToken = response.data.accessToken;
            
            // Cập nhật vào Storage và Header
            localStorage.setItem("userToken", newAccessToken);
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

            // Gửi lại cái request bị lỗi lúc nãy với token mới
            return api(originalRequest);
            
        } catch (refreshError) { // SỬA: Đổi tên biến để không đè biến 'error' bên ngoài
            console.error("Phiên đăng nhập hết hạn", refreshError);
            localStorage.removeItem("userToken");
            localStorage.removeItem("refreshToken");
            localStorage.removeItem("userInfo");
            
            // 🔥 SỬA CHÍ MẠNG: Dùng dấu "="
            window.location.href = "/login";
            return Promise.reject(refreshError);
        }
    }
    
    // Các lỗi khác không phải 401 thì cứ ném ra ngoài bình thường
    return Promise.reject(error);
   }
);

export default api;