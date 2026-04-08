import {configureStore} from "@reduxjs/toolkit";
import authReducer from "@redux/slices/authSlice";
import productReducer from "@redux/slices/productsSlice";
import cartReducer from "@redux/slices/cartSlice";
import checkoutReducer from "@redux/slices/checkoutSlice";
import orderReducer from "@redux/slices/orderSlice";
import adminReducer from "@redux/slices/adminSlice";
import adminProductReducer from "@redux/slices/adminProductSlice";
import adminOrderReducer from "@redux/slices/adminOrderSlice";
import notificationReducer from "@redux/slices/notificationSlice";
import newsReducer from "@redux/slices/newsSlice";
import reviewsReducer from "@redux/slices/reviewsSlice"
import chatReducer from "@redux/slices/chatSlice"
import adminChatReducer from "@redux/slices/adminChatSlice"
import visualSearchReducer from "@redux/slices/visualSearchSlice"
import iotSensorReducer from "@redux/slices/iotSensorSlice"
const store = configureStore({
    reducer : {
        auth : authReducer,
        products : productReducer,
        cart : cartReducer,
        checkout : checkoutReducer,
        orders : orderReducer,
        admin : adminReducer ,
        adminProducts : adminProductReducer ,
        adminOrders : adminOrderReducer ,
        notifications : notificationReducer,
        news : newsReducer,
        reviews : reviewsReducer,
        chat : chatReducer,
        adminChat : adminChatReducer,
        visualSearch : visualSearchReducer,
        iotSensor : iotSensorReducer
    }
}) 
export default store;   