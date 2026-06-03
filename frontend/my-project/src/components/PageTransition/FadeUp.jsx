import { motion } from "framer-motion";

// Component này sẽ bọc bên ngoài bất kỳ thứ gì fen muốn nó nảy lên
function FadeUp ({ children, delay = 0 }) {
  return (
    <motion.div
      // 1. Trạng thái ban đầu: mờ và tụt xuống 50px
      initial={{ opacity: 0, y: 100 }} 
      
      // 2. Trạng thái khi lướt tới: rõ lên và về vị trí số 0
      whileInView={{ opacity: 1, y: 0 }} 
      
      // 3. Cấu hình viewport: 
      // once: true -> Chỉ nảy 1 lần khi lướt xuống, lướt lên lướt xuống lại ko bị giật giật
      // amount: 0.3 -> Lướt tới 30% phần tử thì mới bắt đầu nảy
      viewport={{ once: true, margin: "0px 0px -100px 0px" }} 
      
      // 4. Cấu hình độ mượt (chỉnh cái này để có độ mượt "chuẩn Apple")
      transition={{
        duration: 1.8, // Thời gian chạy (0.8 giây)
        delay: delay,  // Độ trễ (để làm hiệu ứng xuất hiện lần lượt)
        ease: [0.25, 1, 0.5, 1] // Hàm gia tốc chuẩn của Apple (lên nhanh rồi từ từ chậm lại)
      }}
    >
      {children}
    </motion.div>
  );
};

export default FadeUp;