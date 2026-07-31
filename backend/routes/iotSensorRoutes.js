const express = require("express");
const router = express.Router();
const axios = require("axios");
const User = require("../models/User");
const Product = require("../models/Product");
const CameraLog = require("../models/CameraLog");
const SensorData = require("../models/SensorData");

const cloudinary = require("cloudinary").v2;
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

let lastAlertTime = 0; 
const COOLDOWN_TIME = 100000; 

let latestSensorData = {
    temperature: 0,
    humidity: 0,
    tempStatus: "Chưa kết nối",
    humStatus: "Chưa kết nối",
    is_alert: false,
    updatedAt: null
};

let latestRfidTag = {
    tag: null,
    type: null,
    data: null,
    scannedAt: 0
};

let iotControlState = {
    fireSystem: true,
    securitySystem: true
};

let manualCaptureTrigger = false;
let latestImageUrl = null; 
let latestAlert = { isIntruder: false, timestamp: 0 };

const sendDiscordAlert = async (temp, hum, type = "WEATHER", imageUrl = null, customMessage = "") => {
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL; 
    
    if (!webhookUrl) return;

    try {
        let payload = { content: "" };

        if (type === "WEATHER") {
            payload.content = `NHIỆT ĐỘ KHO HÀNG \nNhiệt độ: ${temp}°C\nĐộ ẩm: ${hum}%`;
        } else if (type === "INTRUDER") {
            payload.content = ` CẢNH BÁO CHUYỂN ĐỘNG \n${customMessage || 'Cảm biến PIR phát hiện có chuyển động trong kho hàng'}`;
        } else if (type === "FIRE") {
            // Thêm @everyone để Discord hú thông báo đẩy cho cả team
            payload.content = ` PHÁT HIỆN CÓ CHÁY TẠI KHO @everyone\n${customMessage || 'tự động bơm nước'}`;
        }

        // Nhét ảnh vào Discord (nếu có)
        if (imageUrl) {
            payload.embeds = [
                {
                    title: "Ảnh chụp từ Camera An ninh",
                    color: type === "FIRE" ? 16711680 : 16753920, 
                    image: { url: imageUrl }
                }
            ];
        }
        
        await axios.post(webhookUrl, payload);
    } catch (error) {
        console.log(" [DISCORD] Lỗi:", error.message);
    }
};

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
            sendDiscordAlert(temp, hum, "WEATHER"); 
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

router.post("/rfid/scan", async (req, res) => {
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
            latestRfidTag = { tag: rfidTag, type: "UNKNOWN", data: null, scannedAt: Date.now(), error: "Thẻ này chưa được đăng ký!" };
            console.log(`[RFID] Thẻ vô danh: ${rfidTag}`);
        }

        res.status(200).json({ message: "Đã xử lý mã thẻ" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Lỗi Server" });
    }
});
 
router.get("/data", (req, res) => {
    res.status(200).json(latestSensorData);
}); 
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

router.post("/control", (req, res) => {
    const { fireSystem, securitySystem } = req.body;
    
    if (fireSystem !== undefined) iotControlState.fireSystem = fireSystem;
    if (securitySystem !== undefined) iotControlState.securitySystem = securitySystem;
    
    console.log(`[IOT CONTROL] Cháy: ${iotControlState.fireSystem ? 'ON' : 'OFF'} | An ninh: ${iotControlState.securitySystem ? 'ON' : 'OFF'}`);
    res.status(200).json({ message: "Đã cập nhật lệnh điều khiển", state: iotControlState });
});

router.get("/control", (req, res) => {
    res.status(200).json(iotControlState);
});

router.post("/alert", async (req, res) => {
  const { isFire, isIntruder, message } = req.body;
  
  const io = req.io;

  if (!io) {
    console.log("Lỗi: Socket.io chưa được khởi tạo trên Server");
  }

  // 1. Bắn sự kiện lên Frontend (qua Socket)
  if (isFire && io) {
    io.emit("iot_alert", { 
      type: "fire", 
      message: message || "PHÁT HIỆN CÓ CHÁY, HỆ THỐNG ĐANG BƠM NƯỚC!" 
    });
  }
  
  if (isIntruder && io) {
    io.emit("iot_alert", { 
      type: "intruder", 
      message: message || " CẢNH BÁO: CÓ NGƯỜI VỪA ĐI NGANG QUA KHU VỰC" 
    });
  }

  // 2. Bắn thông báo sang DISCORD
  if (isFire) {
      await sendDiscordAlert(0, 0, "FIRE", null, message);
  }
  
  if (isIntruder) {
      await sendDiscordAlert(0, 0, "INTRUDER", null, message);
  }

  res.status(200).json({ success: true, message: "Đã phát báo động" });
});

router.post("/clear-alert", (req, res) => {
    latestAlert = { isIntruder: false, timestamp: 0 };
    res.status(200).json({ message: "Đã tắt cảnh báo" });
});

router.post("/camera/trigger", (req, res) => {
    manualCaptureTrigger = true; 
    console.log("📸 [WEB] Đã ra lệnh chụp ảnh thủ công!");
    res.status(200).json({ message: "Đã gửi lệnh xuống mạch" });
});

router.get("/camera/command", (req, res) => {
    res.status(200).json({ captureNow: manualCaptureTrigger });
    if (manualCaptureTrigger) manualCaptureTrigger = false; 
});

router.post("/camera/upload", async (req, res) => {
    const { imageBase64, reason } = req.body;
    if (!imageBase64) return res.status(400).json({ message: "Không có dữ liệu ảnh" });

    try {
        console.log(" Đang upload ảnh lên Cloudinary...");
        const fileStr = `data:image/jpeg;base64,${imageBase64}`;
        
        // Upload lên thư mục "IOT_KHO" trên Cloudinary
        const uploadResponse = await cloudinary.uploader.upload(fileStr, {
            folder: "IOT_KHO",
        });

        latestImageUrl = uploadResponse.secure_url;
        console.log(` [CAMERA] Đã upload Cloudinary! Link: ${latestImageUrl}`);
        
        await CameraLog.create({
            imageUrl: latestImageUrl,
            reason: reason 
        });
        
        if (reason === "Co_Trom") {
             sendDiscordAlert(0, 0, "INTRUDER", latestImageUrl);
        }
        
        res.status(200).json({ message: "Upload thành công", url: latestImageUrl });
    } catch (error) {
        console.error("❌ Lỗi upload Cloudinary:", error);
        res.status(500).json({ message: "Upload thất bại" });
    }
});

router.get("/camera/latest", (req, res) => {
    res.status(200).json({ 
        image: latestImageUrl, 
        alertStatus: latestAlert
    });
});

module.exports = router;