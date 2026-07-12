const express = require("express");
const router = express.Router();
const axios = require("axios");
const User = require("../models/User");
const Product = require("../models/Product");

// 📦 IMPORT MODEL MONGODB
const SensorData = require("../models/SensorData");

// 1. BIẾN CHỐNG SPAM DISCORD
let lastAlertTime = 0; 
const COOLDOWN_TIME = 300000; 

// 2. BỘ NHỚ TẠM SENSOR
let latestSensorData = {
    temperature: 0,
    humidity: 0,
    tempStatus: "Chưa kết nối",
    humStatus: "Chưa kết nối",
    is_alert: false,
    updatedAt: null
};

// 🔥 2.1 BỘ NHỚ TẠM RFID 
let latestRfidTag = {
    tag: null,
    type: null,
    data: null,
    scannedAt: 0
};

// 🔥 2.2 BỘ NHỚ TẠM ĐIỀU KHIỂN (MỚI THÊM)
// Biến này lưu trạng thái công tắc trên Web để ESP32 đọc
let iotControlState = {
    fireSystem: true,
    securitySystem: true
};

// 3. HÀM BẮN THÔNG BÁO DISCORD
const sendDiscordAlert = async (temp, hum) => {
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL; 
    try {
        await axios.post(webhookUrl, {
            content: ` **BÁO ĐỘNG KHO HÀNG** \nNhiệt độ: **${temp}°C**\n Độ ẩm: **${hum}%**`
        });
    } catch (error) {
        console.log(" [DISCORD] Lỗi:", error.message);
    }
};

// ==========================================
// 📌 API 1: ESP32 GỬI DATA SENSOR (POST)
// ==========================================
router.post("/sensor", async(req, res) => {
    const temp = parseFloat(req.body.temperature);
    const hum = parseFloat(req.body.humidity);

    if (isNaN(temp) || isNaN(hum)) {
        return res.status(400).json({ message: "Thiếu dữ liệu" });
    }

    const MAX_TEMP = 32; 
    const MAX_HUM = 65;  
    const isAlertNow = temp > MAX_TEMP || hum > MAX_HUM;

    let tempStatus = temp > MAX_TEMP ? "ĐANG CAO " : "Bình thường ";
    let humStatus = hum > MAX_HUM ? "ĐANG CAO " : "Bình thường ";

    if (isAlertNow) {
        const currentTime = Date.now();
        if (currentTime - lastAlertTime > COOLDOWN_TIME) {
            sendDiscordAlert(temp, hum); 
            lastAlertTime = currentTime; 
        }
    }

    try {
        await SensorData.create({ temperature: temp, humidity: hum, is_alert: isAlertNow });
    } catch (dbError) {
        console.error(" Lỗi lưu DB:", dbError.message);
    }

    latestSensorData = {
        temperature: temp,
        humidity: hum,
        tempStatus,
        humStatus,
        is_alert: isAlertNow,
        updatedAt: new Date().toLocaleTimeString("vi-VN")
    };

    res.status(200).json({ message: "OK" });
});

// ==========================================
// 🔥 API 1.2: ESP32 GỬI MÃ THẺ RFID (POST)
// ==========================================
router.post("/rfid/scan", async (req, res) => {
    // Đã fix lỗi khai báo const thành let để có thể gán lại chuỗi
    let { rfidTag } = req.body;
    if (!rfidTag) return res.status(400).json({ message: "Không tìm thấy mã thẻ!" });
    
    rfidTag = rfidTag.toString().trim();
    
    try {
        const [user, product] = await Promise.all([
            User.findOne({ rfidCard: rfidTag }).select("-password"),
            Product.findOne({ rfidCard: rfidTag })
        ]);

        if (user) {
            latestRfidTag = { tag: rfidTag, type: "USER", data: user, scannedAt: Date.now() };
            console.log(`[RFID] Đã tìm thấy USER: ${user.name}`);
        } 
        else if (product) {
            latestRfidTag = { tag: rfidTag, type: "PRODUCT", data: product, scannedAt: Date.now() };
            console.log(`[RFID] Đã tìm thấy PRODUCT: ${product.name}`);
        } 
        else {
            latestRfidTag = { tag: rfidTag, type: "UNKNOWN", data: null, scannedAt: Date.now(), error: "Thẻ này chưa được đăng ký trong hệ thống!" };
            console.log(`[RFID] Thẻ vô danh: ${rfidTag}`);
        }

        res.status(200).json({ message: "Đã xử lý mã thẻ" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Lỗi Server" });
    }
});

// ==========================================
// 📌 API 2: FRONTEND LẤY DỮ LIỆU SENSOR (GET)
// ==========================================
router.get("/data", (req, res) => {
    res.status(200).json(latestSensorData);
});

// ==========================================
// 🔥 API 2.2: FRONTEND LẤY MÃ THẺ RFID MỚI NHẤT (GET)
// ==========================================
router.get("/rfid/latest", (req, res) => {
    try {
        if (!latestRfidTag.scannedAt) {
            return res.status(200).json({ rfidTag: null });
        }

        const isExpired = Date.now() - latestRfidTag.scannedAt > 30000;
        
        if (!latestRfidTag.tag || isExpired) {
            return res.status(200).json({ rfidTag: null });
        }
        
        res.status(200).json({ 
            rfidTag: latestRfidTag.tag,
            type: latestRfidTag.type,
            resultData: latestRfidTag.data, 
            error: latestRfidTag.error
        });
    } catch (error) {
        console.error("Lỗi sập Backend ở GET rfid/latest:", error);
        res.status(500).json({ message: "Lỗi Server" });
    }
});

router.delete("/rfid/clear", (req, res) => {
    latestRfidTag = { tag: null, scannedAt: null };
    console.log("[RFID] Đã dọn dẹp bộ nhớ thẻ tạm.");
    res.status(200).json({ message: "Đã xóa mã thẻ tạm thành công!" });
});

// ==========================================
// 📌 API 3: FRONTEND LẤY LỊCH SỬ (GET)
// ==========================================
router.get("/history", async (req, res) => {
    try {
        const { range } = req.query;
        let timeLimit = new Date();
        if (range === '1h') timeLimit.setHours(timeLimit.getHours() - 1);
        else if (range === '24h') timeLimit.setHours(timeLimit.getHours() - 24);
        else timeLimit.setHours(timeLimit.getHours() - 1);

        const history = await SensorData.find({ timestamp: { $gte: timeLimit } })
                                        .sort({ timestamp: 1 })
                                        .limit(100);

        const formattedData = history.map(item => ({
            time: new Date(item.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
            temp: item.temperature,
            hum: item.humidity
        }));

        res.status(200).json(formattedData);
    } catch (error) {
        res.status(500).json({ message: "Lỗi Server" });
    }
});

// ==========================================
// 🚀 API 4: FRONTEND GỬI LỆNH ĐIỀU KHIỂN (POST)
// ==========================================
router.post("/control", (req, res) => {
    const { fireSystem, securitySystem } = req.body;
    
    // Cập nhật trạng thái nếu Frontend gửi lên
    if (fireSystem !== undefined) iotControlState.fireSystem = fireSystem;
    if (securitySystem !== undefined) iotControlState.securitySystem = securitySystem;
    
    console.log(`[IOT CONTROL] Hệ thống cháy: ${iotControlState.fireSystem ? 'ON' : 'OFF'} | An ninh: ${iotControlState.securitySystem ? 'ON' : 'OFF'}`);
    res.status(200).json({ message: "Đã cập nhật lệnh điều khiển", state: iotControlState });
});

// ==========================================
// 🚀 API 5: ESP32 HỎI LỆNH ĐIỀU KHIỂN (GET)
// ==========================================
router.get("/control", (req, res) => {
    res.status(200).json(iotControlState);
});

module.exports = router;