import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/axiosClients";

// Lấy thông tin user từ localStorage an toàn (chống lỗi "undefined" is not valid JSON)
const userInfoStr = localStorage.getItem("userInfo");
const userFromStorage = (userInfoStr && userInfoStr !== "undefined")
  ? JSON.parse(userInfoStr)
  : null;

// check for existing guest id in the localStorage or generate a new one 
const initialGuestId = localStorage.getItem("guestId") || `guest_${new Date().getTime()}`;
localStorage.setItem("guestId", initialGuestId);

// init state 
const initialState = {
    user : userFromStorage,
    guestId : initialGuestId,
    loading : false,
    error: null
};

// ==========================================
// async thunk for user register (ĐÃ SỬA: Không lưu localStorage nữa)
// ==========================================
export const registerUser = createAsyncThunk("auth/registerUser", async (userData, { rejectWithValue }) => {
    try {
        const response = await api.post(`${import.meta.env.VITE_BACKEND_URL}/api/users/register`, userData);
        
        // BỎ: Không lưu userInfo và userToken ở đây nữa vì user cần phải check mail xác thực
        // Chỉ trả về data để UI (trang Register) nhận được thông báo "Vui lòng check mail..."
        return response.data; 

    } catch (err) {
        return rejectWithValue(err.response?.data || { message: "Lỗi kết nối!" });
    }
});

// ==========================================
// async thunk for user login (Giữ nguyên)
// ==========================================
export const loginUser = createAsyncThunk("auth/loginUser", async (userData, { rejectWithValue }) => {
    try {
        const response = await api.post(`${import.meta.env.VITE_BACKEND_URL}/api/users/login`, userData);
        localStorage.setItem("userInfo", JSON.stringify(response.data.user));
        localStorage.setItem("userToken", response.data.accessToken);
        localStorage.setItem("refreshToken", response.data.refreshToken);
        
        return response.data.user; // return user data object from the response

    } catch (err) {
        return rejectWithValue(err.response?.data || { message: "Lỗi kết nối!" });
    }
});

// slice 
const authSlice = createSlice ({
    name : "auth",
    initialState, 
    reducers : {
        logout: (state)=> {
            state.user = null;
            state.guestId = `guest_${new Date().getTime()}`; // reset guestId on logout
            localStorage.removeItem("userInfo");
            localStorage.removeItem("userToken");
            localStorage.removeItem("refreshToken");
            localStorage.setItem("guestId", state.guestId); // set new guestId in localStorage
        },
        generateNewGuestId : (state)=>{
            state.guestId = `guest_${new Date().getTime()}`;
            localStorage.setItem("guestId", state.guestId);
        },
        updateCurrentUser : (state, action)=>{
            state.user = {...state.user, ...action.payload};
            localStorage.setItem("userInfo", JSON.stringify(state.user));
        }
    },
    extraReducers : (builder) => {
        builder
        // LOGIN
        .addCase(loginUser.pending , (state)=>{
            state.loading = true;
            state.error = null;
        })
        .addCase(loginUser.fulfilled, (state, action)=>{
            state.loading = false;
            state.user = action.payload; // Login thành công thì mới set user vào state
        })
        .addCase(loginUser.rejected , (state, action)=>{
            state.loading = false;
            state.error = action.payload?.message || "Lỗi đăng nhập";
        })
        
        // REGISTER
        .addCase(registerUser.pending , (state)=>{
            state.loading = true;
            state.error = null;
        })
        .addCase(registerUser.fulfilled, (state, action)=>{
            state.loading = false;
           state.successMessage = action.payload.message;
        })
        .addCase(registerUser.rejected , (state, action)=>{
            state.loading = false;
            state.error = action.payload?.message || "Lỗi đăng ký";
        });
    }
});

export const { logout, generateNewGuestId, updateCurrentUser } = authSlice.actions;
export default authSlice.reducer;