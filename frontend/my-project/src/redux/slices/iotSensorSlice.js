import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from "../../api/axiosClients"
// (Nếu fen có file axiosClient riêng thì import vào thay thế axios nhé)

// 1. Tạo Async Thunk để gọi API lấy data từ Backend
export const fetchSensorData = createAsyncThunk(
    'iotSensor/fetchSensorData',
    async (_, rejectWithValue) => {
        try {
            // Đổi URL này cho khớp với port Backend của fen nha
            const response = await api.get(`${import.meta.env.VITE_BACKEND_URL}/api/iot/data`);
            return response.data; // Trả về cục data { temperature, humidity, ... }
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Lỗi kết nối trạm thời tiết");
        }
    }
);

export const fetchHistoryData = createAsyncThunk(
  "iotSensor/fetchHistoryData",
  async (range, rejectWithValue) => {
    try {
      // Gọi API gửi kèm mốc thời gian (vd: ?range=1h)
      const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/history?range=${range}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Lỗi lấy dữ liệu lịch sử DB");
    }
  }
);


// 2. Khởi tạo State mặc định
const initialState = {
    data: {
        temperature: 0,
        humidity: 0,
        tempStatus: "Đang kết nối...",
        humStatus: "Đang kết nối...",
        is_alert: false,
        updatedAt: null
    },
    historyData :[],
    isLoading: false,
    isError: false,
    message: ''
};

// 3. Tạo Slice
const iotSensorSlice = createSlice({
    name: 'iotSensor',
    initialState,
    reducers: {
        // Có thể thêm các action nội bộ ở đây nếu cần
        clearHistory: (state) => {
      state.historyData = [];
    }
    },
    extraReducers: (builder) => {
        builder
            // Khi đang chờ API trả về
            .addCase(fetchSensorData.pending, (state) => {
                // Tắt loading đi để màn hình khỏi bị giật chớp liên tục mỗi 3 giây
                // state.isLoading = true; 
            })
            // Khi API thành công
            .addCase(fetchSensorData.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isError = false;
                state.data = action.payload; // Cập nhật lại kho data mới nhất
            })
            // Khi API thất bại (Mất kết nối mạng, server sập...)
            .addCase(fetchSensorData.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            .addCase(fetchHistoryData.pending, (state) => {
        state.isHistoryLoading = true; // Bật cờ loading báo cho giao diện biết
      })
      .addCase(fetchHistoryData.fulfilled, (state, action) => {
        state.isHistoryLoading = false;
        state.historyData = action.payload; // Nạp data mảng vào kho
        state.isError = false;
      })
      .addCase(fetchHistoryData.rejected, (state, action) => {
        state.isHistoryLoading = false;
        state.isError = true;
        state.message = action.payload;
      });   
    }
});



export const { clearHistory } = iotSensorSlice.actions;
export default iotSensorSlice.reducer;