import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/axiosClients"; // Dùng chung 1 instance API này thôi nhé

// 1. ASYNC THUNKS (Gọi API)

export const fetchLastRfid = createAsyncThunk(
  "iotSensor/fetchLastRfid",
  async (_, { rejectWithValue }) => { // Thêm ngoặc nhọn ở đây
    try {
      const { data } = await api.get("/api/iot/rfid/latest");
      return data; 
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Lỗi lấy mã RFID");
    }
  }
);

export const clearBackendRfid = createAsyncThunk(
  "iotSensor/clearBackendRfid",
  async (_, { rejectWithValue }) => {
    try {
      await api.delete("/api/iot/rfid/clear");
      return null;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message);
    }
  }
);

export const fetchSensorData = createAsyncThunk(
  "iotSensor/fetchSensorData",
  async (_, { rejectWithValue }) => { // Thêm ngoặc nhọn
    try {
      // Vì 'api' đã có sẵn baseURL rồi, nên chỉ cần gõ route thôi
      const response = await api.get("/api/iot/data");
      return response.data; 
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Lỗi kết nối trạm thời tiết");
    }
  }
);

export const fetchHistoryData = createAsyncThunk(
  "iotSensor/fetchHistoryData",
  async (range, { rejectWithValue }) => { // Thêm ngoặc nhọn
    try {
      // Đổi axios.get thành api.get và đảm bảo đúng route
      const response = await api.get(`/api/iot/history?range=${range}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Lỗi lấy dữ liệu lịch sử DB");
    }
  }
);

// 2. KHỞI TẠO STATE MẶC ĐỊNH
const initialState = {
  data: {
    temperature: 0,
    humidity: 0,
    tempStatus: "Đang kết nối...",
    humStatus: "Đang kết nối...",
    is_alert: false,
    updatedAt: null,
  },
  lastRfid: null,
  historyData: [],
  isLoading: false,
  isHistoryLoading: false, // Bổ sung biến này vì ở extraReducers fen có gọi nó
  isError: false,
  message: "",
};

// 3. TẠO SLICE
const iotSensorSlice = createSlice({
  name: "iotSensor",
  initialState,
  reducers: {
    clearHistory: (state) => {
      state.historyData = [];
    },
    resetLastRfid: (state) => {
      state.lastRfid = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // --- XỬ LÝ FETCH SENSOR DATA ---
      .addCase(fetchSensorData.pending, (state) => {
        // Có thể mở comment nếu muốn hiện loading, nhưng để real-time thì ko cần
        // state.isLoading = true; 
      })
      .addCase(fetchSensorData.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isError = false;
        state.data = action.payload; 
      })
      .addCase(fetchSensorData.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      // --- XỬ LÝ FETCH LATEST RFID ---
      .addCase(fetchLastRfid.fulfilled, (state, action) => {
        // Đề phòng API trả về null
        state.lastRfid = action.payload?.rfidTag || null;
      })

      // --- XỬ LÝ CLEAR BACKEND RFID ---
      .addCase(clearBackendRfid.fulfilled, (state) => {
        state.lastRfid = null; 
      })
      .addCase(clearBackendRfid.rejected, (state, action) => {
        console.error("Không thể xóa mã thẻ trên Server:", action.payload);
      })

      // --- XỬ LÝ FETCH HISTORY DATA ---
      .addCase(fetchHistoryData.pending, (state) => {
        state.isHistoryLoading = true; 
      })
      .addCase(fetchHistoryData.fulfilled, (state, action) => {
        state.isHistoryLoading = false;
        state.historyData = action.payload; 
        state.isError = false;
      })
      .addCase(fetchHistoryData.rejected, (state, action) => {
        state.isHistoryLoading = false;
        state.isError = true;
        state.message = action.payload;
      });
  },
});

export const { clearHistory, resetLastRfid } = iotSensorSlice.actions;

// Sửa lỗi chính tả chữ "reducer"
export default iotSensorSlice.reducer;