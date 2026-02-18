import axios from "axios";
import {createSlice , createAsyncThunk} from "@reduxjs/toolkit";
import api from "../../api/axiosClients";

// async thunk  create a check out session  

export const createCheckout = createAsyncThunk("checkout/createCheckout", async(checkoutData, {rejectWithValue})=>{
        try { 
            const response = await api.post(`${import.meta.env.VITE_BACKEND_URL}/api/checkout`,
                checkoutData,


                {
                    headers : {
                        Authorization : `Bearer ${localStorage.getItem("userToken")}`,
                    }
                }
            )
            return response.data

        }catch(err){
            console.error(err)
            return rejectWithValue(err.response.data)

        }
})


const checkoutSlice = createSlice({
        name : "checkout",
        initialState : {
            checkout : null,
            Loading: false,
            error : null
        },
        reducers : {},
        extraReducers: (builder)=>{
            builder
            .addCase(createCheckout.pending, (state)=>{
                state.Loading = true,
                state.error = null

            })
            .addCase(createCheckout.fulfilled , (state, action)=>{
                state.Loading = false,
                state.checkout = action.payload 
            })
            .addCase(createCheckout.rejected , (state, action)=>{
                state.Loading = false,
                state.error = action.payload.message 
            })
        }
})

export default checkoutSlice.reducer