import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

function ButtonBackTop() {
  const [isVisible, setIsVisible] = useState(false);

  const toggleVisible = () => {
    if (window.scrollY > 300) {
      setIsVisible(true);
      console.log("hon 300");
    } else {
      setIsVisible(false);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    window.addEventListener("scroll", toggleVisible);

    return () => window.removeEventListener("scroll", toggleVisible);
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className={`fixed bottom-12 right-6 z-20 py-4 px-2.5 bg-black/40 text-white rounded-md shadow-2xl transition-all duration-500 ease-out text-xs font-bold tracking-[0.2em] uppercase
        ${
          isVisible
            ? "opacity-100 translate-y-0 hover:-translate-y-2 hover:bg-gray-800 hover:shadow-[0_10px_20px_rgba(0,0,0,0.3)]" // Trạng thái HIỆN + Hiệu ứng khi hover
            : "opacity-0 translate-y-12 transition-all duration-300 pointer-events-none" // Trạng thái ẨN (tàng hình, tụt xuống 12 đơn vị và không cho bấm)
        }
      `}
          // 👇 ÉP CHỮ NẰM DỌC BẰNG STYLE NÀY
          style={{ writingMode: "vertical-rl" }}
          onClick={scrollToTop}>
          Back to top
        </motion.button>
      )}
    </AnimatePresence>
  );
}

export default ButtonBackTop;
