import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IoCloseOutline, IoCameraOutline, IoCloudUploadOutline } from "react-icons/io5";
import { toast } from "sonner"; 
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { searchProductsByImage, clearVisualSearchResults, setUploadedImage } from "@redux/slices/visualSearchSlice"; 

const dataURLtoFile = (dataurl, filename) => {
  let arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
  bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
  while(n--){
      u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, {type:mime});
}

function VisualSearchModal({ isOpen, onClose }) {
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  
  // 🔥 STATE LƯU GIỚI TÍNH NGƯỜI DÙNG CHỌN
  const [selectedGender, setSelectedGender] = useState("All"); 

  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null); 

  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isLoading } = useSelector((state) => state.visualSearch);

  useEffect(() => {
    return () => stopCamera();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
        setSelectedImage(file);
        setPreviewUrl(URL.createObjectURL(file)); 
        const reader = new FileReader();
        reader.onloadend = () => dispatch(setUploadedImage(reader.result)); 
        reader.readAsDataURL(file);
    }
  };

  const startCamera = async () => {
    setIsCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment" } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      toast.error("Không thể mở Camera. Vui lòng kiểm tra quyền truy cập!");
      setIsCameraOpen(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;

    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

    const base64Image = canvas.toDataURL("image/jpeg");
    const file = dataURLtoFile(base64Image, "camera_capture.jpg");

    setSelectedImage(file);
    setPreviewUrl(base64Image);
    dispatch(setUploadedImage(base64Image));
    stopCamera();
  };

  const handleSearch = async () => {
    if (!selectedImage) return toast.error("Vui lòng chọn một bức ảnh!");

    const formData = new FormData();
    formData.append("image", selectedImage); 
    
    // 🔥 NHÉT THÊM GIỚI TÍNH VÀO FORM DATA ĐỂ GỬI CHO BACKEND
    formData.append("gender", selectedGender);

    navigate("/search-result"); 
    handleClose(); 

    try {
      await dispatch(searchProductsByImage(formData)).unwrap();
      toast.success("AI phân tích xong!");
    } catch (error) {
      toast.error(error || "AI đang bận hoặc có lỗi xảy ra. Thử lại sau nhé!");
    } 
  };

  const handleClose = () => {
    stopCamera(); 
    setSelectedImage(null);
    setPreviewUrl(null);
    setSelectedGender("All"); // Reset lại giới tính khi đóng Modal
    if (fileInputRef.current) fileInputRef.current.value = ""; 
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]"
          />
          <div className="fixed inset-0 flex items-center justify-center z-[9999] pointer-events-none px-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[24px] p-6 w-full max-w-[420px] shadow-2xl pointer-events-auto flex flex-col items-center relative overflow-hidden"
            >
              <button onClick={handleClose} className="absolute top-4 right-4 p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors text-gray-600 z-10">
                <IoCloseOutline size={24} />
              </button>

              <h3 className="text-xl font-bold text-gray-900 mb-2 mt-4">Tìm kiếm bằng Hình ảnh</h3>
              <p className="text-[13px] text-gray-500 mb-6 text-center px-4">
                Tải lên hoặc chụp hình ảnh trang phục bạn thích.
              </p>

              <div className="w-full relative">
                
                {isCameraOpen ? (
                  <div className="w-full flex flex-col items-center">
                    <div className="w-full h-64 bg-black rounded-2xl overflow-hidden relative">
                      <video 
                        ref={videoRef} 
                        autoPlay 
                        playsInline 
                        className="w-full h-full object-cover transform scale-x-[-1]" 
                      />
                    </div>
                    <div className="flex gap-4 mt-4 w-full">
                      <button onClick={stopCamera} className="flex-1 py-2 bg-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-300">
                        Hủy
                      </button>
                      <button onClick={capturePhoto} className="flex-1 py-2 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 flex items-center justify-center gap-2">
                        <IoCameraOutline size={20} /> Chụp ngay
                      </button>
                    </div>
                  </div>
                ) : previewUrl ? (
                  <div className="w-full h-64 border-2 border-gray-900 rounded-2xl overflow-hidden relative">
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="flex gap-3 w-full">
                    <div 
                      className="flex-1 h-32 border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all hover:border-gray-900 hover:bg-gray-50"
                      onClick={() => !isLoading && fileInputRef.current?.click()}
                    >
                      <IoCloudUploadOutline size={32} className="text-gray-400 mb-2" />
                      <span className="text-xs font-semibold text-gray-600">Thư viện</span>
                    </div>

                    <div 
                      className="flex-1 h-32 border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all hover:border-gray-900 hover:bg-gray-50"
                      onClick={() => !isLoading && startCamera()}
                    >
                      <IoCameraOutline size={32} className="text-gray-400 mb-2" />
                      <span className="text-xs font-semibold text-gray-600">Mở Camera</span>
                    </div>
                  </div>
                )}

                {isLoading && (
                  <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex flex-col items-center justify-center rounded-2xl z-10">
                     <div className="w-8 h-8 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin mb-2"></div>
                     <span className="text-xs font-bold text-gray-900 animate-pulse">AI đang phân tích...</span>
                  </div>
                )}
              </div>

              <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} disabled={isLoading} />

              {/* 🔥 KHU VỰC CHỌN GIỚI TÍNH (Chỉ hiện khi đã up ảnh và đang ko mở Cam) */}
              {previewUrl && !isCameraOpen && !isLoading && (
                 <div className="w-full mt-5">
                    <p className="text-[12px] font-bold text-gray-700 mb-2 text-center">BẠN ĐANG TÌM ĐỒ CHO:</p>
                    <div className="flex justify-center gap-2">
                        {['All', 'Men', 'Women'].map(gender => (
                            <button
                                key={gender}
                                onClick={() => setSelectedGender(gender)}
                                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                                    selectedGender === gender 
                                        ? 'bg-black text-white shadow-md' 
                                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                }`}
                            >
                                {gender === 'All' ? 'Tất cả' : gender === 'Men' ? 'Nam' : 'Nữ'}
                            </button>
                        ))}
                    </div>
                 </div>
              )}

              {!isCameraOpen && (
                <button
                  onClick={handleSearch}
                  disabled={!selectedImage || isLoading}
                  className="w-full py-3.5 bg-gray-900 text-white text-sm font-bold rounded-xl mt-4 transition-all hover:bg-black active:scale-95 disabled:opacity-50 disabled:pointer-events-none shadow-lg shadow-gray-900/20"
                >
                  {isLoading ? "Đang xử lý..." : "Tìm sản phẩm này"}
                </button>
              )}
              
              {previewUrl && !isLoading && !isCameraOpen && (
                 <button onClick={(e) => { e.stopPropagation(); setSelectedImage(null); setPreviewUrl(null); dispatch(clearVisualSearchResults()); setSelectedGender('All'); }} className="text-[12px] text-gray-500 underline mt-3 hover:text-gray-900">
                    Chọn ảnh khác
                 </button>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

export default VisualSearchModal;