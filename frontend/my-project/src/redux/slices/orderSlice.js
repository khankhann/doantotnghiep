import { createSlice , createAsyncThunk } from "@reduxjs/toolkit";

import api from "../../api/axiosClients";

// async thunk fetch user orders 

export const fetchUserOrder = createAsyncThunk("orders/fetchUserOrder", async(_,{rejectWithValue})=>{
    try {
        const response = await api.get(`${import.meta.env.VITE_BACKEND_URL}/api/orders/my-orders`,
            {
                headers : {
                    Authorization : `Bearer ${localStorage.getItem("userToken")}`
                }
            }
        )
    
    return response.data
    }catch(err){
        console.error(err)
        return rejectWithValue(err.response.data)
    }
})

// async thunk fetch orders detail by id 
export const fetchOrderDetails = createAsyncThunk("orders/fetchOrderDetails", async(orderId, {rejectWithValue})=>{
    try{
        const response = await api.get(`${import.meta.env.VITE_BACKEND_URL}/api/orders/${orderId}`, {
            headers : {

                Authorization : `Bearer ${localStorage.getItem("userToken")}`
            }
        })
        return response.data
    }catch(err){
        console.error(err)
        return rejectWithValue(err.response.data)
    }
})


// Thunk: Xoá đơn hàng
export const deleteOrder = createAsyncThunk(
  "orders/deleteOrder",
  async (orderId, { rejectWithValue }) => {
    try {
      // 1. Lấy token y chang mấy hàm khác của fen
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

      // 2. Gọi API DELETE xuống Backend
      await api.delete(
        `${import.meta.env.VITE_BACKEND_URL}/api/orders/${orderId}`,
        config
      );

      // 3. Trả về đúng cái ID vừa xoá để Redux biết đường mà gỡ ra khỏi giao diện
      return orderId;
    } catch (error) {
      return rejectWithValue(
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message
      );
    }
  }
);



const orderSlice = createSlice({
    name : "orders", 
    initialState : {
        orders : [],
        totalOrders : 0,
        orderDetails : null,
        loading : false ,
        error : null
    },
    reducers : {},
    extraReducers : (builder) =>{
        builder 
        .addCase(fetchUserOrder.pending , (state)=>{
            state.loading = true,
            state.error = null
        })
        .addCase(fetchUserOrder.fulfilled , (state, action)=>{
            state.loading = false,
            state.orders = action.payload
        })
        .addCase(fetchUserOrder.rejected , (state, action)=>{
            state.loading = false,
            state.error = action.payload.message
        })
        .addCase(fetchOrderDetails.pending , (state)=>{
            state.loading = true,
            state.error = null
        })
        .addCase(fetchOrderDetails.fulfilled , (state, action)=>{
            state.loading = false,
            state.orderDetails = action.payload
        })
        .addCase(fetchOrderDetails.rejected , (state, action)=>{
            state.loading = false,
            state.error = action.payload.message
        })
        .addCase(deleteOrder.pending, (state) => {
        // Tùy fen có muốn hiện loading lúc xoá không, thường thì để im cho mượt
      })
      .addCase(deleteOrder.fulfilled, (state, action) => {
        const deletedOrderId = action.payload;
        // Lọc bỏ cái đơn hàng có ID trùng với ID vừa bị xoá
        if (state.orders) {
          state.orders = state.orders.filter(
            (order) => order._id !== deletedOrderId
          );
        }
      })
      .addCase(deleteOrder.rejected, (state, action) => {
        state.error = action.payload;
        // Có thể thêm toast/alert báo lỗi xoá thất bại ở đây nếu muốn
      });
    }
})
export default orderSlice.reducer