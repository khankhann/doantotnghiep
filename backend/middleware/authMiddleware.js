const jwt = require("jsonwebtoken");
const User = require("../models/User");

// middle ware protect route
const protect = async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];

      if (!token || token === "null" || token === "undefined") {
        return res.status(401).json({ message: "Not authorized, invalid token format" });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
      req.user = await User.findById(decoded.user.id).select("-password");
      
      if (!req.user) {
        return res.status(401).json({ message: "User không tồn tại, Token không hợp lệ!" });
      }

      next();
    } catch (err) {
      console.error("Token verification failed:", err.message);
      return res.status(401).json({ message: "Not authorized, token failed" });
    }
  } else {
    return res.status(401).json({ message: "Not authorized, no token" });
  }
};

// middle wave check if user admin 
const admin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    return res.status(403).json({ message: "Not authorized as an admin" });
  }
};

module.exports = { protect, admin };