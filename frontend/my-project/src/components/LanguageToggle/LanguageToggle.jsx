import { useTranslation } from 'react-i18next';

function LanguageToggle() {
  const { i18n } = useTranslation();
  
  // Kiểm tra ngôn ngữ hiện tại
  const isVietnamese = i18n.language === 'vi';

  const toggleLanguage = () => {
    const newLang = isVietnamese ? 'en' : 'vi';
    i18n.changeLanguage(newLang);
    // Lưu sự lựa chọn của khách vào bộ nhớ trình duyệt
    localStorage.setItem('app_language', newLang); 
  };

  return (
    <div className="flex items-center gap-3">
      {/* Chữ EN */}
      <span className={`text-sm font-bold ${!isVietnamese ? 'text-blue-600' : 'text-gray-400'}`}>
        🇺🇸 EN
      </span>
      
      {/* Nút Gạt */}
      <button 
        type="button"
        onClick={toggleLanguage}
        className={`relative inline-flex h-6 w-12 items-center rounded-full transition-colors duration-300 ease-in-out focus:outline-none shadow-inner ${
          isVietnamese ? 'bg-red-500' : 'bg-blue-500'
        }`}
      >
        <span 
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-300 ease-in-out ${
            isVietnamese ? 'translate-x-7' : 'translate-x-1'
          }`}
        />
      </button>

      {/* Chữ VI */}
      <span className={`text-sm font-bold ${isVietnamese ? 'text-red-600' : 'text-gray-400'}`}>
        🇻🇳 VI
      </span>
    </div>
  );
}

export default LanguageToggle;