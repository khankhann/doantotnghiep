const mongoose = require("mongoose");

const sensorDataSchema = new mongoose.Schema({
    // 1. Nhiệt độ (Kiểu số, bắt buộc phải có)
    temperature: { 
        type: Number, 
        required: true 
    },
    
    // 2. Độ ẩm (Kiểu số, bắt buộc phải có)
    humidity: { 
        type: Number, 
        required: true 
    },
    
    // 3. Trạng thái báo động (Kiểu True/False, mặc định là an toàn - false)
    is_alert: { 
        type: Boolean, 
        default: false 
    },
    
    // 4. Mốc thời gian (Tự động lấy giờ hệ thống ngay lúc lưu vào DB)
    timestamp: { 
        type: Date, 
        default: Date.now 
    }
});

// Xuất cái Model này ra để mấy file khác (như iotRoutes) gọi vào xài
module.exports = mongoose.model("SensorData", sensorDataSchema);