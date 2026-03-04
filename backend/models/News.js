const mongoose = require("mongoose");

const newsSchema = new mongoose.Schema({
  title : {
    type : String, 
    require : true ,
    trim : true
  },
  user: {
    type : mongoose.Schema.Types.ObjectId,
    ref: "User",
    require: true
  },
  slug : {
    type : String ,
    require : true,
    unique : true
  },
  intro : {
    type : String , 
    require: true,
  }, 
  imageUrl : {
    type : String , 
    require : true
  },
  content : {
    type : String , 
    require : true
  }
},
{
    timestamps : true
})

module.exports = mongoose.model("News", newsSchema)
