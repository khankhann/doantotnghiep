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
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log("giai ma token", decoded)
      req.user = await User.findById(decoded.user.id).select("-password");
     
      next();
    } catch (err) {
      console.error("token verification failed", err);
      res.status(401).json({ message: "Not authorized, token failed" });
    }
  } else {
    res.status(401).json({ message: "Not authorized, no token " });
  }
};
// middle wave check if user admin 
const admin = (req , res, next) => {
  if(req.user && req.user.role === "admin"){
    next()
  }else{
    res.status(403).json({message : "Not authorized as an admin"})

  }
}



module.exports = { protect , admin };
