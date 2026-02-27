import { motion } from "framer-motion";

const PageTransition2 = ({ children }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: "100vw" }} // Bắt đầu: Nằm tít ngoài cùng bên phải
      animate={{ opacity: 1, x: 0 }}       // Hiện ra: Trượt vào giữa
      exit={{ opacity: 0, x: "-100vw" }}   // Thoát: Trượt tuột sang trái
      transition={{ type: "spring", stiffness: 100, damping: 15 }}
    >
      {children}
    </motion.div>
  );
};
export default PageTransition2;