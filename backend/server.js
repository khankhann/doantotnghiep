const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
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
const app = express();
app.use(express.json());
app.use(cors());

dotenv.config();
const PORT = process.env.PORT || 3000;


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
app.listen(PORT, () => {
  console.log(`server is running on http://localhost:${PORT}`);
});
