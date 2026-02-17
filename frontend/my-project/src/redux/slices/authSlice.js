import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import api from "../../api/axiosClients";

// retrieve user info and token from localstorage if valiable

const userFromStorage = localStorage.getItem("userInfo")
  ? JSON.parse(localStorage.getItem("userInfo"))
  : null;
// check for existing guest id in the localStorage or generate a new one 
const initialGuestId = localStorage.getItem("guestId") || `guest_${new Date().getTime()}`;
localStorage.setItem("guestId", initialGuestId)

// init state 
const initialState = {
    user : userFromStorage,
    guestId : initialGuestId,
    loading : false,
    error: null
}
// async thunk for user register
export const registerUser =  createAsyncThunk("auth/registerUser", async(userData, {rejectWithValue})=>{
    try {
        const response = await api.post(`${import.meta.env.VITE_BACKEND_URL}/api/users/register`,
             userData)
             localStorage.setItem("userInfo", JSON.stringify(response.data.user))
             localStorage.setItem("userToken", response.data.accessToken)
             return response.data.user      // return user data object from the response

    }catch(err){
        return rejectWithValue(err.response.data)
    }
})

// async thunk for user login 
export const loginUser =  createAsyncThunk("auth/loginUser", async(userData, {rejectWithValue})=>{
    try {
        const response = await api.post(`${import.meta.env.VITE_BACKEND_URL}/api/users/login`,
             userData)
             localStorage.setItem("userInfo", JSON.stringify(response.data.user))
             localStorage.setItem("userToken", response.data.accessToken)
             localStorage.setItem("refreshToken", response.data.refreshToken)
             return response.data.user      // return user data object from the response

    }catch(err){
        return rejectWithValue(err.response.data)
    }
})

// slice 
const authSlice = createSlice ({
    name : "auth",
    initialState, 
    reducers : {
        logout: (state)=> {
            state.user = null,
            state.guestId = `guest_${new Date().getTime()}` // reset guestId on logout
            localStorage.removeItem("userInfo")
            localStorage.removeItem("userToken")
            localStorage.removeItem("refreshToken")
            localStorage.setItem("guestId", state.guestId) // set new guestId in localStorage
        },
        generateNewGuestId : (state)=>{
            state.guestId = `guest_${new Date().getTime()}`
            localStorage.setItem("guestId", state.guestId)
        }
    },
    extraReducers :  (builder)=>{
        builder.addCase(loginUser.pending , (state)=>{
            state.loading = true;
            state.error = null
        })
        .addCase(loginUser.fulfilled, (state, action)=>{
            state.loading = false
            state.user = action.payload
        })
        .addCase(loginUser.rejected , (state, action)=>{
            state.loading= false
            state.error = action.payload.message 
        }).addCase(registerUser.pending , (state)=>{
            state.loading = true;
            state.error = null
        })
        .addCase(registerUser.fulfilled, (state, action)=>{
            state.loading = false
            state.user = action.payload
        })
        .addCase(registerUser.rejected , (state, action)=>{
            state.loading= false
            state.error = action.payload.message 
        })
    }
})
export const {logout, generateNewGuestId} = authSlice.actions
export default authSlice.reducer;