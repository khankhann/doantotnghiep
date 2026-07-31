const express = require("express");
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require("@google/generative-ai");
const Product = require("../models/Product");
const router = express.Router();

// Khởi tạo AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// Sử dụng cấu hình JSON Mode của Gemini
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// Tắt bộ lọc nhạy cảm an toàn
const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
];

// ============================================================
// 1. POST /api/ai/analyze-body (PHÂN TÍCH VÓC DÁNG QUA ẢNH)
// ============================================================
router.post("/analyze-body", async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) return res.status(400).json({ message: "Thiếu dữ liệu ảnh" });

    const imagePart = {
      inlineData: { data: image.split(",")[1], mimeType: "image/jpeg" }
    };

    // BƯỚC 1: ĐỌC VÓC DÁNG TRẢ VỀ TIẾNG VIỆT CHUẨN
    const prompt1 = `
      Hãy nhìn hình ảnh người/ma-nơ-canh này và phân tích vóc dáng cơ thể.
      BẮT BUỘC trả về DUY NHẤT 1 cụm từ bằng Tiếng Việt trong các cụm sau: 
      'Mảnh mai', 'Cân đối', 'Đầy đặn', 'Thừa cân' hoặc 'Thể thao'. 
      Không viết thêm bất kỳ chữ nào khác.
    `;

    const result1 = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt1 }, imagePart] }],
      safetySettings
    });
    
    // Lấy tên vóc dáng Tiếng Việt
    const bodyType = result1.response.text().trim() || "Cân đối";

    // Lấy 30 sản phẩm từ DB làm nguyên liệu phối đồ
    const potentialProducts = await Product.find({})
      .limit(30)
      .select("_id name description category price images")
      .lean();

    // BƯỚC 2: TƯ VẤN THỜI TRANG VÀ CHỌN ĐỒ
    const prompt2 = `
      Bạn là một Stylist thời trang cao cấp đầy tinh tế và am hiểu về phối đồ.
      Khách hàng có vóc dáng qua hình ảnh là: "${bodyType}".

      Danh sách sản phẩm cửa hàng có sẵn:
      ${JSON.stringify(potentialProducts)}

      Nhiệm vụ:
      1. Đưa ra lời khuyên chi tiết về cách phối đồ (màu sắc, phom dáng áo/quần, chất liệu) để tôn lên ưu điểm vóc dáng của họ và che khuyết điểm nếu có.
      2. Mở đầu bằng một câu chào thân thiện (xưng "bạn" hoặc "fen").
      3. Chọn TỐI ĐA 6 ID sản phẩm trong danh sách phù hợp nhất với vóc dáng trên.

      Trả về đúng định dạng JSON:
      {
        "advice": "Lời khuyên thời trang đầy đủ ở đây...",
        "recommendedIds": ["id1", "id2", "id3"]
      }
    `;

    // Ép Gemini trả về JSON chuẩn
    const jsonModel = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json" }
    });

    const result2 = await jsonModel.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt2 }, imagePart] }],
      safetySettings
    });

    const aiData = JSON.parse(result2.response.text());

    // Lấy danh sách sản phẩm AI đã chọn
    let finalProducts = [];
    if (aiData.recommendedIds && aiData.recommendedIds.length > 0) {
      finalProducts = await Product.find({ _id: { $in: aiData.recommendedIds } });
    }
    // Fallback: Nếu AI chọn nhầm ID thì lấy ngẫu nhiên 4 sản phẩm
    if (finalProducts.length === 0) {
      finalProducts = potentialProducts.slice(0, 4);
    }

    res.status(200).json({
      bodyType: bodyType, // Giờ đây đã là Tiếng Việt: "Mảnh mai", "Cân đối",...
      advice: aiData.advice,
      products: finalProducts
    });

  } catch (error) {
    console.error("Lỗi AI Analyze Body:", error);
    res.status(500).json({ message: "Lỗi hệ thống khi phân tích hình ảnh." });
  }
});


router.post("/consultant", async (req, res) => {
  const { height, weight, gender, age, purpose } = req.body;

  try {
    if (!height || !weight) {
      return res.status(400).json({ message: "Vui lòng nhập chiều cao và cân nặng!" });
    }

    const heightM = height / 100;
    const bmi = parseFloat((weight / (heightM * heightM)).toFixed(1));
    
    // Gợi ý size
    let sizeRecommendation = "M";
    if (bmi < 18.5) sizeRecommendation = "S";
    else if (bmi >= 25 && bmi < 29.9) sizeRecommendation = "L";
    else if (bmi >= 30) sizeRecommendation = "XL";

    // Query sản phẩm phù hợp size và giới tính
    let query = { sizes: sizeRecommendation };
    if (gender && gender !== "all") {
      query.gender = { $regex: gender, $options: "i" };
    }

    let potentialProducts = await Product.find(query)
      .limit(30)
      .select("_id name description category price images")
      .lean();

    // Fallback nếu không có sp đúng size
    if (potentialProducts.length === 0) {
      potentialProducts = await Product.find({}).limit(20).select("_id name description category price images").lean();
    }

    const prompt = `
      Bạn là một chuyên gia tư vấn thời trang và định hình phong cách cá nhân đầy tâm lý.
      Thông tin khách hàng:
      - Giới tính: ${gender === "male" ? "Nam" : "Nữ"}
      - Độ tuổi: ${age || 22}
      - Chiều cao: ${height}cm, Cân nặng: ${weight}kg (Chỉ số BMI: ${bmi})
      - Mục đích mặc: "${purpose || "Đi chơi, hàng ngày"}"

      Danh sách sản phẩm sẵn có:
      ${JSON.stringify(potentialProducts)}

      Hãy viết một bài tư vấn chi tiết tuân thủ nghiêm ngặt các bước sau:
      1. **Xưng hô**: Thân thiện, gần gũi (dùng "fen" hoặc "bạn"). Gọi khách hàng bằng từ ngữ hợp độ tuổi/giới tính (Ví dụ: "chàng trai", "quý cô", "nàng",...).
      2. **Khen ngợi & Động viên**: Đưa ra lời khen tinh tế về nét đẹp vóc dáng (dù BMI cao hay thấp cũng luôn đề cao sự quyến rũ, mảnh mai hay tràn đầy năng lượng, tuyệt đối không dùng từ chê bai).
      3. **Tư vấn sức khỏe nhẹ nhàng**: Nhận xét ngắn gọn về chỉ số BMI và gợi ý chế độ ăn uống/tập luyện đơn giản để duy trì vóc dáng đẹp.
      4. **Tư vấn thời trang theo mục đích**: Phân tích chi tiết outfit, kiểu dáng áo quần và phối màu phù hợp đúng cho mục đích "${purpose}".
      5. **Lời chúc tích cực**: Truyền cảm hứng tự tin cho khách hàng.
      6. **Chọn sản phẩm**: Lựa chọn TỐI ĐA 8 ID sản phẩm trong danh sách phù hợp nhất với set đồ đã tư vấn.

      BẮT BUỘC trả về JSON theo đúng cấu trúc:
      {
        "advice": "Toàn bộ nội dung tư vấn hấp dẫn được trình bày ở đây...",
        "recommendedIds": ["id1", "id2"]
      }
    `;

    // Khởi tạo model ép chuẩn JSON
    const jsonModel = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json" }
    });

    const result = await jsonModel.generateContent(prompt);
    const aiData = JSON.parse(result.response.text());

    // Lấy chi tiết sản phẩm
    let finalProducts = [];
    if (aiData.recommendedIds && aiData.recommendedIds.length > 0) {
      finalProducts = await Product.find({ _id: { $in: aiData.recommendedIds } });
    }
    if (finalProducts.length === 0) {
      finalProducts = potentialProducts.slice(0, 6);
    }

    res.status(200).json({
      bmi: bmi,
      advice: aiData.advice,
      products: finalProducts
    });

  } catch (error) {
    console.error("AI Error (Consultant):", error);
    res.status(500).json({ message: "Lỗi hệ thống khi phân tích tư vấn." });
  }
});

module.exports = router;