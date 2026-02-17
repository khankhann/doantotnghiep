import { createSlice , createAsyncThunk } from "@reduxjs/toolkit";
import axios  from "axios";
import api from "../../api/axiosClients";

// async thunk fetch user orders 

export const fetchUserOrder = createAsyncThunk("orders/fetchUserOrder", async( {rejectWithValue})=>{
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
    }
})
export default orderSlice.reducer