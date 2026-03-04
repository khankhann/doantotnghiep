const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const http = require("http");


const userRoutes = require("./routes/userRoutes")
const productRoutes = require("./routes/productRoutes")
const cartRoutes = require("./routes/cartRoutes")
const checkoutRoutes = require("./routes/checkoutRoutes")
const orderRoutes = require("./routes/orderRoutes")
const uploadRoutes = require("./routes/uploadRoutes")
const subscribeRoutes = require("./routes/subscribeRoutes")
const adminRoutes = require("./routes/adminRoutes")
const productAdminRoutes = require("./routes/productAdminRoutes")
const orderAdminRoutes = require("./routes/adminOrderRoutes")
const momoRoutes = require("./routes/momoRoutes")
const notificationRoutes = require("./routes/notificationRoutes")
const aiRecommendRoutes = require("./routes/aiRecommendRoutes")
const chatRoutes = require("./routes/chatRoutes")
const newsRoutes = require("./routes/newsRoutes")
const reviewsRoutes = require("./routes/reviewsRoutes")


dotenv.config();
const app = express();
// socket io 
const server = http.createServer(app)
const { Server } = require("socket.io");
const handleChatSocket = require("./socket/socketChat");



const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", 
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  },
});
handleChatSocket(io)

app.use(cors({
  // Cho phép cả 5173 (lúc code) và localhost (lúc chạy Docker)
  origin: ["http://localhost:5173", "http://localhost"], 
  credentials: true
}));

app.use(express.json({limit : "50mb"}));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use((req, res, next) => {
  req.io = io;
  next();
});





const PORT = process.env.PORT || 9000;


// connect MongoDB
connectDB();

app.get("/", (req, res) => {
  res.send("WELLCOME TO API");
});
// api routes 
app.use("/api/users", userRoutes )
app.use("/api/products", productRoutes)
app.use("/api/cart", cartRoutes)
app.use("/api/checkout", checkoutRoutes)
app.use("/api/orders", orderRoutes)
app.use("/api/upload", uploadRoutes)
app.use("/api/subscribe", subscribeRoutes)
app.use("/api/momo", momoRoutes)
// admin 
app.use("/api/admin/users", adminRoutes)
app.use("/api/admin/products", productAdminRoutes)
app.use("/api/admin/orders", orderAdminRoutes)
// notification 
app.use("/api/notifications", notificationRoutes)
// ai recommend
app.use("/api/ai-recommend", aiRecommendRoutes)
app.use("/api/messages", chatRoutes)


app.use("/api/news", newsRoutes)
app.use("/api/reviews", reviewsRoutes)
server.listen(PORT, () => {
  console.log(`server is running on http://localhost:${PORT}`);
});

// app.use(cors({
//   origin: ["https://doantotnghiep-mu.vercel.app"], 
//   credentials: true
// }));


