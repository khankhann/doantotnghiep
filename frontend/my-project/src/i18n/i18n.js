import i18n from "i18next";
import { initReactI18next } from "react-i18next";

// 1. Dựng 2 cuốn từ điển tại đây (Sau này project lớn thì tách ra file JSON riêng)
const savedLanguage = localStorage.getItem("app_language") || "vi";
const resources = {
  en: {
    translation: {
      navbar: {
        men: "Men",
        women: "Women",
        topWear: "Top Wear",
        bottomWear: "Bottom Wear",
        admin: "Admin",
        mobileMenuTitle: "Menu",
      },
      sidebar: {
        dashboard: "Dashboard",
        users: "Users",
        products: "Products",
        orders: "Orders",
        logout: "Logout",
      },
      productTable: {
        title: "Product Management",
        btnAdd: "+ Add Product",
        colName: "Name",
        colPrice: "Price",
        colAction: "Action",
        btnEdit: "Edit",
        btnDelete: "Delete",
        empty: "No Products found.",
      },
      confirm: {
        deleteProduct: "Are you sure you want to delete this product?",
      },
    },
  },
  vi: {
    translation: {
      navbar: {
          men: "Nam",
          women: "Nữ",
          topWear: "Áo",
          bottomWear: "Quần",
          admin: "Quản trị",
          mobileMenuTitle: "Danh mục"
        },
      sidebar: {
        dashboard: "Bảng điều khiển",
        users: "Người dùng",
        products: "Sản phẩm",
        orders: "Đơn hàng",
        logout: "Đăng xuất",
      },
      productTable: {
        title: "Quản lý Sản phẩm",
        btnAdd: "+ Thêm sản phẩm",
        colName: "Tên SP",
        colPrice: "Giá",
        colAction: "Thao tác",
        btnEdit: "Sửa",
        btnDelete: "Xóa",
        empty: "Không tìm thấy sản phẩm nào.",
      },
      confirm: {
        deleteProduct: "Bạn có chắc chắn muốn xóa sản phẩm này không?",
      },
    },
  },
};
// 2. Khởi động máy phiên dịch
i18n.use(initReactI18next).init({
  resources,
  lng: savedLanguage, // Ngôn ngữ mặc định khi vừa vào web (để tiếng Việt cho máu)
  fallbackLng: "en", // Nếu từ nào chưa dịch tiếng Việt thì tự lấy tiếng Anh bù vào
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
