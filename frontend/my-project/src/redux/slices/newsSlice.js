import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from "../../api/axiosClients";



export const fetchNews = createAsyncThunk("news/fetchNews", async (_, {rejectWithValue})=>{

    try {
        const response = await api.get(`${import.meta.env.VITE_BACKEND_URL}/api/news`)
        return response.data
    }catch(error){
        return rejectWithValue(error.response?.data?.message )
    }
})


// lay chi tiet bai viet theo slug 

export const fetchNewsBySlug = createAsyncThunk("news/fetchNewsBySlug", async(slug , {rejectWithValue})=>{
    try {
const response = await api.get(`${import.meta.env.VITE_BACKEND_URL}/api/news/${slug}`)
return response.data

    }catch(error){
        return rejectWithValue(error.response?.data?.message )
    }
})


// them bai viet moi 
// private - token admin 

export const createNews = createAsyncThunk("news/createNews", async (newsData , {rejectWithValue})=>{

try{
    const response = await api.post(`${import.meta.env.VITE_BACKEND_URL}/api/news`, newsData,{
        headers  : {
            Authorization : `Bearer ${localStorage.getItem("userToken")}`
        }

    })
    return response.data

}catch(error){
    return rejectWithValue(error.response?.data?.message )
}

})


// update bai viet 
export const updateNews = createAsyncThunk("news/updateNews", async({id, newsData}, {rejectWithValue})=>{
    try {
        const response = await api.put(`${import.meta.env.VITE_BACKEND_URL}/api/news/${id}`, newsData, {
            headers : {
                Authorization : `Bearer ${localStorage.getItem("userToken")}`
            }
        })
        return response.data
    }catch(error){
        return rejectWithValue(error.response?.data?.message )
    }
})

// xoa bai viet 
export const deleteNews = createAsyncThunk("news/deleteNews", async(id, {rejectWithValue})=>{
    try{
const response = await api.delete(`${import.meta.env.VITE_BACKEND_URL}/api/news/${id}`, {
    headers : {
        Authorization : `Bearer ${localStorage.getItem("userToken")}`
    }
})
return id
    }catch(error){
        return rejectWithValue(error.response?.data?.message )
    }
})

const newsSlice = createSlice({
    name : "news", 
    initialState : {
        newsList : [], 
        newsDetail : null , 
        loading : false,
        error : null,
    },
    reducers : {},
    extraReducers : (builder)=>{
        builder 
        .addCase(fetchNews.pending, (state)=>{
            state.loading = true
            state.error = null
        })
        .addCase(fetchNews.fulfilled, (state,action)=>{
            state.loading = false
            state.newsList = action.payload
        })
        .addCase(fetchNews.rejected, (state , action)=>{
            state.loading = false
            state.error = action.payload
        })
        .addCase(fetchNewsBySlug.pending, (state)=>{
            state.loading = true  
            state.error = null
        })
        .addCase(fetchNewsBySlug.fulfilled, (state, action)=>{
            state.loading = false
            state.newsDetail = action.payload
        })
        .addCase(fetchNewsBySlug.rejected, (state,action)=>{
            state.loading = false
            state.error = action.payload
        })
        .addCase(createNews.pending, (state)=>{
            state.loading = true
            state.error = null
        })
        .addCase(createNews.fulfilled, (state, action)=>{
            state.loading = false
            state.newsList.unshift(action.payload)  // unshift de them vao dau danh sach
        })
        .addCase(createNews.rejected, (state, action)=>{
            state.loading = false
            state.error = action.payload
        })
         .addCase(updateNews.pending, (state)=>{
            state.loading = true
            state.error = null
        })
        .addCase(updateNews.fulfilled, (state, action)=>{
            state.loading = false
            const index = state.newsList.findIndex(news => news._id === action.payload._id)
            if(index !== -1){
                state.newsList[index] = action.payload
            }
        })
        .addCase(updateNews.rejected, (state, action)=>{
            state.loading = false
            state.error = action.payload
        })
        .addCase(deleteNews.pending, (state)=>{
            state.loading = true
            state.error = null
        })
        .addCase(deleteNews.fulfilled, (state, action)=>{
            state.loading = false
            state.newsList = state.newsList.filter(news => news._id !== action.payload)
        })
        .addCase(deleteNews.rejected, (state, action)=>{
            state.loading = false
            state.error = action.payload
         })
    }

})

export default newsSlice.reducer


