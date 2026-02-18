import { createSlice , createAsyncThunk } from "@reduxjs/toolkit";

import api from "../../api/axiosClients";

// load cart from localStorage 
const loadCartFromStorage = () => {
    const storedCart = localStorage.getItem("cart");
    return storedCart ? JSON.parse(storedCart) : {products : [], };



}

// save cart to localStorage 
const saveCartToStorage = (cart) =>{
    localStorage.setItem("cart", JSON.stringify(cart))

}

// fetch cart for user or guest 
export const fetchCart = createAsyncThunk("cart/fetchCart", async({userId , guestId }, {rejectWithValue}) => {
    try {
        const response = await api.get(`${import.meta.env.VITE_BACKEND_URL}/api/cart`,
            {
                params : {
                    userId, guestId
                }
            }
        )
        return response.data
    }catch(err){
        console.error(err)
        return rejectWithValue(err.response.data)
    }
})
// add item to cart for user or guest 
export const addToCart = createAsyncThunk("cart/addToCart", async({productId, quantity, size, color, guestId, userId}, {rejectWithValue})=>{
    try {
        const response = await api.post(`${import.meta.env.VITE_BACKEND_URL}/api/cart`,
            {
                productId, quantity, size, color, guestId, userId
            }
        )
        return response.data
    }catch(err){
        console.error(err)
        return rejectWithValue(err.response.data)
    }
})

// update quanity of item for cart 
export const updateCartItemQuantity = createAsyncThunk("cart/updateCartItemQuantity", async({productId, quantity, guestId, userId, size, color}, {rejectWithValue})=>{
try{
    const response = await api.put(`${import.meta.env.VITE_BACKEND_URL}/api/cart`,
        {productId, quantity, guestId, userId, size, color}
    )
    return response.data
}catch(err){
console.error(err)
return rejectWithValue(err.response.data)
}

})

// delete item from cart 

export const deleteCartItem = createAsyncThunk("cart/deleteCartItem", async({productId, guestId, userId, quantity, size, color}, {rejectWithValue})=>{
    try{
const response = await api({
    method : "delete",
    url : `${import.meta.env.VITE_BACKEND_URL}/api/cart`,
    data : {productId, guestId, userId, quantity, size, color}
})
return response.data
    }catch(err){
console.error(err)
return rejectWithValue(err.response.data)
    }
})

// deleteAllCart  
export const deleteCart = createAsyncThunk("cart/deleteCart", async({userId , guestId}, {rejectWithValue})=>{
    try{
const response = await api.delete(`${import.meta.env.VITE_BACKEND_URL}/api/cart/clear`,{
    data: {userId, guestId}
})
return response.data
    }catch(err){
console.error(err)
return rejectWithValue(err.response.data)
    }
})

// merge guest cart into user cart 
export const mergeCart = createAsyncThunk("cart/mergeCart", async({guestId, userId}, {rejectWithValue})=>{
    try{
        const response = await api.post(`${import.meta.env.VITE_BACKEND_URL}/api/cart/merge`,{
            guestId, userId
        },
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
}
)

const cartSlice = createSlice({
    name :"cart",
    initialState : {
        cart : loadCartFromStorage(),
        loading : false,
        error : null
    },
    reducers :{
        clearCart : (state)=>{
            state.cart = {products : []} ;
             localStorage.removeItem("cart");
        }
    },
    extraReducers : (builder)=>{
        builder
        .addCase(fetchCart.pending, (state)=> {
            state.loading = true 
            state.error = null
        })
        .addCase(fetchCart.fulfilled, (state, action)=> {
            state.loading = false
            state.cart = action.payload
            saveCartToStorage(action.payload)
        })
        .addCase(fetchCart.rejected, (state, action)=> {
            state.loading = false
            state.error = action.payload.message || "Failed to load cart"
        }).addCase(addToCart.pending, (state)=> {
            state.loading = true 
            state.error = null
        })
        .addCase(addToCart.fulfilled, (state, action)=> {
            state.loading = false
            state.cart = action.payload
            saveCartToStorage(action.payload)
        })
        .addCase(addToCart.rejected, (state, action)=> {
            state.loading = false
            state.error = action.payload.message || "Failed to add to cart"
        })
        .addCase(updateCartItemQuantity.pending, (state)=> {
            state.loading = true 
            state.error = null
        })
        .addCase(updateCartItemQuantity.fulfilled, (state, action)=> {
            state.loading = false
            
            state.cart = action.payload
            saveCartToStorage(action.payload)
        })
        .addCase(updateCartItemQuantity.rejected, (state, action)=> {
            state.loading = false
            state.error = action.payload.message || "Failed to update item quanity"
        })
        .addCase(deleteCartItem.pending, (state)=> {
            state.loading = true 
            state.error = null
        })
        .addCase(deleteCartItem.fulfilled, (state, action)=> {
            state.loading = false
            state.cart = action.payload
            saveCartToStorage(action.payload)
        })
        .addCase(deleteCartItem.rejected, (state, action)=> {
            state.loading = false
            state.error = action.payload.message || "Failed to delete item from cart"
        }).addCase(deleteCart.pending, (state)=> {
            state.loading = true 
            state.error = null
        })
        .addCase(deleteCart.fulfilled, (state, action)=> {
            state.loading = false
           const empty = {products : []}
           state.cart = empty
             localStorage.removeItem("cart")
            saveCartToStorage(empty)
        })
        .addCase(deleteCart.rejected, (state, action)=> {
            state.loading = false
            state.error = action.payload.message || "Failed to delete item from cart"
        })
        .addCase(mergeCart.pending, (state)=> {
            state.loading = true 
            state.error = null
        })
        .addCase(mergeCart.fulfilled, (state, action)=> {
            state.loading = false
            state.cart = action.payload
            saveCartToStorage(action.payload)
        })
        .addCase(mergeCart.rejected, (state, action)=> {
            state.loading = false
            state.error = action.payload.message || "Failed to merge cart"
        })
    }
})

export const {clearCart} = cartSlice.actions
export default cartSlice.reducer