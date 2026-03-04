import React, { useState, useRef, useEffect } from "react";
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

  const { aiMessages, adminMessages, isAITyping, adminList, userList } = useSelector((state) => state.chat);
  const { user } = useSelector((state) => state.auth);

  const currentMessages = chatMode === "ai" ? aiMessages : adminMessages;

  useEffect(() => {
    if (user?._id) socket.emit("join_room", user._id);
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
    const handleMsg = (newMsg) => dispatch(addAdminMessage(newMsg));
    socket.on("receive_msg_from_admin", handleMsg);
    socket.on("receive_msg_from_user", handleMsg);
    return () => {
      socket.off("receive_msg_from_admin", handleMsg);
      socket.off("receive_msg_from_user", handleMsg);
    };
  }, [dispatch]);

  const fetchHistoryWithLoading = async (targetId) => {
    setIsLoadingHistory(true);
    await dispatch(fetchChatHistory(targetId)); 
    setIsLoadingHistory(false);
  };

  const handleSelectMode = (mode) => {
    if (!user) return alert("Vui lòng đăng nhập!");
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

    if (chatMode === "ai") {
      dispatch(addAIMessage({ sender: "customer", text: currentText, createdAt: new Date().toISOString() }));
      dispatch(sendMessageToAI(currentText));
    } else {
      const myRole = user?.role === "admin" ? "admin" : "customer";
      const targetId = chatMode === "admin" ? selectedAdmin?._id : selectedUserToChat?._id;
      
    

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
  };

  // Hàm an toàn để lấy ID (Chống lỗi [object Object])
  const getSafeId = (idData) => {
    if (!idData) return "";
    if (typeof idData === "object" && idData._id) return String(idData._id);
    return String(idData);
  };

  // Xác định Tiêu đề Header chuẩn xác
  let headerTitle = "Hỗ trợ khách hàng";
  if (chatMode === "ai") headerTitle = "Trợ lý AI";
  else if (chatMode === "select_admin") headerTitle = "Chọn Admin để chat";
  else if (chatMode === "select_user") headerTitle = "Danh sách Khách hàng";
  else if (chatMode === "admin") headerTitle = selectedAdmin?.name || "Admin";
  else if (chatMode === "chat_user") headerTitle = selectedUserToChat?.name || "Khách hàng";

  // Xác định Placeholder cho ô nhập liệu
  let placeholderText = "Nhập tin nhắn...";
  if (chatMode === "ai") {
    placeholderText = user?.role === "admin" ? "Hỏi doanh thu, đơn hàng hôm nay..." : "Hỏi gợi ý phối đồ, lịch sử mua...";
  }

  return (
    <>
      <button onClick={() => {setIsOpen(!isOpen); if(!isOpen) setUnreadCount(0);}} className="fixed bottom-6 left-6 z-[20] w-14 h-14 bg-blue-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-all active:scale-95">
        {isOpen ? <IoCloseOutline size={28} /> : <BsChatDotsFill size={24} />}
        {!isOpen && unreadCount > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-6 h-6 rounded-full flex items-center justify-center border-2 border-white animate-bounce">{unreadCount}</span>}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0, y: 50, scale: 0.8 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.8 }} transition={{ type: "spring", stiffness: 250, damping: 20 }} className="fixed bottom-24 left-6 z-[100] w-[340px] sm:w-[380px] h-[520px] bg-white rounded-2xl shadow-2xl border flex flex-col overflow-hidden">
            
            <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-4 text-white flex items-center justify-between shadow-sm z-10">
              <div className="flex items-center gap-2">
                {chatMode !== "select" && <IoArrowBackOutline className="cursor-pointer hover:bg-white/20 p-1 rounded-full transition-colors" size={26} onClick={() => {
                  setChatMode("select");
                  setSelectedAdmin(null);
                  setSelectedUserToChat(null);
                }} />}
                <h3 className="font-bold text-base tracking-wide flex items-center gap-2">
                  {headerTitle}
                </h3>
              </div>
              <IoCloseOutline size={26} className="cursor-pointer hover:bg-white/20 p-1 rounded-full transition-colors" onClick={() => setIsOpen(false)} />
            </div>

            <div className="flex-1 bg-gray-50 flex flex-col relative overflow-hidden">
              <AnimatePresence mode="wait">
                {chatMode === "select" ? (
                  <motion.div key="select" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-5 flex flex-col gap-4 justify-center h-full">
                    <button onClick={() => handleSelectMode("ai")} className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-xl hover:border-blue-500 hover:shadow-md transition-all group">
                      <div className="bg-blue-50 p-3 rounded-full text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors"><RiRobot2Line size={26} /></div>
                      <div className="text-left">
                        <h4 className="font-bold text-gray-800 text-base">{user?.role === "admin" ? "Trợ lý AI Quản trị" : "Trợ lý AI Mua sắm"}</h4>
                        <p className="text-[13px] text-gray-500 mt-0.5">{user?.role === "admin" ? "Hỏi doanh thu, thống kê đơn hàng" : "Hỏi lịch sử mua, tư vấn phối đồ"}</p>
                      </div>
                    </button>
                    <button onClick={() => handleSelectMode("admin")} className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-xl hover:border-emerald-500 hover:shadow-md transition-all group">
                      <div className="bg-emerald-50 p-3 rounded-full text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors"><RiUserSmileLine size={26} /></div>
                      <div className="text-left"><h4 className="font-bold text-gray-800 text-base">Chat với Admin</h4><p className="text-[13px] text-gray-500 mt-0.5">Hỗ trợ đơn hàng & kỹ thuật</p></div>
                    </button>
                    {user?.role === "admin" && (
                      <button onClick={() => handleSelectMode("user")} className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-xl hover:border-purple-500 hover:shadow-md transition-all group">
                        <div className="bg-purple-50 p-3 rounded-full text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors"><RiGroupLine size={26} /></div>
                        <div className="text-left"><h4 className="font-bold text-gray-800 text-base">Cộng đồng User</h4><p className="text-[13px] text-gray-500 mt-0.5">Quản lý & Kết nối khách hàng</p></div>
                      </button>
                    )}
                  </motion.div>
                ) : (chatMode === "select_admin" || chatMode === "select_user") ? (
                  <motion.div key="list" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                    {(chatMode === "select_admin" ? adminList : userList)?.filter(u => String(u._id) !== String(user?._id)).map(u => (
                      <div key={u._id} onClick={() => chatMode === "select_admin" ? handleStartChatWithAdmin(u) : handleStartChatWithUser(u)} className="flex items-center justify-between p-3 bg-white border rounded-xl hover:border-blue-500 hover:shadow-md cursor-pointer transition-all group">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-sm ${chatMode === "select_admin" ? "bg-red-500" : "bg-purple-500"}`}>{u.name.charAt(0).toUpperCase()}</div>
                          <div className="flex flex-col"><span className="text-sm font-bold text-gray-700">{u.name}</span><span className="text-[10px] text-gray-400">Trực tuyến</span></div>
                        </div>
                        <span className="text-[9px] bg-blue-600 text-white font-bold px-3 py-1.5 rounded-full uppercase group-hover:scale-105 transition-transform">Chat</span>
                      </div>
                    ))}
                  </motion.div>
                ) : (
                  <motion.div key="chatbox" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-full w-full">
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-200 relative">
                      
                      {isLoadingHistory ? (
                        <div className="flex items-center justify-center h-full">
                          <div className="text-blue-500 text-sm font-medium animate-pulse">Đang kết nối...</div>
                        </div>
                      ) : (
                        <>
                          {currentMessages
                            ?.filter(msg => {
                              if (chatMode === "ai") return true;
                              if (user?.role === "admin") {
                                const partnerId = String(chatMode === "admin" ? selectedAdmin?._id : selectedUserToChat?._id);
                                const msgUserId = getSafeId(msg.user);
                                const msgAdminId = getSafeId(msg.adminId);
                                
                                // Bức tường lọc thông minh (chấp nhận cả tin cũ không có adminId)
                                if (msgUserId === partnerId) return true;
                                if (msgAdminId === partnerId) return true;
                                if (!msgAdminId && msgUserId === String(user?._id)) return true;

                                return false; 
                              }
                              return true;
                            })
                            .map((msg, index) => {
                            
                            // Phân định Trái/Phải tuyệt đối chính xác
                            let isMe = false;
                            
                            if (chatMode === "ai") {
                              isMe = msg.sender === "customer";
                            } else if (user?.role === "admin") {
                              if (msg.sender === "customer") {
                                isMe = false; 
                              } else {
                                isMe = msg.adminId 
                                  ? String(msg.adminId) === String(user?._id) 
                                  : getSafeId(msg.user) !== String(user?._id);
                              }
                            } else {
                              isMe = msg.sender === "customer"; 
                            }

                            return (
                              <div key={index} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                                <div className={`flex items-end gap-1.5 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                                  <div className={`max-w-[85%] p-3 rounded-2xl text-[13px] shadow-sm leading-relaxed ${isMe ? "bg-blue-600 text-white rounded-br-none shadow-blue-100" : "bg-white border text-gray-800 rounded-bl-none shadow-gray-100"}`}>
                                    {msg.text}
                                  </div>
                                  <span className="text-[8px] text-gray-400 font-medium pb-1">{moment(msg.createdAt).format("HH:mm")}</span>
                                </div>
                              </div>
                            )
                          })}
                          {chatMode === "ai" && isAITyping && <div className="p-2 animate-pulse text-xs text-gray-400">AI đang trả lời...</div>}
                          <div ref={messagesEndRef} />
                        </>
                      )}
                    </div>
                    <form onSubmit={handleSendMessage} className="p-3 bg-white border-t flex gap-2 items-center">
                      <input type="text" value={inputText} onChange={(e) => setInputText(e.target.value)} placeholder={placeholderText} disabled={isLoadingHistory} className="flex-1 bg-gray-100 rounded-full px-4 py-2.5 text-[13px] outline-none focus:ring-1 focus:ring-blue-500 transition-all" />
                      <button type="submit" disabled={!inputText.trim() || isLoadingHistory || (chatMode === "ai" && isAITyping)} className="bg-blue-600 text-white p-2.5 rounded-full shadow-md active:scale-90 transition-transform"><IoSend size={18} /></button>
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