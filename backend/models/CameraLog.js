const mongoose = require("mongoose");

const cameraLogSchema = new mongoose.Schema({
    // 1. Link ảnh lưu trên Cloudinary
    imageUrl: { 
        type: String, 
        required: true 
    },
    
    reason: { 
        type: String, 
        required: true 
    },
    
    // 3. Thời gian chụp
    timestamp: { 
        type: Date, 
        default: Date.now 
    }
});

module.exports = mongoose.model("CameraLog", cameraLogSchema);