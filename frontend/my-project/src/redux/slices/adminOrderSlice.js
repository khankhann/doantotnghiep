import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// fetch all product admin order 
export const fetchAllOrders = createAsyncThunk("adminOrders/fetchAllOrders", async(_, {rejectWithValue})=>{
    try {
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/admin/orders`, {
            headers : {
                Authorization : `Bearer ${localStorage.getItem("userToken")}`
            }
        })
        return response.data
    }catch(err){
        console.error(err)
        return rejectWithValue(err.response?.data || err.message)
    }
})

// THÊM MỚI: Fetch chi tiết 1 đơn hàng theo ID
export const fetchOrderDetails = createAsyncThunk(
    "adminOrders/fetchOrderDetails", 
    async(id, {rejectWithValue})=>{
        try {
            const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/admin/orders/${id}`, {
                headers : {
                    Authorization : `Bearer ${localStorage.getItem("userToken")}`
                }
            })
            return response.data
        } catch(err){
            console.error(err)
            return rejectWithValue(err.response?.data || err.message)
        }
    }
)

// update order status 
export const updateOrderStatus = createAsyncThunk("adminOrders/updateOrdersStatus", async({id, status}, {rejectWithValue})=>{
 try{
    const response = await axios.put(`${import.meta.env.VITE_BACKEND_URL}/api/admin/orders/${id}`,{status}, {
        headers : {
            Authorization : `Bearer ${localStorage.getItem("userToken")}`
        }
    })
    return response.data
 }  catch(err){
    console.error(err)
    return rejectWithValue(err.response?.data || err.message)
 } 
})

// delete order 
export const deleteOrder = createAsyncThunk("adminOrders/deleteOrder", async(id , {rejectWithValue})=>{
try {
    await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/api/admin/orders/${id}`, {
        headers : {
            Authorization : `Bearer ${localStorage.getItem("userToken")}`
        }
    })
    return id 
}catch(err){
    console.error(err)
    return rejectWithValue(err.response?.data || err.message)
}
})

export const createPOSOrder = createAsyncThunk(
  "adminOrders/createPOSOrder", 
  async (orderData) => {
    const response = await axios.post(
      `${import.meta.env.VITE_BACKEND_URL}/api/admin/orders/pos`, 
      orderData, 
      {
        headers: {
          Authorization : `Bearer ${localStorage.getItem("userToken")}`
        }
      }
    );
    return response.data;
  }
);

const adminOrderSlice = createSlice({
    name : "adminOrders",
    initialState : {
        orders : [],
        currentOrder : null, // Thêm state lưu chi tiết 1 đơn hàng
        totalOrders : 0,
        totalSales : 0,
        loading : false,
        error : null,
    }, 
    reducers : {},
    extraReducers : (builder)=>{
        builder 
        .addCase(fetchAllOrders.pending, (state)=>{
            state.loading = true 
            state.error = null
        })
        .addCase(fetchAllOrders.fulfilled, (state, action )=>{
            state.loading = false
            state.orders = action.payload
            state.totalOrders = action.payload.length

            // calculate total sale 
            const totalSales = action.payload.reduce((acc, order)=> {
                return acc + (order.totalPrice || 0)
            },0)
            state.totalSales = totalSales
        })
        .addCase(fetchAllOrders.rejected , (state, action)=>{
            state.loading = false
            state.error = action.payload?.message || action.payload
        })

        // THÊM MỚI: Xử lý fetchOrderDetails
        .addCase(fetchOrderDetails.pending, (state) => {
            state.loading = true
            state.error = null
        })
        .addCase(fetchOrderDetails.fulfilled, (state, action) => {
            state.loading = false
            state.currentOrder = action.payload
        })
        .addCase(fetchOrderDetails.rejected, (state, action) => {
            state.loading = false
            state.error = action.payload?.message || action.payload
        })

        // update order status
        .addCase(updateOrderStatus.fulfilled , (state, action )=>{
            const updatedOrder = action.payload
            state.currentOrder = updatedOrder // Cập nhật luôn cho currentOrder nếu đang xem chi tiết
            const orderIndex = state.orders.findIndex((order)=> order._id === updatedOrder._id)
            if(orderIndex !== -1){
                state.orders[orderIndex] = updatedOrder
            }
        })
        // delete order 
        .addCase(deleteOrder.fulfilled , (state , action)=>{
            state.orders = state.orders.filter((order)=> order._id !== action.payload)
        })
        .addCase(createPOSOrder.fulfilled,(state, action)=>{
            state.orders.unshift(action.payload)
        })
    }
})

export default adminOrderSlice.reducer;