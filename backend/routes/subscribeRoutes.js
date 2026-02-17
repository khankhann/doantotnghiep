const express = require("express")
const Subscriber = require("../models/Subscriber")
const router = express.Router()

// route Post / api / subscribe 
// handle new subscriber
// public 

router.post("/", async(req, res)=>{
    const {email} = req.body
    if(!email){
        return res.status(400).json({message : "email is required"})
    }
   
    try {
        // check email 
        let subscriber = await Subscriber.findOne({email})
        if(subscriber){
return res.status(400).json({message : "email is already subscribed"})
        }

        // create new subscriber 
        subscriber = new Subscriber({email})
        await subscriber.save()
        res.status(201).json({message : "subscribed successfully"})
    }catch (err){
        console.error(err)
        res.status(500).json({message : "server error"})
    }
})
module.exports = router 