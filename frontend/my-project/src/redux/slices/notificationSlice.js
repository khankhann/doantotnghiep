import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// 1. Async Thunk: Gọi API lấy danh sách thông báo
export const fetchNotifications = createAsyncThunk(
  "notifications/fetchNotifications",
  async (_, { rejectWithValue }) => {
    try {
      const userInfo = localStorage.getItem("userInfo")
        ? JSON.parse(localStorage.getItem("userInfo"))
        : null;

        const userToken = localStorage.getItem("userToken");
      const token = userInfo?.token || userToken;

      if (!token) {
        return rejectWithValue("User not authenticated");
      }

      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      // Gọi API
      const { data } = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/notifications`,
        config
      );
      
      // 👇 QUAN TRỌNG: Log ra xem API trả về cái gì? Mảng [] hay Object {}?
      console.log("📥 Dữ liệu API trả về:", data); 
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message
      );
    }
  }
);

export const markNotificationAsRead = createAsyncThunk(
  "notifications/markAsRead",
  async (notificationId, { rejectWithValue }) => {
    try {
     
      const userInfo = JSON.parse(localStorage.getItem("userInfo"));
      const userToken = localStorage.getItem("userToken");
      const token = userInfo?.token || userToken;

      const config = {
        headers: { Authorization: `Bearer ${token}` },
      };

      // Gọi API PUT
      await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/api/notifications/${notificationId}/read`,
        {},
        config
      );

      return notificationId; // Trả về ID để Redux cập nhật state
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// 4. Async Thunk: Xoá thông báo
export const deleteNotification = createAsyncThunk(
  "notifications/deleteNotification",
  async (notificationId, { rejectWithValue }) => {
    try {
      const userInfo = localStorage.getItem("userInfo")
        ? JSON.parse(localStorage.getItem("userInfo"))
        : null;
      const userToken = localStorage.getItem("userToken");
      const token = userInfo?.token || userToken;

      if (!token) {
        return rejectWithValue("User not authenticated");
      }

      const config = {
        headers: { Authorization: `Bearer ${token}` },
      };

      // Gọi API DELETE xuống Backend
      await axios.delete(
        `${import.meta.env.VITE_BACKEND_URL}/api/notifications/${notificationId}`,
        config
      );

      // Xoá thành công thì trả về ID để Redux Update lại mảng
      return notificationId; 
    } catch (error) {
      return rejectWithValue(
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message
      );
    }
  }
);



const notificationSlice = createSlice({
  name: "notifications",
  initialState: {
    notifications: [],
    loading: false,
    error: null,
  },
  reducers: {
    // 2. Action nhận thông báo Real-time
    addNotification: (state, action) => {
      // 👇 Log xem Redux có nhận được lệnh không
      console.log(" Redux: Đang thêm thông báo mới:", action.payload);

      // Kiểm tra an toàn: Nếu state.notifications lỡ bị null hoặc undefined thì khởi tạo mảng mới
      if (!Array.isArray(state.notifications)) {
          state.notifications = [];
      }

      // Thêm vào đầu danh sách
      state.notifications.unshift(action.payload);
    },

    // 3. Đánh dấu đã đọc
    markAsReadLocal: (state, action) => {
      const notiId = action.payload;
      const notification = state.notifications.find((n) => n._id === notiId);
      if (notification) {
        notification.read = true;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        
        // 👇 QUAN TRỌNG: Kiểm tra xem API có trả về đúng mảng không?
        // Nếu API trả về { success: true, notifications: [...] } mà fen gán trực tiếp action.payload thì TOANG.
        if (Array.isArray(action.payload)) {
            state.notifications = action.payload;
        } else {
            // Nếu lỡ API trả về Object, thử tìm mảng bên trong (ví dụ action.payload.notifications)
            // Hoặc log lỗi ra để biết đường sửa API
            console.error("❌ API không trả về mảng!", action.payload);
            state.notifications = action.payload.notifications || []; 
        }
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(markNotificationAsRead.fulfilled, (state, action) => {
        const notificationId = action.payload;
        const notification = state.notifications.find((n) => n._id === notificationId);
        if (notification) {
          notification.read = true; // Đánh dấu là đã đọc trong Redux
        }
      })
      .addCase(deleteNotification.fulfilled, (state, action) => {
        const notificationId = action.payload;
        // Lọc bỏ cái thông báo có ID trùng với ID vừa xoá ra khỏi mảng
        state.notifications = state.notifications.filter(
          (n) => n._id !== notificationId
        );
      });
      
  },
});

export const { addNotification, markAsReadLocal } = notificationSlice.actions;
export default notificationSlice.reducer;