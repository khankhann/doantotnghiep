import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// async thunk to fetch admin product
export const fetchAdminProducts = createAsyncThunk(
  "adminProducts/fetchAdminProducts",
  async ({search = ""} = {}) => {
    const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/admin/products`, {
      params : {
        search : search
      },
      
      headers: {
        Authorization: `Bearer ${localStorage.getItem("userToken")}`,
      },
    });
    return response.data;
  },
);
 
// async create a new product 
export const createProduct = createAsyncThunk("adminProducts/createProduct", async(productData)=>{
    const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/admin/products`, productData,{
      headers:{
        Authorization : `Bearer ${localStorage.getItem("userToken")}`
      }
    })
 return response.data   
})

// update a existing product 
export const updateProduct = createAsyncThunk("adminProducts/updateProduct", async({id, productData})=>{
const response = await axios.put(`${import.meta.env.VITE_BACKEND_URL}/api/admin/products/${id}`, productData, {
  headers: {
    Authorization : `Bearer ${localStorage.getItem("userToken")}`
  }
})  
return response.data
} )

// async thunk to delete a product 
export const deleteProduct =createAsyncThunk("adminProducts/deleteProduct", async({id})=> {
  await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/api/admin/products/${id}`, {
    headers :{
      Authorization : `Bearer ${localStorage.getItem("userToken")}`
    }
  })
  return id 

})

export const generateProductQR = createAsyncThunk(
  "adminProducts/generateProductQR", 
  async({ id }) => {
    const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/admin/products/${id}/generate-qr`, 
    {}, 
    {
      headers: {
        Authorization : `Bearer ${localStorage.getItem("userToken")}`
      }
    })  
    return { id, qrCodeUrl: response.data.qrCodeUrl };
  }
)

const adminProductSlice = createSlice({
  name : "adminProducts",
  initialState : {
    products : [],
     loading : false,
     error: null,
    },
    reducers : {},
    extraReducers : (builder)=>{
      builder
      .addCase(fetchAdminProducts.pending , (state)=>{
        state.loading = true
      })
      .addCase(fetchAdminProducts.fulfilled , (state, action)=>{
        state.loading = false
        state.products = action.payload
      }).addCase(fetchAdminProducts.rejected , (state, action)=>{
        state.loading = false
        state.error = action.error.message
      })
      // create product 
      .addCase(createProduct.fulfilled, (state, action)=>{
        state.products.push(action.payload)
      })
      // update product 
      .addCase(updateProduct.fulfilled , (state, action)=>{
        const index = state.products.findIndex((product)=> product._id === action.payload._id)
        if(index !== -1){
          state.products[index] = action.payload
        }
      })
      .addCase(deleteProduct.fulfilled, (state, action)=>{
        state.products = state.products.filter((product)=> product._id !== action.payload)
      })
      .addCase(generateProductQR.fulfilled, (state, action) => {
        const index = state.products.findIndex((product) => product._id === action.payload.id)
        if(index !== -1){
          // Cập nhật link QR mới vào sản phẩm trong mảng
          state.products[index].qrCodeUrl = action.payload.qrCodeUrl
        }
      })
    } 
})

export default adminProductSlice.reducer