const express = require("express");
const router = express.Router();
const multer = require("multer");
const ort = require("onnxruntime-node");
const sharp = require("sharp");
const Product = require("../models/Product");

//  THÊM THƯ VIỆN AXIOS ĐỂ GỌI API
const axios = require("axios");

// Dùng RAM để lưu tạm ảnh, giới hạn 20MB
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 20 * 1024 * 1024 },
});



let session = null;

async function loadAIModel() {
  try {
    session = await ort.InferenceSession.create("./best.onnx");
    console.log(
      "🧠 [AI_READY] Bộ não YOLOv8 (Model 800x800) đã nạp xong & Tối ưu!",
    );
  } catch (e) {
    console.error(" [AI_ERROR] Lỗi nạp model ONNX:", e);
  }
}
loadAIModel();

// DANH SÁCH CLASS CỦA MODEL
const CLASS_NAMES = [
  "AoKhoac",
  "AoTankTop",
  "AoThunTayDai",
  "AoThunTayNgan",
  "ChanVayDai",
  "ChanVayNgan",
  "QuanJean",
  "QuanShort",
  "QuanTay",
  "SoMiTayDai",
  "SoMiTayNgan",
];

// TỪ ĐIỂN DỊCH TÊN AI -> TÊN DATABASE
const DB_KEYWORD_MAP = {
  AoKhoac: "Áo khoác",
  AoTankTop: "Áo tank top",
  AoThunTayDai: "Áo thun tay dài",
  AoThunTayNgan: "Áo thun tay ngắn",
  ChanVayDai: "Chân váy dài",
  ChanVayNgan: "Chân váy ngắn",
  QuanJean: "Quần Jean",
  QuanShort: "Quần short",
  QuanTay: "Quần tây",
  SoMiTayDai: "Sơ mi tay dài",
  SoMiTayNgan: "Sơ mi tay ngắn",
};

// --- HÀM TÍNH IOU ---
function iou(box1, box2) {
  const x1 = Math.max(box1[0], box2[0]);
  const y1 = Math.max(box1[1], box2[1]);
  const x2 = Math.min(box1[2], box2[2]);
  const y2 = Math.min(box1[3], box2[3]);
  const intersection = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
  if (intersection === 0) return 0;

  const area1 = (box1[2] - box1[0]) * (box1[3] - box1[1]);
  const area2 = (box2[2] - box2[0]) * (box2[3] - box2[1]);
  return intersection / (area1 + area2 - intersection);
}

// --- HÀM NMS MỚI (CHUẨN CLASS-AWARE) ---
function classAwareNMS(boxes, scores, classes, iouThreshold = 0.45) {
  let indices = Array.from(scores.keys()).sort((a, b) => scores[b] - scores[a]);
  const keep = [];

  while (indices.length > 0) {
    const currentIdx = indices[0];
    keep.push(currentIdx);
    indices.shift();

    indices = indices.filter((idx) => {
      if (classes[currentIdx] === classes[idx]) {
        return iou(boxes[currentIdx], boxes[idx]) <= iouThreshold;
      }
      return true;
    });
  }
  return keep;
}

// ============================================================
// 🔥 HÀM TỰ ĐỘNG BẮN ẢNH LÊN ROBOFLOW (CHẠY NGẦM)
// ============================================================
async function uploadHardCaseToRoboflow(imageBuffer, originalName, suspectedClass) {
  try {
    console.log(` [AUTO_COLLECT] Đang ném "ca khó" lên Roboflow: ${originalName}...`);

    // 1. Chuyển ảnh sang Base64
    const base64Image = imageBuffer.toString("base64");
    
    // Mẹo: Gắn luôn cái tên Class mà AI đoán sai vào tên file để dễ tìm trên Roboflow
    const cleanName = originalName.replace(/[^a-zA-Z0-9.]/g, "");
    const fileName = `ca_kho_${suspectedClass}_${Date.now()}_${cleanName}`;

    // 2. Bắn API theo chuẩn "khó tính" của Roboflow
    const response = await axios({
      method: "POST",
      url: `https://api.roboflow.com/dataset/${process.env.ROBOFLOW_PROJECT}/upload`,
      params: {
        api_key: process.env.ROBOFLOW_API_KEY,
        name: fileName,
        split: "train" // Cho thẳng vào tập Train
      },
      data: base64Image, // Body CHỈ chứa duy nhất chuỗi Base64
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    if (response.data && response.data.success) {
      console.log(`✅ [AUTO_COLLECT] Đã up thành công lên mây! ID: ${response.data.id}`);
    } else {
      console.warn("⚠️ [AUTO_COLLECT] Roboflow báo nhận ảnh nhưng có cảnh báo:", response.data);
    }

  } catch (error) {
    console.error("❌ [AUTO_COLLECT_ERROR] Lỗi từ Roboflow:");
    if (error.response) {
      console.error("  -> Trạng thái:", error.response.status, error.response.data);
    } else {
      console.error("  -> Lỗi kết nối:", error.message);
    }
  }
}
// ============================================================

router.post("/visual-search", upload.single("image"), async (req, res) => {
  try {
    if (!req.file)
      return res.status(400).json({ message: "Không tìm thấy file ảnh!" });
    if (!session)
      return res.status(500).json({ message: "AI chưa khởi động!" });

    console.time(" Tổng thời gian xử lý AI");
    console.log("\n =========================================");
    console.log(" Bắt đầu quét ảnh...");

    // 1. XỬ LÝ ẢNH
    const { data } = await sharp(req.file.buffer)
      .resize(800, 800, {
        fit: "contain",
        background: { r: 114, g: 114, b: 114, alpha: 1 },
      })
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const float32Data = new Float32Array(3 * 800 * 800);
    for (let i = 0; i < 640000; i++) {
      float32Data[i] = data[i * 3] / 255.0;
      float32Data[i + 640000] = data[i * 3 + 1] / 255.0;
      float32Data[i + 1280000] = data[i * 3 + 2] / 255.0;
    }
    const tensor = new ort.Tensor("float32", float32Data, [1, 3, 800, 800]);

    // 2. INFERENCE
    const results = await session.run({ [session.inputNames[0]]: tensor });
    const outputTensor = results[session.outputNames[0]];
    const output = outputTensor.data;
    const dims = outputTensor.dims;

    const isTransposed = dims[1] > 1000;
    const numBoxes = isTransposed ? dims[1] : dims[2];
    const numElements = isTransposed ? dims[2] : dims[1];
    const numClasses = numElements - 4;

    // 3. GIẢI MÃ TENSOR (🔥 Tối ưu không cấp phát mảng rác)
    let allBoxes = [],
      allScores = [],
      allClassIndices = [];
    const scoreThreshold = 0.35; // Ngưỡng chốt đơn lý tưởng

    // 🔥 BIẾN TẠM ĐỂ BẮT CA KHÓ
    let hardCaseSuspectedClass = null;

    for (let i = 0; i < numBoxes; i++) {
      let maxS = 0;
      let classIdx = -1;

      for (let c = 0; c < numClasses; c++) {
        const score = isTransposed
          ? output[i * numElements + 4 + c]
          : output[(4 + c) * numBoxes + i];

        if (score > maxS) {
          maxS = score;
          classIdx = c;
        }
      }

      // 🔥 LOGIC BẮT "CA KHÓ" (Từ 30% đến 60%)
      // Nếu có món đồ nào rơi vào tầm ngập ngừng, đánh dấu để up data
      if (maxS >= 0.2 && maxS <= 0.5) {
        hardCaseSuspectedClass = CLASS_NAMES[classIdx] || "Unknown";
      }

      if (maxS > scoreThreshold) {
        const xc = isTransposed
          ? output[i * numElements + 0]
          : output[0 * numBoxes + i];
        const yc = isTransposed
          ? output[i * numElements + 1]
          : output[1 * numBoxes + i];
        const w = isTransposed
          ? output[i * numElements + 2]
          : output[2 * numBoxes + i];
        const h = isTransposed
          ? output[i * numElements + 3]
          : output[3 * numBoxes + i];

        allBoxes.push([xc - w / 2, yc - h / 2, xc + w / 2, yc + h / 2]);
        allScores.push(maxS);
        allClassIndices.push(classIdx);
      }
    }

    // 🔥 KÍCH HOẠT AUTO-COLLECT (CHẠY NGẦM - KHÔNG CÓ AWAIT)
    if (hardCaseSuspectedClass) {
      // Gửi buffer ảnh gốc + tên gốc + nhãn AI đang đoán nghi ngờ
      uploadHardCaseToRoboflow(
        req.file.buffer,
        req.file.originalname,
        hardCaseSuspectedClass,
      );
    }

    // CHẠY NMS
    const finalIndices = classAwareNMS(
      allBoxes,
      allScores,
      allClassIndices,
      0.45,
    );

    let detectedObjects = finalIndices.map((idx) => {
      const clsIdx = allClassIndices[idx];
      const conf = Math.round(allScores[idx] * 100) / 100;
      console.log(
        ` Nhận diện: ${CLASS_NAMES[clsIdx]} - Độ tin cậy: ${conf * 100}%`,
      );

      return {
        class_index: clsIdx,
        class_name: CLASS_NAMES[clsIdx] || "Đồ lạ",
        confidence: conf,
        boundingBox: [
          Math.round(allBoxes[idx][0]),
          Math.round(allBoxes[idx][1]),
          Math.round(allBoxes[idx][2]),
          Math.round(allBoxes[idx][3]),
        ],
      };
    });

    console.log(
      `📊 Tìm thấy tổng cộng ${detectedObjects.length} vật thể phân biệt!`,
    );

    if (detectedObjects.length === 0) {
      console.timeEnd("⏱️ Tổng thời gian xử lý AI");
      return res
        .status(200)
        .json({ detected: false, detected_count: 0, final_data: [] });
    }

    // 4. QUERIES DATABASE SONG SONG
    console.log("🎯 Đang lục tung Database...");
    const dbPromises = detectedObjects.map(async (obj) => {
      const searchKeyword = DB_KEYWORD_MAP[obj.class_name] || obj.class_name;
      const words = searchKeyword.split(" ");
      const regexPattern = words.map(word => `(?=.*${word})`).join('');
      const smartRegex = new RegExp(regexPattern, "i");
const requestedGender = req.body.gender || "All"
      const dbQuery = {
        $or: [
          { name: smartRegex },
          { category: smartRegex },
          { tags: smartRegex },
        ],
      };
      if (requestedGender !== "All") {
         dbQuery.gender = requestedGender; // Chú ý: chữ 'gender' này phải khớp với schema trong DB của fen nhé!
      }
      const productsInDb = await Product.find(dbQuery).limit(4).lean();
      return { ai_data: obj, products: productsInDb };
    });

    const finalResponseData = await Promise.all(dbPromises);

    console.timeEnd("⏱️ Tổng thời gian xử lý AI");

    return res.status(200).json({
      detected: true,
      detected_count: detectedObjects.length,
      final_data: finalResponseData,
    });
  } catch (error) {
    console.error("🔴 Lỗi Multi Visual Search:", error.message);
    res.status(500).json({ message: "Lỗi Server hoặc AI đang bị lỗi." });
  }
});

module.exports = router;
