import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/axiosClients";

// fetch history chat
export const fetchChatHistory = createAsyncThunk(
  "chat/fetchChatHistory",
  // Dùng getState để tự động lấy thông tin User đang đăng nhập
  async (targetId, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const role = state.auth.user?.role;
      const myId = state.auth.user?._id;

      let url = "/api/messages/history"; // API mặc định cho Khách hàng

      // Nếu là Admin thì gọi API Admin có đính kèm myId
      if (role === "admin" && targetId && targetId !== "general") {
        url = `/api/messages/admin/history/${targetId}?myId=${myId}`;
      }

      const response = await api.get(url, {
        headers: { Authorization: `Bearer ${localStorage.getItem("userToken")}` },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue("Lỗi tải lịch sử chat");
    }
  }
);

export const fetchAdminList = createAsyncThunk(
  "chat/fetchAdminList",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(`${import.meta.env.VITE_BACKEND_URL}/api/messages/admins`);
      return response.data;
    } catch (error) {
      return rejectWithValue("Lỗi tải danh sách Admin");
    }
  }
);

export const fetchUserList = createAsyncThunk(
  "chat/fetchUserList",
  async (_, { rejectWithValue }) => {
    try {
      // Gọi API lấy toàn bộ user (Fen nhớ check lại xem link API này đúng với Backend của fen chưa nha)
      const response = await api.get(`${import.meta.env.VITE_BACKEND_URL}/api/messages/users`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("userToken")}` },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue("Lỗi tải danh sách người dùng");
    }
  }
);


export const sendMessageToAI = createAsyncThunk(
  "chat/sendMessageToAI",
  async (message, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const role = state.auth.user?.role || "customer"; // Lấy role tự động

      // Truyền thêm role vào body để Backend biết đường mà xử lý
      const response = await api.post("/api/messages/ai", { 
        message, 
        role: role 
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem("userToken")}` },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue("Lỗi kết nối AI");
    }
  }
);





const chatSlice = createSlice({
  name: "chat",
  initialState: {
    messages: [],
    adminList:[],
    userList: [],
    aiMessages: [
      {
        sender: "bot",
        text: "Xin chào! Mình là trợ lý AI. Mình có thể giúp gì cho bạn hôm nay?",
      },
    ],
    adminMessages: [],
    loading: false,
    isAITyping: false,
    error: null,
  },
  reducers: {
    addAdminMessage: (state, action) => {
     const newMsg = action.payload;
      // 👇 Lưới lọc: Nếu tin nhắn từ Socket/DB gửi về có _id, ta kiểm tra trùng lặp
      if (newMsg._id) {
        const isExist = state.adminMessages.find((msg) => msg._id === newMsg._id);
        if (!isExist) {
          state.adminMessages.push(newMsg); // Không trùng thì mới cho vào
        }
      } else {
        // Tin nhắn do chính mình vừa gõ (chưa có _id) thì cứ push bình thường
        state.adminMessages.push(newMsg);
      }
    },
    
    // Hành động: Nạp tin nhắn vào phòng AI (Dùng khi mình gửi câu hỏi cho bot)
    addAIMessage: (state, action) => {
      state.aiMessages.push(action.payload);
    },

    // Hành động: Xóa sạch lịch sử Admin (Dùng khi User bấm LOGOUT)
    clearAdminMessages: (state) => {
      state.adminMessages = [];
    },

    // Hành động: Xóa sạch lịch sử AI (Nếu fen muốn làm nút "Reset đoạn chat AI")
    clearAIMessages: (state) => {
      state.aiMessages = [
        {
          sender: "bot",
          text: "Đoạn chat đã được làm mới. Mình giúp gì được cho bạn?",
        },
      ];
    },
  },
  extraReducers: (builder) => {
    builder
    .addCase(fetchAdminList.fulfilled, (state, action) => {
        state.adminList = action.payload;
      })
      .addCase(fetchUserList.fulfilled, (state, action) => {
        // Lọc ra những người KHÔNG PHẢI là admin để hiện vào danh sách khách hàng
        state.userList = action.payload.filter(u => u.role !== 'admin');
      })
      // Xử lý tải lịch sử
      .addCase(fetchChatHistory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchChatHistory.fulfilled, (state, action) => {
        state.loading = false;
        // Đổ data từ DB vào đúng phòng Admin
        state.adminMessages = action.payload;
      })
      .addCase(fetchChatHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // --- XỬ LÝ CHAT AI ---
      .addCase(sendMessageToAI.pending, (state) => {
        state.isAITyping = true; // Bật hiệu ứng "Đang gõ..."
      })
      .addCase(sendMessageToAI.fulfilled, (state, action) => {
        state.isAITyping = false;
      const aiText = action.payload.reply || action.payload.text || action.payload;

    // Nhét tin nhắn của AI vào mảng để ChatWidget hiện lên
    state.aiMessages.push({
      sender: "ai",
      text: aiText, 
      createdAt: new Date().toISOString(),
    });
      })
      .addCase(sendMessageToAI.rejected, (state, action) => {
        state.isAITyping = false;
        // Nếu API lỗi thì bot báo lỗi trong phòng AI
        state.aiMessages.push({ sender: "bot", text: action.payload });
      });
  },
});
export const {
  addAdminMessage,
  addAIMessage,
  clearAdminMessages,
  clearAIMessages,
} = chatSlice.actions;
export default chatSlice.reducer;
