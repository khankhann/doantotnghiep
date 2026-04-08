const express = require("express");
const router = express.Router();
const axios = require("axios");

// 📦 IMPORT MODEL MONGODB (Nhớ phải có file models/SensorData.js như bước trước tui chỉ nha)
const SensorData = require("../models/SensorData");

// 1. BIẾN CHỐNG SPAM DISCORD
let lastAlertTime = 0; 
const COOLDOWN_TIME = 300000; // 5 phút

// 2. BỘ NHỚ TẠM (Lưu trạng thái cho React hiển thị Real-time)
let latestSensorData = {
    temperature: 0,
    humidity: 0,
    tempStatus: "Chưa kết nối",
    humStatus: "Chưa kết nối",
    is_alert: false,
    updatedAt: null
};

// 3. HÀM BẮN THÔNG BÁO DISCORD
const sendDiscordAlert = async (temp, hum) => {
    const webhookUrl = "https://discord.com/api/webhooks/1480838841538445354/3H5LV3LdzSD7rb1t0EpveBmiAvO_taz8oTbeXP_tqZOVQpiu2L1As1VjSgGRwtz_HFg_"; 
    try {
        await axios.post(webhookUrl, {
            content: `🚨 **BÁO ĐỘNG KHO HÀNG E-COMMERCE** 🚨\n🌡️ Nhiệt độ đang bốc hỏa: **${temp}°C**\n💦 Độ ẩm: **${hum}%**\n@everyone Sếp ra kiểm tra kho ngay kẻo cháy hết quần áo!!! 🔥`
        });
        console.log("✅ [DISCORD] Đã bắn tin nhắn cảnh báo thành công!");
    } catch (error) {
        console.log("🔴 [DISCORD] Lỗi gửi thông báo:", error.message);
    }
};

// ==========================================
// 📌 API 1: ESP32 GỬI DATA LÊN ĐÂY (POST)
// ==========================================
router.post("/sensor", async(req, res) => {
    const temp = parseFloat(req.body.temperature);
    const hum = parseFloat(req.body.humidity);

    if (isNaN(temp) || isNaN(hum)) {
        return res.status(400).json({ message: "Thiếu dữ liệu hoặc định dạng bị lỗi" });
    }

    const MAX_TEMP = 32; 
    const MAX_HUM = 65;  
    const isAlertNow = temp > MAX_TEMP || hum > MAX_HUM;

    let tempStatus = temp > MAX_TEMP ? "ĐANG CAO 🔥" : "Bình thường 🟢";
    let humStatus = hum > MAX_HUM ? "ĐANG CAO 💦" : "Bình thường 🟢";

    // BÓP CÒ BẮN DISCORD
    if (isAlertNow) {
        const currentTime = Date.now();
        if (currentTime - lastAlertTime > COOLDOWN_TIME) {
            sendDiscordAlert(temp, hum); 
            lastAlertTime = currentTime; 
        }
    }

    // 🔥 NÂNG CẤP: LƯU DATA VÀO DATABASE MONGODB ĐỂ VẼ BIỂU ĐỒ LỊCH SỬ
    try {
        await SensorData.create({
            temperature: temp,
            humidity: hum,
            is_alert: isAlertNow
        });
    } catch (dbError) {
        console.error("🔴 Lỗi lưu Database:", dbError.message);
    }

    // Cập nhật lên bộ nhớ tạm cho Frontend (React) Real-time
    latestSensorData = {
        temperature: temp,
        humidity: hum,
        tempStatus: tempStatus,
        humStatus: humStatus,
        is_alert: isAlertNow,
        updatedAt: new Date().toLocaleTimeString("vi-VN")
    };

    console.log(`[${latestSensorData.updatedAt}] 🏭 Cập nhật kho: Nhiệt độ ${temp}°C | Độ ẩm ${hum}%`);

    res.status(200).json({ 
        message: "Đã nhận dữ liệu IoT",
        is_alert: isAlertNow 
    });
});

// ==========================================
// 📌 API 2: FRONTEND LẤY DỮ LIỆU REAL-TIME (GET)
// ==========================================
router.get("/data", (req, res) => {
    res.status(200).json(latestSensorData);
});

// ==========================================
// 📌 API 3: FRONTEND LẤY LỊCH SỬ VẼ BIỂU ĐỒ (GET)
// ==========================================
router.get("/history", async (req, res) => {
    try {
        const { range } = req.query; // Nhận '1h', '24h', '7d' từ React
        let timeLimit = new Date();

        if (range === '1h') timeLimit.setHours(timeLimit.getHours() - 1);
        else if (range === '24h') timeLimit.setHours(timeLimit.getHours() - 24);
        else if (range === '7d') timeLimit.setDate(timeLimit.getDate() - 7);
        else timeLimit.setHours(timeLimit.getHours() - 1); // Mặc định 1h

        // Tìm trong DB các dữ liệu mới hơn mốc timeLimit, sắp xếp cũ -> mới
        const history = await SensorData.find({ timestamp: { $gte: timeLimit } })
                                        .sort({ timestamp: 1 })
                                        .limit(100); // Lấy tối đa 100 điểm cho web mượt

        // Ép kiểu cho Recharts bên React đọc được
        const formattedData = history.map(item => ({
            time: new Date(item.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
            temp: item.temperature,
            hum: item.humidity
        }));

        res.status(200).json(formattedData);
    } catch (error) {
        console.error("🔴 Lỗi kéo lịch sử DB:", error);
        res.status(500).json({ message: "Lỗi Server" });
    }
});

module.exports = router;