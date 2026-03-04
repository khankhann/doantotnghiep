import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BsChatDotsFill } from "react-icons/bs";
import { IoCloseOutline, IoArrowBackOutline, IoSend } from "react-icons/io5";
import { RiRobot2Line, RiUserSmileLine, RiGroupLine } from "react-icons/ri";
import { useDispatch, useSelector } from "react-redux";
import { 
  addAdminMessage, 
  addAIMessage, 
  fetchChatHistory, 
  sendMessageToAI, 
  fetchAdminList, 
  fetchUserList 
} from "@redux/slices/chatSlice";
import socket from "@components/socket/Socket";
import moment from "moment";
import { toast } from "sonner"; 

function ChatWidget() {
  const dispatch = useDispatch();
  const [isOpen, setIsOpen] = useState(false);
  const [chatMode, setChatMode] = useState("select"); 
  const [selectedAdmin, setSelectedAdmin] = useState(null); 
  const [selectedUserToChat, setSelectedUserToChat] = useState(null);
  const [inputText, setInputText] = useState("");
  const [unreadCount, setUnreadCount] = useState(0); 
  const [isLoadingHistory, setIsLoadingHistory] = useState(false); 
  const messagesEndRef = useRef(null);

  // 🔥 Ref chặn tin nhắn trùng lặp (Duplicate)
  const lastSentTextRef = useRef(""); 

  const { aiMessages, adminMessages, isAITyping, adminList, userList } = useSelector((state) => state.chat);
  const { user } = useSelector((state) => state.auth);

  const currentMessages = chatMode === "ai" ? aiMessages : adminMessages;

  // 1. Kết nối Socket & Tham gia phòng (Room)
  useEffect(() => {
    if (!user?._id || !socket) return;
    const joinRooms = () => {
      socket.emit("join_room", user._id); 
      if (user.role === "admin") {
        socket.emit("admin_join");
      }
    };
    joinRooms();
    socket.on("connect", joinRooms); 
    return () => socket.off("connect", joinRooms);
  }, [user]);

  // 2. Tự động cuộn xuống & Đếm tin nhắn chưa đọc
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    const lastMsg = adminMessages[adminMessages.length - 1];
    const myRole = user?.role === "admin" ? "admin" : "customer";
    if (!isOpen && lastMsg && lastMsg.sender !== myRole) {
      setUnreadCount(prev => prev + 1);
    }
  }, [adminMessages, isOpen, user, isAITyping]);

  // 3. Xử lý nhận tin nhắn & Lọc ID an toàn
  useEffect(() => {
    const handleMsg = (newMsg) => {
      const msgAdminId = newMsg.adminId && typeof newMsg.adminId === 'object' ? newMsg.adminId._id : newMsg.adminId;
      const msgUserId = newMsg.user && typeof newMsg.user === 'object' ? newMsg.user._id : (newMsg.user || newMsg.senderId);

      let isFromMe = false;

      if (user?.role === "admin") {
        // 🔥 Lọc: Trùng ID Admin HOẶC Trùng nội dung vừa gõ
        isFromMe = (msgAdminId && String(msgAdminId) === String(user?._id)) || 
                   (newMsg.sender === "admin" && newMsg.text === lastSentTextRef.current);
      } else {
        isFromMe = newMsg.sender === "customer" && String(msgUserId) === String(user?._id);
      }

      if (!isFromMe) {
        dispatch(addAdminMessage(newMsg));
      } else {
        lastSentTextRef.current = ""; // Reset Ref sau khi chặn thành công
      }
    };

    socket.on("receive_msg_from_admin", handleMsg);
    socket.on("receive_msg_from_user", handleMsg);
    
    return () => {
      socket.off("receive_msg_from_admin", handleMsg);
      socket.off("receive_msg_from_user", handleMsg);
    };
  }, [dispatch, user]);

  const fetchHistoryWithLoading = async (targetId) => {
    setIsLoadingHistory(true);
    await dispatch(fetchChatHistory(targetId)); 
    setIsLoadingHistory(false);
  };

  const handleSelectMode = (mode) => {
    if (!user) return toast.error("Vui lòng đăng nhập!");
    if (mode === "ai") setChatMode("ai");
    else if (mode === "admin") {
      if (user?.role !== "admin") {
        setSelectedAdmin({ name: "Tổng đài CSKH", _id: "general" });
        setChatMode("admin");
        fetchHistoryWithLoading("general"); 
      } else {
        setChatMode("select_admin");
        dispatch(fetchAdminList());
      }
    } else if (mode === "user") {
      setChatMode("select_user");
      dispatch(fetchUserList());
    }
  };

  const handleStartChatWithAdmin = (adm) => {
    setSelectedAdmin(adm);
    setSelectedUserToChat(null); 
    setChatMode("admin");
    fetchHistoryWithLoading(adm._id);
  };

  const handleStartChatWithUser = (target) => {
    setSelectedUserToChat(target);
    setSelectedAdmin(null); 
    setChatMode("chat_user");
    fetchHistoryWithLoading(target._id);
  };

  // 4. Gửi tin nhắn & Hiện thị tức thì (Optimistic UI)
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const currentText = inputText;
    lastSentTextRef.current = currentText; // 🔥 Ghi nhớ để chặn trùng lặp
    setInputText(""); 
    
    const tempId = Date.now().toString(); 

    if (chatMode === "ai") {
      dispatch(addAIMessage({ _id: tempId, sender: "customer", text: currentText, createdAt: new Date().toISOString() }));
      dispatch(sendMessageToAI(currentText));
    } else {
      const myRole = user?.role === "admin" ? "admin" : "customer";
      const targetId = chatMode === "admin" ? selectedAdmin?._id : selectedUserToChat?._id;
      
      const tempMsg = {
        _id: tempId, 
        text: currentText,
        sender: myRole,
        user: myRole === "admin" ? targetId : user?._id, 
        adminId: myRole === "admin" ? user?._id : null, 
        createdAt: new Date().toISOString()
      };
      
      dispatch(addAdminMessage(tempMsg)); 

      if (user?.role !== "admin" && chatMode === "admin") {
        socket.emit("send_msg_to_admin", { userId: user._id, message: currentText });
      } else {
        socket.emit("send_msg_to_user", { 
          targetUserId: targetId, 
          message: currentText,
          adminId: user._id 
        });
      }
    }
    
    setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const getSafeId = (idData) => {
    if (!idData) return "";
    if (typeof idData === "object" && idData._id) return String(idData._id);
    return String(idData);
  };

  const handleBackDirectly = () => {
    setChatMode("select");
    setSelectedAdmin(null);
    setSelectedUserToChat(null);
  };

  let headerTitle = "Hỗ trợ khách hàng";
  if (chatMode === "ai") headerTitle = "Trợ lý AI";
  else if (chatMode === "select_admin") headerTitle = "Chọn Admin để chat";
  else if (chatMode === "select_user") headerTitle = "Danh sách Khách hàng";
  else if (chatMode === "admin") headerTitle = selectedAdmin?.name || "Admin";
  else if (chatMode === "chat_user") headerTitle = selectedUserToChat?.name || "Khách hàng";

  let placeholderText = "Nhập tin nhắn...";
  if (chatMode === "ai") {
    placeholderText = user?.role === "admin" ? "Hỏi doanh thu, đơn hàng hôm nay..." : "Hỏi gợi ý phối đồ, lịch sử mua...";
  }

  return (
    <>
      <button onClick={() => {setIsOpen(!isOpen); if(!isOpen) setUnreadCount(0);}} className="fixed bottom-6 left-6 z-[20] w-14 h-14 bg-gray-900 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-all active:scale-95">
        {isOpen ? <IoCloseOutline size={28} /> : <BsChatDotsFill size={24} />}
        {!isOpen && unreadCount > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-6 h-6 rounded-full flex items-center justify-center border-2 border-white animate-bounce">{unreadCount}</span>}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0, y: 50, scale: 0.8 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.8 }} transition={{ type: "spring", stiffness: 250, damping: 20 }} className="fixed bottom-24 left-6 z-[100] w-[340px] sm:w-[380px] h-[520px] bg-white rounded-2xl shadow-2xl border flex flex-col overflow-hidden">
            
            <div className="bg-gray-900 p-4 text-white flex items-center justify-between shadow-sm z-10">
              <div className="flex items-center gap-2">
                {chatMode !== "select" && <IoArrowBackOutline className="cursor-pointer hover:bg-white/20 p-1 rounded-full transition-colors" size={26} onClick={handleBackDirectly} />}
                <h3 className="font-bold text-base tracking-wide flex items-center gap-2">{headerTitle}</h3>
              </div>
              <IoCloseOutline size={26} className="cursor-pointer hover:bg-white/20 p-1 rounded-full transition-colors" onClick={() => setIsOpen(false)} />
            </div>

            <div className="flex-1 bg-[#f8f9fa] flex flex-col relative overflow-hidden">
              <AnimatePresence mode="wait">
                {chatMode === "select" ? (
                  <motion.div key="select" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-5 flex flex-col gap-4 justify-center h-full">
                    <button onClick={() => handleSelectMode("ai")} className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-xl hover:border-gray-900 transition-all group">
                      <div className="bg-gray-100 p-3 rounded-full group-hover:bg-gray-900 group-hover:text-white transition-colors"><RiRobot2Line size={26} /></div>
                      <div className="text-left"><h4 className="font-bold text-gray-800">Trợ lý AI</h4><p className="text-[12px] text-gray-500">Tư vấn mua sắm 24/7</p></div>
                    </button>
                    <button onClick={() => handleSelectMode("admin")} className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-xl hover:border-gray-900 transition-all group">
                      <div className="bg-gray-100 p-3 rounded-full group-hover:bg-gray-900 group-hover:text-white transition-colors"><RiUserSmileLine size={26} /></div>
                      <div className="text-left"><h4 className="font-bold text-gray-800">Chat với Admin</h4><p className="text-[12px] text-gray-500">Hỗ trợ trực tiếp</p></div>
                    </button>
                    {user?.role === "admin" && (
                      <button onClick={() => handleSelectMode("user")} className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-xl hover:border-gray-900 transition-all group">
                        <div className="bg-gray-100 p-3 rounded-full group-hover:bg-gray-900 group-hover:text-white transition-colors"><RiGroupLine size={26} /></div>
                        <div className="text-left"><h4 className="font-bold text-gray-800">Cộng đồng</h4><p className="text-[12px] text-gray-500">Quản lý khách hàng</p></div>
                      </button>
                    )}
                  </motion.div>
                ) : (
                  <motion.div key="chatbox" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-full w-full">
                    <div className="flex-1 overflow-y-auto p-4 space-y-5 scrollbar-thin relative">
                      <AnimatePresence initial={false}>
                        {currentMessages
                          ?.filter(msg => {
                            if (chatMode === "ai") return true;
                            const partnerId = String(chatMode === "admin" ? (selectedAdmin?._id || "general") : selectedUserToChat?._id);
                            const msgUserId = getSafeId(msg.user);
                            const msgAdminId = getSafeId(msg.adminId);
                            if (msgUserId === partnerId || msgAdminId === partnerId) return true;
                            if (!msgAdminId && msgUserId === String(user?._id)) return true;
                            return false; 
                          })
                          .map((msg, index) => {
                            // Phân định bong bóng Trái/Phải
                            let isMe = false;
                            const msgAdminId = getSafeId(msg.adminId);
                            const msgUserId = getSafeId(msg.user);

                            if (chatMode === "ai") {
                              isMe = msg.sender === "customer";
                            } else if (user?.role === "admin") {
                              if (msg.sender === "customer") isMe = false; 
                              else isMe = msgAdminId ? msgAdminId === String(user?._id) : msgUserId !== String(user?._id);
                            } else {
                              isMe = msg.sender === "customer"; 
                            }

                            return (
                              <motion.div key={msg._id || `msg-${index}`} initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.2 }} className={`flex flex-col mb-1 ${isMe ? "items-end" : "items-start"}`}>
                                <div className={`max-w-[80%] flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                                  <div className={`px-4 py-2.5 text-[13px] shadow-sm transition-all duration-300 ${isMe ? "bg-gray-900 text-white rounded-[20px] rounded-br-none" : "bg-white text-gray-800 border border-gray-100 rounded-[20px] rounded-bl-none"}`}>
                                    {msg.text}
                                  </div>
                                  <span className="text-[10px] text-gray-400 mt-1 px-1">{moment(msg.createdAt).format("HH:mm")}</span>
                                </div>
                              </motion.div>
                            )
                          })}
                      </AnimatePresence>
                      <div ref={messagesEndRef} />
                    </div>
                    <form onSubmit={handleSendMessage} className="p-3 bg-white border-t flex gap-2 items-center">
                      <input type="text" value={inputText} onChange={(e) => setInputText(e.target.value)} placeholder={placeholderText} className="flex-1 bg-gray-100 border-none rounded-full px-4 py-2.5 text-[13px] outline-none focus:ring-1 focus:ring-gray-900 transition-all" />
                      <button type="submit" disabled={!inputText.trim() || (chatMode === "ai" && isAITyping)} className="text-gray-900 p-2 hover:scale-110 disabled:opacity-50 transition-all"><IoSend size={22} /></button>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default ChatWidget;