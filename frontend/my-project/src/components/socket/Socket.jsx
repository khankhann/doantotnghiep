
import io from "socket.io-client";

// Khởi tạo kết nối 1 lần duy nhất ở đây
const socket = io(import.meta.env.VITE_BACKEND_URL || "http://localhost:9000", {
  transports: ["websocket"], 
  withCredentials: true,
  autoConnect: true,
});

export default socket;