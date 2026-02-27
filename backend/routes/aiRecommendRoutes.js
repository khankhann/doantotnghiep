const express = require("express");
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require("@google/generative-ai");
const Product = require("../models/Product");
const router = express.Router();

// Khởi tạo AI (API Key lấy từ .env)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// --------------------------------------------------------------------------
// ROUTE 1: PHÂN TÍCH DÁNG NGƯỜI QUA ẢNH (Dành cho chức năng Visual Scan)
// POST /api/ai/analyze-body
// --------------------------------------------------------------------------
router.post("/analyze-body", async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) return res.status(400).json({ message: "Thiếu dữ liệu ảnh" });

    // Tắt bộ lọc nhạy cảm (như đã fix lúc nãy)
    const safetySettings = [
      { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    ];

    const imagePart = {
      inlineData: { data: image.split(",")[1], mimeType: "image/jpeg" }
    };

    // --- BƯỚC 1: NHÌN ẢNH ĐOÁN DÁNG NGƯỜI ---
    const prompt1 = "Đây là ảnh ma-nơ-canh/người mẫu họa báo. Hãy nhìn hình ảnh này và trả về DUY NHẤT 1 từ: 'Slim', 'Fit', hoặc 'Plus-size'. Không nói gì thêm.";
    const result1 = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt1 }, imagePart] }],
      safetySettings
    });
    const bodyType = result1.response.text().trim();

    // --- BƯỚC 2: LẤY SẢN PHẨM TỪ DB ---
    // (Lấy 30 sản phẩm bất kỳ để AI có dữ liệu lựa chọn, fen có thể thêm query lọc theo tag ở đây)
    const potentialProducts = await Product.find({})
      .limit(30)
      .select("_id name description category price images");

    // --- BƯỚC 3: YÊU CẦU AI VIẾT LỜI KHUYÊN DỰA TRÊN ẢNH VÀ CHỌN ĐỒ ---
    const prompt2 = `
      Bạn là chuyên gia tư vấn thời trang. Khách hàng có dáng người là: ${bodyType}.
      Dựa vào hình ảnh thực tế của khách hàng và danh sách sản phẩm sau:
      ${JSON.stringify(potentialProducts)}

      Nhiệm vụ:
      1. Đưa ra lời khuyên phối đồ tôn dáng dựa trên hình ảnh của họ.
      2. Chọn TỐI ĐA 4 ID sản phẩm phù hợp nhất.

      BẮT BUỘC trả về định dạng JSON (gộp câu chào thân thiện "Chào fen..." vào mục advice):
      {
        "advice": "Chào fen! Mình thấy từ ảnh chụp dáng fen là... Nên mặc...",
        "recommendedIds": ["id1", "id2"]
      }
    `;

    const result2 = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt2 }, imagePart] }],
      safetySettings
    });

    let aiResponseText = result2.response.text();
    
    // Bóc tách JSON an toàn (Bọc thép chống lỗi)
    const startIndex = aiResponseText.indexOf('{');
    const endIndex = aiResponseText.lastIndexOf('}');
    if (startIndex === -1 || endIndex === -1) {
      return res.status(500).json({ message: "AI trả lời lạc đề, không ra JSON!" });
    }

    const cleanJsonString = aiResponseText.substring(startIndex, endIndex + 1);
    const aiData = JSON.parse(cleanJsonString);

    // Lấy chi tiết sản phẩm AI đã chọn
    const finalProducts = await Product.find({ _id: { $in: aiData.recommendedIds } });

    // Trả về GIỐNG HỆT CẤU TRÚC BÊN NHẬP FORM
    res.status(200).json({
      bodyType: bodyType, // Trả về để UI hiện chữ Slim/Fit
      advice: aiData.advice, // Trả về lời khuyên
      products: finalProducts // Trả về danh sách đồ
    });

  } catch (error) {
    console.error("Lỗi AI Analyze Body:", error);
    res.status(500).json({ message: "AI không thể phân tích ảnh" });
  }
});

// --------------------------------------------------------------------------
// ROUTE 2: TƯ VẤN THỜI TRANG CHUYÊN SÂU (Dành cho chức năng nhập số đo & mục đích)
// POST /api/ai/consultant
// --------------------------------------------------------------------------
router.post("/consultant", async (req, res) => {
  const { height, weight, gender, age, purpose } = req.body;

  try {
    // 1. Tính BMI sơ bộ
    const heightM = height / 100;
    const bmi = (weight / (heightM * heightM)).toFixed(1);
    
    let sizeRecommendation = "M";
    if (bmi < 18.5) sizeRecommendation = "S";
    else if (bmi >= 25) sizeRecommendation = "L";


    let query = { sizes: sizeRecommendation };
    if (gender) {
      query.gender = { $regex: gender, $options: "i" }; // Lọc không phân biệt hoa thường
    }
    // 2. Lấy danh sách sản phẩm tiềm năng từ DB
    const potentialProducts = await Product.find({ sizes: sizeRecommendation })
      .limit(30)
      .select("_id name description category price images"); 

    if (potentialProducts.length === 0) {
      return res.status(404).json({ message: "Hiện không có sản phẩm nào phù hợp với size của bạn." });
    }

    // 3. Prompt Stylist
   const prompt = `
      Bạn là một chuyên gia tư vấn thời trang.
      Khách hàng là ${gender === "male" ? "một người đàn ông " : "một người phụ nữ"} với ${age} tuổi, chiều cao ${height}cm và cân nặng ${weight}kg.
      Khách hàng có BMI: ${bmi} (Cân nặng: ${weight}kg, Chiều cao: ${height}cm).
      Mục đích: "${purpose}".

      Danh sách sản phẩm sẵn có:
      ${JSON.stringify(potentialProducts)}

      Nhiệm vụ:
      1. Bắt đầu bằng một câu chào hỏi thật thân thiện và xưng hô là "bạn" hoặc "fen", cho biết người đó là giới tính nào mà xưng hô ví dụ (nam thì xưng anh chàng , quý ông , chàng trai , cậu trai, bé trai, chú ... tuỳ thuộc vào độ tuổi),
      đối với giới tính nữ thì xưng là "quý cô", "nàng", "cô gái", "bé gái", "chị", "mẹ", "bà" ... tuỳ thuộc vào độ tuổi.
      2. dựa trên chiều cao , cân nặng và giới tính hãy đưa ra lời khen về vóc dáng của khách hàng (VD: "Wow, bạn có chiều cao lý tưởng để mặc đẹp đó!" hoặc "Bạn có thân hình đầy đặn, rất quyến rũ đấy!"), hoặc nếu khách hàng có BMI hơi cao hoặc hơi thấp thì cũng đừng lo, hãy khen ngợi những điểm đẹp trên cơ thể họ và động viên họ (VD: "Bạn có thân hình đầy đặn, rất quyến rũ đấy!" hoặc "Bạn có vóc dáng mảnh mai, rất dễ phối đồ đó!"), đừng bao giờ chê bai hay nói về khuyết điểm của khách hàng dù chỉ là ẩn ý.
      3. Dựa trên chỉ số BMI đó hãy đánh giá sức khoẻ hiện tại của khách hàng (VD : "Bạn đang ở mức cân nặng bình thường, rất tốt!" hoặc "Bạn hơi thừa cân một chút, nhưng đừng lo, mình sẽ giúp bạn chọn đồ phù hợp nhé!"),
      đầu tiên đưa ra lời khuyên về sức khoẻ cách để cải thiện nếu cần thiết (VD: "Bạn có thể tập thêm cardio và ăn nhiều rau xanh hơn để giảm cân" hoặc "Bạn có thể bổ sung thêm các bữa ăn phụ giàu protein để tăng cân")
      4. Đưa ra lời khuyên thời trang (phân tích BMI và cách phối đồ cho mục đích "${purpose}").
      5. Nhấn mạnh vào mục đích của khách hàng để đưa ra lời khuyên phù hợp (VD: "Nếu bạn muốn đi biển, mình gợi ý bạn nên chọn những bộ đồ bơi có họa tiết nhỏ và màu sáng để tạo cảm giác thon gọn hơn" hoặc "Nếu bạn muốn đi làm, mình gợi ý bạn nên chọn những chiếc áo sơ mi có cổ và quần tây cạp cao để tôn lên vóc dáng của bạn").
      6. cuối cùng là viết lời chúc khách hàng, nếu quá cân hoặc ốm thì cũng đừng quên động viên họ nhé (VD: "Dù bạn có cân nặng như thế nào, mình tin rằng bạn vẫn có thể mặc đẹp và tự tin tỏa sáng với những gợi ý của mình!"). hoặc dáng cân đối thì cũng đừng quên khen ngợi và động viên họ nhé (VD: "Bạn có vóc dáng cân đối, rất dễ phối đồ đó! Mình tin rằng với những gợi ý của mình, bạn sẽ càng mặc đẹp hơn nữa đấy!").
      7. Chọn TỐI ĐA 8 ID sản phẩm phù hợp nhất.

      BẮT BUỘC trả về định dạng JSON theo đúng cấu trúc sau. 
      LƯU Ý QUAN TRỌNG: Gộp cả câu chào hỏi và lời khuyên vào chung mục "advice". KHÔNG được viết bất kỳ chữ nào nằm bên ngoài dấu ngoặc nhọn {}:
      {
        "advice": "Chào fen! Dựa trên chỉ số của fen thì... (ghi tiếp lời khuyên vào đây)",
        "recommendedIds": ["id1", "id2"]
      }
    `;
    // 4. Gọi AI và dọn dẹp kết quả
    const result = await model.generateContent(prompt);
    let aiResponseText = result.response.text();
    
    // Xử lý trường hợp AI trả về markdown code block
    aiResponseText = aiResponseText.replace(/```json/g, "").replace(/```/g, "").trim();
    
    const aiData = JSON.parse(aiResponseText);

    // 5. Lấy dữ liệu đầy đủ của các sản phẩm AI chọn
    const finalProducts = await Product.find({ _id: { $in: aiData.recommendedIds } });

    res.status(200).json({
      bmi: bmi,
      advice: aiData.advice,
      products: finalProducts
    });

  } catch (error) {
    console.error("AI Error (Consultant):", error);
    res.status(500).json({ message: "Lỗi khi phân tích tư vấn" });
  }
});

module.exports = router;