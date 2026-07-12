import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/axiosClients"; // Đảm bảo đường dẫn import api đúng nhé fen

// Thunk: Lấy toàn bộ danh sách danh mục từ Backend
export const fetchCategories = createAsyncThunk(
  "categories/fetchCategories",
  async (_, { rejectWithValue }) => {
    try {
      // Gọi API lấy danh mục (fen check lại xem đường dẫn backend đúng chưa nhé)
      const response = await api.get(`${import.meta.env.VITE_BACKEND_URL}/api/categories`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Lỗi khi tải danh mục");
    }
  }
);

const categorySlice = createSlice({
  name: "categories",
  initialState: {
    categories: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.loading = false;
        // Đảm bảo payload trả về là mảng, nếu không thì trả về mảng rỗng
        state.categories = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default categorySlice.reducer;