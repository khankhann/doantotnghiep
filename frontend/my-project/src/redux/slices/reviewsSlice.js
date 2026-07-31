import {createAsyncThunk ,createSlice }from '@reduxjs/toolkit';
import api from "../../api/axiosClients";


export const createProductReview = createAsyncThunk("products/createReview", async ({ productId, rating, comment }, { rejectWithValue }) => {
  try {
    const response = await api.post(`${import.meta.env.VITE_BACKEND_URL}/api/reviews/${productId}`, { rating, comment }, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("userToken")}`
      }
    });
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message);
  }
});

export const editProductReview = createAsyncThunk("products/editReview", async ({ productId, reviewId, rating, comment }, { rejectWithValue }) => {
  try {
    const response = await api.put(`${import.meta.env.VITE_BACKEND_URL}/api/reviews/${productId}/${reviewId}`, { rating, comment }, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("userToken")}`
      }
    });
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message);
  }
});

export const deleteProductReview = createAsyncThunk("products/deleteReview", async ({ productId, reviewId }, { rejectWithValue }) => {
  try {
    const response = await api.delete(`${import.meta.env.VITE_BACKEND_URL}/api/reviews/${productId}/${reviewId}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("userToken")}`
      }
    });
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message);
  }
});

export const createReviewReply = createAsyncThunk("products/createReply", async ({ productId, reviewId, comment }, { rejectWithValue }) => {
  try {
    const response = await api.post(`${import.meta.env.VITE_BACKEND_URL}/api/reviews/${productId}/${reviewId}/replies`, { comment }, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("userToken")}`
      }
    });
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message);
  }
});

export const editReviewReply = createAsyncThunk("products/editReply", async ({ productId, reviewId, replyId, comment }, { rejectWithValue }) => {
  try {
    const response = await api.put(`${import.meta.env.VITE_BACKEND_URL}/api/reviews/${productId}/${reviewId}/replies/${replyId}`, { comment }, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("userToken")}`
      }
    });
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message);
  }
});

export const deleteReviewReply = createAsyncThunk("products/deleteReply", async ({ productId, reviewId, replyId }, { rejectWithValue }) => {
  try {
    const response = await api.delete(`${import.meta.env.VITE_BACKEND_URL}/api/reviews/${productId}/${reviewId}/replies/${replyId}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("userToken")}`
      }
    });
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message);
  }
});

const reviewsSlice = createSlice({
name : "reviews", 
initialState : {
    loading : false,
    error : null
},
extraReducers : (builder)=>{
    builder
      .addCase(createProductReview.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createProductReview.fulfilled, (state) => {
        state.loading = false;
        // Thành công thì tắt loading. Data mới sẽ được lấy lại thông qua fetchProductDetails
      })
      .addCase(createProductReview.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(editProductReview.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(editProductReview.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(editProductReview.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(deleteProductReview.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteProductReview.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(deleteProductReview.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(createReviewReply.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createReviewReply.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(createReviewReply.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(editReviewReply.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(editReviewReply.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(editReviewReply.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(deleteReviewReply.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteReviewReply.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(deleteReviewReply.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
}
})
export default reviewsSlice.reducer