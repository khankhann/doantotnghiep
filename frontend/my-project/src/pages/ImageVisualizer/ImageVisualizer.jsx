import  { useState, useEffect, useRef } from 'react';

// =========================================================================
// 🔥 ImageVisualizer Phiên Bản Nâng Cấp Pro (Hỗ trợ mọi Aspect Ratio)
// Tự động reverse tọa độ Letterbox từ 800x800 về ảnh gốc không viền xám
// =========================================================================
const ImageVisualizer = ({ imageUrl, aiResults }) => {
  // States để lưu trữ scaling factors và padding
  const [scalingData, setScalingData] = useState(null);
  const imgRef = useRef();

  // 🔥 Hiệu ứng nạp ảnh ngầm để lấy kích thước thật
  useEffect(() => {
    if (!imageUrl) {
      setScalingData(null);
      return;
    }

    // Chúng ta nạp ảnh vào bộ nhớ để lấy aspect ratio thật
    const img = new Image();
    img.onload = () => {
      const W_orig = img.width; // Kích thước thật của ảnh người dùng
      const H_orig = img.height;
      const W_scaled_canvas = 800; // Tiêu chuẩn Model Backend
      const H_scaled_canvas = 800;

      // 🔥 Thuật toán Reverse Engineering logic Sharp contain (letterbox) của backend
      // Backend ép ảnh về 800x800 dạng contain.
      // scale_factor: scale lớn nhất có thể để ảnh chui vào khung 800 mà ko mất góc
      const scale_factor = Math.min(W_scaled_canvas / W_orig, H_scaled_canvas / H_orig);
      
      // Kích thước thật của phần ảnh quần áo nằm trên canvas 800x800
      const W_inner = W_orig * scale_factor;
      const H_inner = H_orig * scale_factor;
      
      // Viền xám được thêm vào (mặc định AI chấm từ góc [0,0] của canvas 800)
      const left_padding = (W_scaled_canvas - W_inner) / 2;
      const top_padding = (H_scaled_canvas - H_inner) / 2;

      setScalingData({
        W_orig, H_orig, // Dữ liệu ảnh thật
        W_inner, H_inner, // Dữ liệu phần ảnh trên canvas
        left_padding, top_padding, // Viền xám lúc train
        canvas_w: W_scaled_canvas,
        canvas_h: H_scaled_canvas
      });
    };
    img.src = imageUrl;
  }, [imageUrl]);

  return (
    // 🔥 Wrapper ngoài cùng: Hiển thị đúng Aspect Ratio thật của ảnh gốc, KO CÓ VIỀN XÁM
    <div style={{ position: 'relative', width: '100%', display: 'inline-block' }}>
      
      {/* ẢNH GỐC HIỂN THỊ TRÊN WEB (Tự sụp khung theo chiều cao ảnh dọc) */}
      <img 
        ref={imgRef}
        src={imageUrl} 
        alt="Uploaded preview" 
        style={{ 
            width: '100%', 
            height: 'auto', // Tự sụp khung chiều dọc
            display: 'block' // Loại bỏ khoảng trắng inline
        }} 
      />

      {/* CHỈ VẼ KHUNG KHI ĐÃ CÓ DATA SCALING VÀ DATA AI */}
      {scalingData && aiResults && aiResults.length > 0 && aiResults.map((item, index) => {
        const box = item.ai_data.boundingBox; // [x1, y1, x2, y2] relative to 800x800 canvas
        const { W_inner, H_inner, left_padding, top_padding } = scalingData;

        // 🔥 PHÉP MAPPING SIÊU VIỆT: Chuyển tọa độ Canvas 800 sang tọa độ Ảnh Gốc
        
        // 1. Convert tọa độ AI (pixel 800x800) sang tọa độ pixel "thật" của vùng quần áo trên canvas (trừ đi viền xám)
        const raw_x1 = box[0] - left_padding;
        const raw_y1 = box[1] - top_padding;
        const raw_w  = box[2] - box[0];
        const raw_h  = box[3] - box[1];

        // 2. Chuyển sang tỷ lệ phần trăm (%) so với vùng ảnh thật đang hiển thị trên web
        const leftPercentCollapsed = (raw_x1 / W_inner) * 100;
        const topPercentCollapsed = (raw_y1 / H_inner) * 100;
        const widthPercentCollapsed = (raw_w / W_inner) * 100;
        const heightPercentCollapsed = (raw_h / H_inner) * 100;

        return (
          <div 
            key={index}
            style={{
              position: 'absolute',
              // Sử dụng tọa độ phần trăm (%) đã được mapping siêu chuẩn
              left: `${leftPercentCollapsed}%`,
              top: `${topPercentCollapsed}%`,
              width: `${widthPercentCollapsed}%`,
              height: `${heightPercentCollapsed}%`,
              border: '3px solid #00E676', // Màu xanh xanh nổi bật
              borderRadius: '4px',
              pointerEvents: 'none', // Xuyên click
              zIndex: 50, // Nổi bồng bềnh lên trên
              boxShadow: '0 0 8px rgba(0, 230, 118, 0.5)'
            }}
          >
            {/* Nhãn Confidence Label giữ nguyên */}
            <div style={{
              position: 'absolute',
              top: '-25px',
              left: '-3px',
              backgroundColor: '#00E676',
              color: '#000',
              padding: '2px 8px',
              fontSize: '12px',
              fontWeight: 'bold',
              borderRadius: '4px 4px 4px 0',
              whiteSpace: 'nowrap'
            }}>
              {item.ai_data.class_name} ({Math.round(item.ai_data.confidence * 100)}%)
            </div>
            {/* Nhãn Confidence Label */}
            <div style={{
              position: 'absolute',
              top: '-25px',
              left: '-3px',
              backgroundColor: '#00E676',
              color: '#000',
              padding: '2px 8px',
              fontSize: '12px',
              fontWeight: 'bold',
              borderRadius: '4px 4px 4px 0',
              whiteSpace: 'nowrap'
            }}>
              {item.ai_data.class_name} ({Math.round(item.ai_data.confidence * 100)}%)
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ImageVisualizer;