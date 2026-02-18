const express = require("express")
const Order = require("../models/Order")
const CheckOut = require("../models/Checkout")
const {protect} = require("../middleware/authMiddleware")
const router = express.Router()

// router Get / api / orders/ my-orders 
// get logged-in user order 
// private 

router.get("/my-orders", protect , async(req, res)=>{
    try { 
const orders = await CheckOut.find({user : req.user._id}).sort({
    createdAt: -1,
})
res.json(orders)
    }catch(err){
        console.error(err)
        res.status(500).json({message : "server error"})
    }
})

// router get / api / orders / :id
// get order detail by Id 
// private 

router.get("/:id", protect , async(req, res)=>{
    try {
        const order = await CheckOut.findById(req.params.id).populate(
            "user", "name email"
        )
        if(!order){
            return res.status(400).json({message : "Order not found "})
        }
        if(order.user._id.toString() !== req.user._id.toString()){
            return res.status(400).json({message : "not authorized to view this order "})
        }
        res.json(order)
    }catch (err){
        console.error(err)
        res.status(500).json({message : "server error"})
    }
})
module.exports = router 
