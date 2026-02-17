import axios from "axios";

const api = axios.create({
    baseURL : import.meta.env.VITE_BACKEND_URL,
    headers : {
        "Content-Type" : "application/json"
    }
})

api.interceptors.request.use(
    async(config) => {
        try {
            const token = await localStorage.getItem("userToken")
            if(token){
                config.headers.Authorization = `Bearer ${token}`
            }
            return config
        }catch(error){
            console.error(error)
        }
    }
) 


api.interceptors.response.use(
   (response) => response ,  
   async(error) => {
    const originalRequest = error.config;
    if(error.response?.status === 401 && !originalRequest._retry){
        originalRequest._retry = true 

        try {
            const refreshToken = localStorage.getItem("refreshToken")

            if(!refreshToken){
                // k co refeshToken thi chco dang nhap lai 
                localStorage.removeItem("userToken")
                localStorage.removeItem("refreshToken")
                window.location.href("/login")
                return Promise.reject(error)
            }
            const response = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/api/users/refresh-token`,{refreshToken}
            )

            // lay new accessToken 
            const newAccessToken = response.data.accessToken
            localStorage.setItem("userToken", newAccessToken)
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`

            return api(originalRequest)
        }catch(error){
            console.error("phien dang nhap het han" , error)
            localStorage.removeItem("userToken")
            localStorage.removeItem("refreshToken")
            localStorage.removeItem("userInfo")
            window.location.href("/login")
            return Promise.reject(error)
        }
    }
    return Promise.reject(error)
   }
)
export default api 