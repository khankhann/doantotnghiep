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


// 🔥 IMPORT THƯ VIỆN TOAST (Tui đang dùng react-toastify, fen xài cái khác thì đổi tên import nha)
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

  // STATE CHO MODAL RỜI KHỎI TRÒ CHUYỆN (Vẫn giữ lại vì cái này cần thiết)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const { aiMessages, adminMessages, isAITyping, adminList, userList } = useSelector((state) => state.chat);
  const { user } = useSelector((state) => state.auth);

  const currentMessages = chatMode === "ai" ? aiMessages : adminMessages;

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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    const lastMsg = adminMessages[adminMessages.length - 1];
    const myRole = user?.role === "admin" ? "admin" : "customer";
    if (!isOpen && lastMsg && lastMsg.sender !== myRole) {
      setUnreadCount(prev => prev + 1);
    }
  }, [adminMessages, isOpen, user, isAITyping]);

  useEffect(() => {
    const handleMsg = (newMsg) => {
      let isFromMe = false;
      const msgAdminId = newMsg.adminId && typeof newMsg.adminId === 'object' ? newMsg.adminId._id : newMsg.adminId;
      const msgUserId = newMsg.user && typeof newMsg.user === 'object' ? newMsg.user._id : (newMsg.user || newMsg.senderId);

      if (user?.role === "admin") {
        isFromMe = msgAdminId && String(msgAdminId) === String(user?._id);
      } else {
        isFromMe = newMsg.sender === "customer" && String(msgUserId) === String(user?._id);
      }

      if (!isFromMe) {
        dispatch(addAdminMessage(newMsg));
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

  // ==========================================
  // 🔥 FIX: BẮN TOAST NHẸ NHÀNG KHI CHƯA ĐĂNG NHẬP
  // ==========================================
  const handleSelectMode = (mode) => {
    if (!user) {
      // Gọi Toast thay vì Modal rườm rà
      toast.warning("Vui lòng đăng nhập để bắt đầu trò chuyện nhé!", {
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: true,
      });
      return; 
    }
    
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

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const currentText = inputText;
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

  const handleBackClick = () => {
    if (chatMode === "admin" || chatMode === "chat_user") {
      setIsConfirmOpen(true);
    } else {
      setChatMode("select");
      setSelectedAdmin(null);
      setSelectedUserToChat(null);
    }
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
                {chatMode !== "select" && <IoArrowBackOutline className="cursor-pointer hover:bg-white/20 p-1 rounded-full transition-colors" size={26} onClick={handleBackClick} />}
                <h3 className="font-bold text-base tracking-wide flex items-center gap-2">
                  {headerTitle}
                </h3>
              </div>
              <IoCloseOutline size={26} className="cursor-pointer hover:bg-white/20 p-1 rounded-full transition-colors" onClick={() => setIsOpen(false)} />
            </div>

            <div className="flex-1 bg-[#f8f9fa] flex flex-col relative overflow-hidden">
              <AnimatePresence mode="wait">
                
                {chatMode === "select" ? (
                  <motion.div key="select" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-5 flex flex-col gap-4 justify-center h-full">
                    <button onClick={() => handleSelectMode("ai")} className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-xl hover:border-gray-900 hover:shadow-md transition-all group">
                      <div className="bg-gray-100 p-3 rounded-full text-gray-700 group-hover:bg-gray-900 group-hover:text-white transition-colors"><RiRobot2Line size={26} /></div>
                      <div className="text-left">
                        <h4 className="font-bold text-gray-800 text-base">{user?.role === "admin" ? "Trợ lý AI Quản trị" : "Trợ lý AI Mua sắm"}</h4>
                        <p className="text-[13px] text-gray-500 mt-0.5">{user?.role === "admin" ? "Hỏi doanh thu, thống kê đơn hàng" : "Hỏi lịch sử mua, tư vấn phối đồ"}</p>
                      </div>
                    </button>
                    <button onClick={() => handleSelectMode("admin")} className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-xl hover:border-gray-900 hover:shadow-md transition-all group">
                      <div className="bg-gray-100 p-3 rounded-full text-gray-700 group-hover:bg-gray-900 group-hover:text-white transition-colors"><RiUserSmileLine size={26} /></div>
                      <div className="text-left"><h4 className="font-bold text-gray-800 text-base">Chat với Admin</h4><p className="text-[13px] text-gray-500 mt-0.5">Hỗ trợ đơn hàng & kỹ thuật</p></div>
                    </button>
                    {user?.role === "admin" && (
                      <button onClick={() => handleSelectMode("user")} className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-xl hover:border-gray-900 hover:shadow-md transition-all group">
                        <div className="bg-gray-100 p-3 rounded-full text-gray-700 group-hover:bg-gray-900 group-hover:text-white transition-colors"><RiGroupLine size={26} /></div>
                        <div className="text-left"><h4 className="font-bold text-gray-800 text-base">Cộng đồng User</h4><p className="text-[13px] text-gray-500 mt-0.5">Quản lý & Kết nối khách hàng</p></div>
                      </button>
                    )}
                  </motion.div>
                ) 
                
                : (chatMode === "select_admin" || chatMode === "select_user") ? (
                  <motion.div key="list" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#f8f9fa]">
                    {(chatMode === "select_admin" ? adminList : userList)?.filter(u => String(u._id) !== String(user?._id)).map(u => (
                      <div key={u._id} onClick={() => chatMode === "select_admin" ? handleStartChatWithAdmin(u) : handleStartChatWithUser(u)} className="flex items-center justify-between p-3 bg-white border rounded-xl hover:border-gray-900 hover:shadow-md cursor-pointer transition-all group">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-sm bg-gray-900`}>{u.name.charAt(0).toUpperCase()}</div>
                          <div className="flex flex-col"><span className="text-sm font-bold text-gray-700">{u.name}</span><span className="text-[10px] text-gray-400">Trực tuyến</span></div>
                        </div>
                        <span className="text-[9px] bg-gray-900 text-white font-bold px-3 py-1.5 rounded-full uppercase group-hover:scale-105 transition-transform">Chat</span>
                      </div>
                    ))}
                  </motion.div>
                ) 
                
                : (
                  <motion.div key="chatbox" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-full w-full">
                    <div className="flex-1 overflow-y-auto p-4 space-y-5 scrollbar-thin scrollbar-thumb-gray-200 relative">
                      {isLoadingHistory ? (
                        <div className="flex items-center justify-center h-full">
                          <div className="text-gray-500 text-sm font-medium animate-pulse">Đang kết nối...</div>
                        </div>
                      ) : (
                        <AnimatePresence initial={false}>
                          {currentMessages
                            ?.filter(msg => {
                              if (chatMode === "ai") return true;
                              if (user?.role === "admin") {
                                const partnerId = String(chatMode === "admin" ? selectedAdmin?._id : selectedUserToChat?._id);
                                const msgUserId = getSafeId(msg.user);
                                const msgAdminId = getSafeId(msg.adminId);
                                if (msgUserId === partnerId) return true;
                                if (msgAdminId === partnerId) return true;
                                if (!msgAdminId && msgUserId === String(user?._id)) return true;
                                return false; 
                              }
                              return true;
                            })
                            .map((msg, index) => {
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
                              <motion.div 
                                key={msg._id || `msg-${index}`} 
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                transition={{ duration: 0.2 }}
                                className={`flex flex-col mb-1 ${isMe ? "items-end" : "items-start"}`}
                              >
                                <div className={`max-w-[80%] flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                                  <div className={`px-4 py-2.5 text-[13px] shadow-sm transition-all duration-300 ${
                                    isMe 
                                      ? "bg-gray-900 text-white rounded-[20px] rounded-br-none" 
                                      : "bg-white text-gray-800 border border-gray-100 rounded-[20px] rounded-bl-none"
                                  }`}>
                                    {msg.text}
                                  </div>
                                  <span className="text-[10px] text-gray-400 mt-1 px-1">
                                    {moment(msg.createdAt).format("HH:mm")}
                                  </span>
                                </div>
                              </motion.div>
                            )
                          })}
                        </AnimatePresence>
                      )}
                      {chatMode === "ai" && isAITyping && <div className="p-2 animate-pulse text-[11px] text-gray-400 font-medium">AI đang trả lời...</div>}
                      <div ref={messagesEndRef} />
                    </div>
                    
                    <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-gray-100 flex gap-2 items-center">
                      <input 
                        type="text" 
                        value={inputText} 
                        onChange={(e) => setInputText(e.target.value)} 
                        placeholder={placeholderText} 
                        disabled={isLoadingHistory} 
                        className="flex-1 bg-gray-100 border-none rounded-full px-4 py-2.5 text-[13px] outline-none focus:ring-1 focus:ring-gray-900 transition-all" 
                      />
                      <button 
                        type="submit" 
                        disabled={!inputText.trim() || isLoadingHistory || (chatMode === "ai" && isAITyping)} 
                        className="text-gray-900 p-2 hover:scale-110 disabled:opacity-50 disabled:hover:scale-100 transition-all"
                      >
                        <IoSend size={22} />
                      </button>
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