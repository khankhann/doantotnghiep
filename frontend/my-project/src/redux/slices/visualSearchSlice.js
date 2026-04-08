import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/axiosClients"; 

export const searchProductsByImage = createAsyncThunk(
  "visualSearch/searchByImage",
  async (formData, { rejectWithValue }) => {
    try {
      const response = await api.post("/api/ai/visual-search", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data; 
    } catch (error) {
      console.error("Lỗi Redux Visual Search:", error);
      return rejectWithValue(
        error.response?.data?.message || "Lỗi kết nối đến server AI"
      );
    }
  }
);

// --- ĐÃ THÊM BIẾN uploadedImage Ở ĐÂY ---
const initialState = {
  isDetected: false,    
  aiData: null,         
  results: [],          
  isLoading: false,     
  error: null,          
  uploadedImage: null,  // <-- Nơi cất giữ đường dẫn ảnh ảo để show lên UI
};

const visualSearchSlice = createSlice({
  name: "visualSearch",
  initialState,
  reducers: {
    // --- THÊM HÀM NÀY ĐỂ LƯU ẢNH LÚC USER CHỌN FILE ---
    setUploadedImage: (state, action) => {
      state.uploadedImage = action.payload; 
    },
    
    clearVisualSearchResults: (state) => {
      state.isDetected = false;
      state.aiData = null;
      state.results = [];
      state.error = null;
      state.uploadedImage = null; // <-- Nhớ xóa cả ảnh khi dọn dẹp data
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(searchProductsByImage.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(searchProductsByImage.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload.detected) {
            state.isDetected = true;
            state.aiData = action.payload.ai_data; 
            state.results = action.payload.products || action.payload.final_data|| []; 
            state.error = null;
        } else {
            state.isDetected = false;
            state.aiData = null;
            state.results = [];
            state.error = action.payload.message; 
        }
      })
      .addCase(searchProductsByImage.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

// --- NHỚ EXPORT THÊM HÀM setUploadedImage RA NGOÀI ---
export const { clearVisualSearchResults, setUploadedImage } = visualSearchSlice.actions;
export default visualSearchSlice.reducer;