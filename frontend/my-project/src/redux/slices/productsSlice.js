import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import api from "../../api/axiosClients";
// fetch product collection  and filter
export const fetchProductsbyFilter = createAsyncThunk(
  "products/fetchByFilter",
  async ({
    collection,
    size,
    color,
    gender,
    minPrice,
    maxPrice,
    sortBy,
    search,
    category,
    material,
    brand,
    limit,
  } = {}) => {
    const query = new URLSearchParams();
    if (collection) query.append("collection", collection);
    if (size) query.append("size", size);
    if (color) query.append("color", color);
    if (gender) query.append("gender", gender);
    if (minPrice) query.append("minPrice", minPrice);
    if (maxPrice) query.append("maxPrice", maxPrice);
    if (sortBy) query.append("sortBy", sortBy);
    if (search) query.append("search", search);
    if (category) query.append("category", category);
    if (material) query.append("material", material);
    if (brand) query.append("brand", brand);
    if (limit) query.append("limit", limit);

    const response = await api.get(
      `${import.meta.env.VITE_BACKEND_URL}/api/products?${query.toString()}`,
    );
    return response.data;
  },
);
// async thunk for fetch single product by id
export const fetchProductDetails = createAsyncThunk(
  "products/fetchProductDetails",
  async (id) => {
    const response = await api.get(
      `${import.meta.env.VITE_BACKEND_URL}/api/products/${id}`,
    );
    return response.data;
  },
);
// fetch update Product
export const updateProduct = createAsyncThunk(
  "products/updateProduct",
  async ({ id, productData }) => {
    const response = await api.put(
      `${import.meta.env.VITE_BACKEND_URL}/api/products/${id}`,
      productData,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("userToken")}`,
        },
      },
    );
    return response.data;
  },
);
// fetch product similar
export const fetchSimilarProducts = createAsyncThunk(
  "products/similar",
  async ({ id }) => {
    const response = await api.get(
      `${import.meta.env.VITE_BACKEND_URL}/api/products/similar/${id}`,
    );
    return response.data;
  },
);

// fetch product recommend 

export const fetchRecommendedProducts = createAsyncThunk(
  "products/fetchRecommended",
  async (bodyType, { rejectWithValue }) => {
    try {
     
      const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/products/recommend?bodyType=${bodyType}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Lỗi lấy đồ gợi ý");
    }
  }
);


// Thunk mới: Phân tích ảnh bằng AI Gemini
export const analyzeBodyWithAI = createAsyncThunk(
  "products/analyzeBodyWithAI",
  async (imageBase64, { dispatch, rejectWithValue }) => {
    try {
      // 1. Gọi API AI ở Backend
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/ai-recommend/analyze-body`,
        { image: imageBase64 }
      );


      return response.data; // Trả về để Component hiển thị chữ "Slim/Fit/Plus-size"
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "AI không thể phân tích ảnh"
      );
    }
  }
);

// Thunk mới: Gọi chuyên gia tư vấn AI (Bằng số đo)
export const fetchAIConsultant = createAsyncThunk(
  "products/fetchAIConsultant",
  async ({ height, weight , gender, age, purpose }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/ai-recommend/consultant`,
        { height, weight, gender, age, purpose }
      );
      
      // Backend trả về: { bmi, advice, products }
      return response.data; 
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Lỗi AI Consultant"
      );
    }
  }
);



const productSlice = createSlice({
  name: "products",
  initialState: {
    products: [],
    selectedProduct: null,
    similarProducts: [],
    recommendedProducts: [],
    loading: false,
    error: null,
    aiLoading: false,
    filters: {
      category: "",
      size: "",
      color: "",
      gender: "",
      brand: "",
      minPrice: "",
      maxPrice: "",
      sortBy: "",
      search: "",
      material: "",
      collection: "",
    },
  },
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {
        category: "",
        size: "",
        color: "",
        gender: "",
        brand: "",
        minPrice: "",
        maxPrice: "",
        sortBy: "",
        search: "",
        material: "",
        collection: "",
      };
    },
  },
  extraReducers: (builder) => {
    // fetching product with filter
    builder
      .addCase(fetchProductsbyFilter.pending, (state) => {
        ((state.loading = true), (state.error = null));
      })
      .addCase(fetchProductsbyFilter.fulfilled, (state, action) => {
        ((state.loading = false),
          (state.products = Array.isArray(action.payload)
            ? action.payload
            : []));
      })
      .addCase(fetchProductsbyFilter.rejected, (state, action) => {
        ((state.loading = false), (state.error = action.error.message));
      })
      // fetching single product details
      .addCase(fetchProductDetails.pending, (state) => {
        ((state.loading = true), (state.error = null));
      })
      .addCase(fetchProductDetails.fulfilled, (state, action) => {
        ((state.loading = false), (state.selectedProduct = action.payload));
      })
      .addCase(fetchProductDetails.rejected, (state, action) => {
        ((state.loading = false), (state.error = action.error.message));
      })
      // handle update product
      .addCase(updateProduct.pending, (state) => {
        ((state.loading = true), (state.error = null));
      })
      .addCase(updateProduct.fulfilled, (state, action) => {
        state.loading = false;
        const updateProduct = action.payload;
        const index = state.products.findIndex(
          (product) => product._id === updateProduct._id,
        );
        if (index !== -1) {
          state.products[index] = updateProduct;
        }
      })
      .addCase(updateProduct.rejected, (state, action) => {
        ((state.loading = false), (state.error = action.error.message));
      })
      // handle fetch similar products
      .addCase(fetchSimilarProducts.pending, (state) => {
        ((state.loading = true), (state.error = null));
      })
      .addCase(fetchSimilarProducts.fulfilled, (state, action) => {
        ((state.loading = false), (state.similarProducts = action.payload));
      })
      .addCase(fetchSimilarProducts.rejected, (state, action) => {
        ((state.loading = false), (state.error = action.error.message));
      })
      .addCase(fetchRecommendedProducts.pending , (state)=>{
        state.loading = true ,
        state.error = null
      })
      .addCase(fetchRecommendedProducts.fulfilled, (state, action)=>{
        state.loading = false,
        state.recommendedProducts = action.payload
      })
      .addCase(fetchRecommendedProducts.rejected , (state, action)=>{
        state.loading = false,
        state.error = action.payload

      })
      .addCase(analyzeBodyWithAI.pending, (state) => {
  state.aiLoading = true;
  state.error = null;
  state.aiAdvice = null; // Clear lời khuyên cũ đi
  state.bodyType = null;
})
.addCase(analyzeBodyWithAI.fulfilled, (state, action) => {
  state.aiLoading = false;
  // Lưu kết quả bodyType vào state nếu muốn dùng ở nhiều nơi
state.bodyType = action.payload.bodyType;
  state.aiAdvice = action.payload.advice; 
  state.recommendedProducts = action.payload.products;
})
.addCase(analyzeBodyWithAI.rejected, (state, action) => {
  state.aiLoading = false;
  state.error = action.payload;
})
.addCase(fetchAIConsultant.pending, (state) => {
  state.consultantLoading = true;
  state.error = null;
  state.aiAdvice = null;
})
.addCase(fetchAIConsultant.fulfilled, (state, action) => {
  state.consultantLoading = false;
  
  // Lấy lời khuyên gán vào state
  state.aiAdvice = action.payload.advice; 
  
  // Đỉnh cao ở đây: Cập nhật luôn danh sách đồ AI chọn vào Redux
  state.recommendedProducts = action.payload.products; 

  // Nếu fen muốn hiển thị chữ Slim/Fit/Plus-size:
  const bmi = action.payload.bmi;
  if (bmi < 18.5) state.bodyType = "Slim";
  else if (bmi >= 25) state.bodyType = "Plus-size";
  else state.bodyType = "Fit";
})
.addCase(fetchAIConsultant.rejected, (state, action) => {
  state.consultantLoading = false;
  state.error = action.payload;
})
      
  },
});






export const { setFilters, clearFilters } = productSlice.actions;
export default productSlice.reducer;
