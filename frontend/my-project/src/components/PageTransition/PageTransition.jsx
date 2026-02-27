import { motion } from "framer-motion";

const PageTransition = ({ children }) => {
  return (
    <motion.div
     initial={{ opacity: 0, filter: "blur(20px)" }} // Bắt đầu: Mờ tịt
      animate={{ opacity: 1, filter: "blur(0px)" }}  // Hiện ra: Rõ nét
      exit={{ opacity: 0, filter: "blur(20px)" }}
      transition={{ duration: 1, ease: "easeInOut" }}
    >
      {children}
    </motion.div>
  );
};

export default PageTransition;