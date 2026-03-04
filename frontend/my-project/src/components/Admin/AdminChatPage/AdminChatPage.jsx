import { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { 
  fetchConversations, fetchAdminChatHistory, setActiveChat, 
  addMessageToActiveChat, moveCustomerToTop, incrementUnread, clearUnread 
} from "@redux/slices/adminChatSlice";
import { addAdminMessage, fetchAdminList } from "@redux/slices/chatSlice";
import socket from "@components/socket/Socket";
import { IoSend } from "react-icons/io5";
import { RiAdminLine } from "react-icons/ri";
import moment from "moment";

function AdminChatPage() {
  const dispatch = useDispatch();
  const { user: adminUser } = useSelector((state) => state.auth); 
  const { adminList } = useSelector((state) => state.chat);
  const { customers, activeChat, messages, loading } = useSelector((state) => state.adminChat); 
  
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    dispatch(fetchConversations());
    dispatch(fetchAdminList());
    if (adminUser) {
      socket.emit("admin_join");
      socket.emit("join_room", adminUser._id);
    }
  }, [dispatch, adminUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const handleIncomingMsg = (newMsg) => {
      const senderId = String(newMsg.user || newMsg.senderId);
      
      if (activeChat && String(activeChat._id) === senderId) {
        dispatch(addMessageToActiveChat(newMsg));
        dispatch(addAdminMessage(newMsg)); 
      } else {
        dispatch(incrementUnread(senderId));
      }
      dispatch(moveCustomerToTop(senderId));
    };

    socket.on("receive_msg_from_user", handleIncomingMsg);
    socket.on("receive_msg_from_admin", handleIncomingMsg);
    return () => {
      socket.off("receive_msg_from_user", handleIncomingMsg);
      socket.off("receive_msg_from_admin", handleIncomingMsg);
    };
  }, [activeChat, dispatch]);

  // ==========================================
  // 👇 FIX MẤT TIN: GỌI API KÈM ID CỦA ADMIN
  // ==========================================
  const handleSelectChat = (target) => {
    dispatch(setActiveChat(target)); 
    
    // Gửi cả ID người nhận và ID của mình (adminUser._id) lên Redux Slice
    if (adminUser) {
      dispatch(fetchAdminChatHistory({ 
        targetId: target._id, 
        myId: adminUser._id 
      })); 
    }
    
    dispatch(clearUnread(target._id)); 
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim() || !activeChat) return;

    const currentText = inputText;
    const msgObj = { 
      text: currentText, 
      sender: "admin", 
      user: activeChat._id, 
      adminId: adminUser._id, // Gửi kèm ID của mình để lưu DB
      createdAt: new Date().toISOString()
    };

    dispatch(addMessageToActiveChat(msgObj)); 
    dispatch(addAdminMessage(msgObj)); 

    socket.emit("send_msg_to_user", { 
      targetUserId: activeChat._id, 
      message: currentText,
      adminId: adminUser._id 
    });
    
    setInputText("");
  };

  return (
    <div className="flex h-[80vh] bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden font-sans">
      {/* CỘT TRÁI */}
      <div className="w-1/3 border-r bg-gray-50 flex flex-col">
        <div className="p-4 bg-white border-b font-bold text-lg text-blue-600 shadow-sm">Tổng đài CSKH</div>
        <div className="flex-1 overflow-y-auto">
          {/* ĐỘI NGŨ ADMIN */}
          <div className="p-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-100/50">Đội ngũ Admin</div>
          {adminList?.filter(adm => String(adm._id) !== String(adminUser?._id)).map(adm => (
            <div key={adm._id} onClick={() => handleSelectChat(adm)} className={`p-4 border-b cursor-pointer flex items-center gap-3 relative transition-all ${activeChat?._id === adm._id ? "bg-red-50 border-l-4 border-red-500 shadow-sm" : "hover:bg-gray-100"}`}>
              <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold text-xs">{adm.name.charAt(0).toUpperCase()}</div>
              <span className="font-bold text-gray-800 text-sm">{adm.name}</span>
            </div>
          ))}

          {/* KHÁCH HÀNG */}
          <div className="p-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-100/50 mt-2">Khách hàng</div>
          {customers?.filter(c => c.role !== 'admin').map(cust => (
            <div key={cust._id} onClick={() => handleSelectChat(cust)} className={`p-4 border-b cursor-pointer flex items-center gap-3 relative transition-all ${activeChat?._id === cust._id ? "bg-blue-50 border-l-4 border-blue-600 shadow-sm" : "hover:bg-gray-100"}`}>
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">{cust.name.charAt(0).toUpperCase()}</div>
              {cust.unread > 0 && <span className="absolute top-3 left-10 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full border-2 border-white font-bold">{cust.unread}</span>}
              <div className="flex-1 font-bold text-gray-800 text-sm">{cust.name}</div>
            </div>
          ))}
        </div>
      </div>

      {/* CỘT PHẢI (KHUNG CHAT) */}
      <div className="w-2/3 flex flex-col bg-white">
        {activeChat ? (
          <>
            <div className="p-4 border-b font-bold flex flex-col shadow-sm">
               <span className="text-gray-800">{activeChat.name}</span>
               <span className="text-[10px] text-green-500 font-normal italic">Đang trực tuyến</span>
            </div>
            
            <div className="flex-1 p-5 overflow-y-auto space-y-6 bg-gray-50 relative">
              {loading ? (
                <div className="flex items-center justify-center h-full text-blue-500 text-sm font-medium animate-pulse">Đang tải tin nhắn...</div>
              ) : messages.length > 0 ? (
                messages.map((msg, idx) => {
                  
                  // 👇 LOGIC FIX TRÁI PHẢI TUYỆT ĐỐI
                  let isMe = false;
                  if (msg.sender === "admin") {
                    // Nếu là tin mới (có adminId) thì check theo adminId, nếu tin cũ (trong DB) thì check Not Me
                    isMe = msg.adminId ? String(msg.adminId) === String(adminUser?._id) : String(msg.user) !== String(adminUser?._id);
                  } else {
                    isMe = false; // Khách gửi thì luôn bên trái
                  }

                  return (
                    <div key={idx} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                      <div className={`flex items-end gap-2 max-w-[80%] ${isMe ? "flex-row" : "flex-row-reverse"}`}>
                        <span className="text-[9px] text-gray-400 pb-1">{moment(msg.createdAt).format("HH:mm")}</span>
                        <div className={`p-3 rounded-2xl text-sm shadow-sm ${isMe ? "bg-blue-600 text-white rounded-br-none" : "bg-white border text-gray-800 rounded-bl-none"}`}>
                          {msg.text}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400 text-xs italic">Chưa có lịch sử trò chuyện...</div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="p-4 border-t flex gap-3">
              <input type="text" value={inputText} onChange={(e) => setInputText(e.target.value)} placeholder="Nhập tin nhắn..." className="flex-1 bg-gray-100 px-4 py-3 rounded-full text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              <button type="submit" className="bg-blue-600 text-white p-3 rounded-full shadow-lg"><IoSend size={20} /></button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-300 italic"><RiAdminLine size={80} className="opacity-10 mb-4" /><p>Chọn một người để bắt đầu</p></div>
        )}
      </div>
    </div>
  );
}

export default AdminChatPage;