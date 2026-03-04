import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/axiosClients"; 

// 1. Thunk: Lấy danh sách khách hàng đang chat
export const fetchConversations = createAsyncThunk(
  "adminChat/fetchConversations",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/api/messages/admin/conversations", {
        headers: { Authorization: `Bearer ${localStorage.getItem("userToken")}` },
      });
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Lỗi tải danh sách chat");
    }
  }
);

// 2. Thunk: Lấy lịch sử chat của 1 khách hàng cụ thể
export const fetchAdminChatHistory = createAsyncThunk(
  "adminChat/fetchAdminChatHistory",
  // 🔥 Nhận 1 object chứa cả ID đích và ID của mình
  async ({ targetId, myId }, { rejectWithValue }) => { 
    try {
      // 🔥 Gắn ?myId=${myId} vào đuôi link API
      const response = await api.get(`/api/messages/admin/history/${targetId}?myId=${myId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("userToken")}` },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue("Lỗi tải lịch sử tin nhắn");
    }
  }
);

const adminChatSlice = createSlice({
  name: "adminChat",
  initialState: {
    customers: [], // Danh sách khách hàng bên cột trái
    activeChat: null, // Khách hàng đang được chọn để chat
    messages: [], // Lịch sử chat của khách hàng đang chọn
    loading: false,
    error: null,
  },
  reducers: {
    // Chọn 1 khách hàng để chat
    setActiveChat: (state, action) => {
      state.activeChat = action.payload;
    },
    // Nạp tin nhắn mới vào khung chat hiện tại (khi socket nhận/gửi tin)
    addMessageToActiveChat: (state, action) => {
      state.messages.push(action.payload);
    },
    // Đẩy khách hàng vừa nhắn tin lên đầu danh sách (Tùy chọn nâng cao)
    moveCustomerToTop: (state, action) => {
      const customerId = action.payload;
      const index = state.customers.findIndex((c) => c._id === customerId);
      if (index > 0) {
        const [customer] = state.customers.splice(index, 1);
        state.customers.unshift(customer);
      }
    },
    incrementUnread: (state, action) => {
    const userId = action.payload;
    const customer = state.customers.find(c => c._id === userId);
    if (customer) {
      customer.unread = (customer.unread || 0) + 1;
    }},
    clearUnread: (state, action) => {
    const userId = action.payload;
    const customer = state.customers.find(c => c._id === userId);
    if (customer) {
      customer.unread = 0;
    }}
  },
  extraReducers: (builder) => {
    builder
      // Xử lý danh sách khách hàng
      .addCase(fetchConversations.pending, (state) => { 
        state.loading = true; 
    })
      .addCase(fetchConversations.fulfilled, (state, action) => {
        state.loading = false;
        state.customers = action.payload;
      })
      .addCase(fetchConversations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Xử lý lịch sử chat 1 người
      .addCase(fetchAdminChatHistory.pending, (state) => {
        state.loading = true;
        state.messages = []; //  Xóa tin nhắn của người cũ trước khi load người mới
      })
      .addCase(fetchAdminChatHistory.fulfilled, (state, action) => {
        state.loading = false;
        state.messages = action.payload; //  Đổ tin nhắn mới vào
      })
      .addCase(fetchAdminChatHistory.rejected, (state) => {
        state.loading = false;
      });
  },
});

export const { setActiveChat, addMessageToActiveChat, moveCustomerToTop, incrementUnread, clearUnread } = adminChatSlice.actions;
export default adminChatSlice.reducer;