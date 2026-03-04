const mongoose = require("mongoose") 
const messageSchema = new mongoose.Schema({
    user : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "User",
        required : true
    },
    text : {
        type : String ,
        required: true 
    },
    sender : {
        type : String ,
        enum : ["customer" ,"admin"],
        required : true
    },
    imageUrl : {
        type : String , 
        default :""
    },
    isRead : {
        type : Boolean,
        default : false
    }
},{
    timestamps : true
})
module.exports  = mongoose.model("Message", messageSchema);
