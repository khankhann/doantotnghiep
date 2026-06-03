import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// Helper để lấy Token
const getAuthHeader = () => ({
    headers: {
        Authorization: `Bearer ${localStorage.getItem("userToken")}`
    }
});

// 1. Fetch all users
export const fetchUsers = createAsyncThunk("admin/fetchUsers", async (_, { rejectWithValue }) => {
    try {
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/admin/users`, getAuthHeader());
        return response.data;
    } catch (err) {
        return rejectWithValue(err.response?.data?.message || "Không thể tải danh sách người dùng");
    }
});

// 2. Add user (SỬA LỖI BIẾN ERR)
export const addUser = createAsyncThunk("admin/addUser", async (userData, { rejectWithValue }) => {
    try {
        const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/admin/users`, userData, getAuthHeader());
        return response.data;
    } catch (err) {
        // 🔥 Đã sửa: Dùng 'err' thay vì 'error' và chỉ trả về chuỗi văn bản (String)
        const errorMessage = err.response?.data?.message || "Lỗi tạo người dùng";
        return rejectWithValue(errorMessage);
    }
});

// 3. Update user
export const updateUser = createAsyncThunk("admin/updateUser", async (userData, { rejectWithValue }) => {
    try {
        const id = userData.get("id"); 
        const response = await axios.put(`${import.meta.env.VITE_BACKEND_URL}/api/admin/users/${id}`, userData, getAuthHeader());
        return response.data.user;
    } catch (err) {
        return rejectWithValue(err.response?.data?.message || "Cập nhật thất bại");
    }
});

// 4. Delete user
export const deleteUser = createAsyncThunk("admin/deleteUser", async (id, { rejectWithValue }) => {
    try {
        await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/api/admin/users/${id}`, getAuthHeader());
        return id;
    } catch (err) {
        return rejectWithValue(err.response?.data?.message || "Xóa thất bại");
    }
});

const adminSlice = createSlice({
    name: "admin",
    initialState: {
        users: [],
        loading: false,
        error: null,
    },
    reducers: {
        // Thêm cái này để reset lỗi khi cần
        clearAdminError: (state) => {
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder 
        // FETCH
        .addCase(fetchUsers.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(fetchUsers.fulfilled, (state, action) => {
            state.loading = false;
            state.users = action.payload;
        })
        .addCase(fetchUsers.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload; // Payload bây giờ là String
        })

        // UPDATE
        .addCase(updateUser.fulfilled, (state, action) => {
            const updatedUser = action.payload;
            const index = state.users.findIndex((u) => u._id === updatedUser._id);
            if (index !== -1) state.users[index] = updatedUser;
        })

        // DELETE
        .addCase(deleteUser.fulfilled, (state, action) => {
            state.users = state.users.filter((u) => u._id !== action.payload);
        })

        // ADD USER
        .addCase(addUser.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(addUser.fulfilled, (state, action) => {
            state.loading = false;
            // Backend trả về { user: {...} } thì mình push action.payload.user
            if (action.payload.user) {
                state.users.push(action.payload.user);
            }
        })
        .addCase(addUser.rejected, (state, action) => {
            state.loading = false;
            // 🔥 QUAN TRỌNG: Gán thẳng action.payload (là chuỗi lỗi) vào state.error
            state.error = action.payload; 
        });
    }
});

export const { clearAdminError } = adminSlice.actions;
export default adminSlice.reducer;