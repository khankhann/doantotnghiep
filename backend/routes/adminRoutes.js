const express = require("express")
const User = require("../models/User")
const {protect , admin } = require("../middleware/authMiddleware")
const router = express.Router()

// route Get / api/ admin/ users 
// get all user (admin only) 
// private
router.get("/", protect , admin , async(req, res)=>{
    try {
        const users = await User.find().select({})
        res.json(users)

    }catch (err){
        console.error(err)
        res.status(500).json({message : "server error"})
    }
})

// route post / api/ admin/ users
// add new admin user 
// private / admin 
router.post("/", protect, admin, async(req, res)=>{
    const {name , email , password , role} = req.body
    try {
let user = await User.findOne({email})
if(user){
    return res.status(400).json({message : "user already exists"})
} 
user = new User({
    name,
     email , 
     password,
      role: role || "customer"
    })
    await user.save()
    res.status(201).json({message : "admin user created successfully", user})
}
    catch(err){
        console.error(err)
        res.status(500).json({message : "server error"})
    }
})

// route Put / api/ admin/users/:id
// update info user by Id
// private / admin 
router.put("/:id", protect, admin , async(req, res)=>{
    try {
const user = await User.findById(req.params.id)
if(user){
user.name = req.body.name || user.name
user.email = req.body.email || user.email
user.role = req.body.role || user.role
const userUpdate =  await user.save()
res.json({message : "user updated successfully",user: userUpdate})
}
    }catch (err){
        console.error(err)
        res.status(500).json({message : "server error"})
    }
})

// route delete / api / admin / users/ :id
// delete user by Id 
// private / admin

router.delete("/:id", protect, admin , async(req, res)=>{
    try {
const user = await User.findById(req.params.id)
if(user){
    await user.deleteOne()
    res.json({message : "user delete successfully"})

}else{
    res.status(404).json({message : "user not found"})
}
    }catch (err){
        console.error(err)
        res.status(500).json({message : "server error"})
    }
})
module.exports = router 