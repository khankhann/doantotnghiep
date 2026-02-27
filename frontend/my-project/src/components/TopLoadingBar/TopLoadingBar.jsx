import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import NProgress from "nprogress";
import "nprogress/nprogress.css"; // CSS mặc định của thư viện

// Cấu hình đổi màu thanh loading thành màu đỏ cho ngầu (tùy chọn)
NProgress.configure({ showSpinner: false, speed: 400, minimum: 0.2 });

const TopLoadingBar = () => {
  const location = useLocation(); // Hook này sẽ bắt được mỗi khi URL thay đổi

  useEffect(() => {
    // Khi URL thay đổi -> Cho thanh loading chạy
    NProgress.start();
    
    // Giả lập thời gian load xong (Hoặc tắt ngay khi component render xong)
    const timeout = setTimeout(() => {
      NProgress.done();
    }, 1000); // Nửa giây sau tắt

    return () => {
      clearTimeout(timeout);
      NProgress.done(); // Chống lỗi memory leak
    };
  }, [location]); // Mỗi khi 'location' đổi, useEffect này sẽ chạy lại

  return null; // Component này chạy ngầm, không hiện ra HTML gì cả
};

export default TopLoadingBar;