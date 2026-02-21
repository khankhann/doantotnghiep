import UserLayout from "@components/Layout/UserLayout/UserLayout";
import HomePage from "@pages/HomePage/HomePage";
import LoginPage from "@pages/LoginPage/LoginPage";
import RegisterPage from "@pages/RegisterPage/RegisterPage";
import ProfilePage from "@pages/ProfilePage/ProfilePage";
import CollectionPage from "@pages/CollectionPage/CollectionPage";
import ProductBestSeller from "@components/Products/ProductBestSeller/ProductBestSeller.jsx";
import CheckOut from "@components/Cart/CheckOut/CheckOut.jsx";
import OrderConfirmation from "@pages/OrderConfirmation/OrderConfirmation";
import OrderDetailPage from "@pages/OrderDetailPage/OrderDetailPage";
import MyOrderPage from "@pages/MyOrderPage/MyOrderPage";
import AdminHomePage from "@components/Admin/AdminHomePage/AdminHomePage";
import UserManagement from "@components/Admin/UserManagement/UserManagement";
import AdminLayout from "@components/Admin/AdminLayout";
import ProductManagement from "@components/Admin/ProductManagement/ProductManagement";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import EditProductPage from "@components/Admin/EditProductPage/EditProductPage";
import OrderPage from "@components/Admin/OrderPage/OrderPage";

import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import { fetchCart } from '@redux/slices/cartSlice';
import ProtectedRoute from "@components/Common/ProtectedRoute/ProtectedRoute";
import CreateProductPage from "@components/Admin/CreateProductPage/CreateProductPage";
function App() {
  const dispatch = useDispatch()
  const {user} = useSelector((state) => state.auth)
  useEffect(()=> {
    const userId = user ? user._id : null
    const guestId = localStorage.getItem("guestId")
    dispatch(fetchCart({
      userId , guestId , collection : "all"
    }))
  },[dispatch, user])
  return (
    
      <BrowserRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/" element={<UserLayout />}>
            {/* User layout */}
            <Route index element={<HomePage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route
              path="collections/:collection"
              element={<CollectionPage />}
            />
            <Route path="product/:id" element={<ProductBestSeller />} />
            <Route path="checkout" element={<CheckOut />} />
            <Route path="order-confirmation" element={<OrderConfirmation />} />
            <Route path="order/:id" element={<OrderDetailPage />} />
            <Route path="/my-orders" element={<MyOrderPage />} />
          </Route>
          <Route path="/admin" element={ <ProtectedRoute role="admin"> <AdminLayout /> </ProtectedRoute>}>
            <Route index element={<AdminHomePage />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="products" element={<ProductManagement />} />
            <Route path="products/:id/edit" element={<EditProductPage />} />
            <Route path="products/create" element={ <CreateProductPage /> }/>
            <Route path="orders" element={<OrderPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
 
  );
}

export default App;
