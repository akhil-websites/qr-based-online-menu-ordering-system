import React, { useContext } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { CartProvider } from "./CartContext";
import { AuthProvider, AuthContext } from "./AuthContext";
import Navbar from "./Navbar";
import Footer from "./Footer";
import HomePage from "./HomePage";
import Cart from "./Cart";
import Veg from "./Veg";
import NonVeg from "./NonVeg";
import Desserts from "./Desserts";
import IceCream from "./IceCream";
import Drinks from "./Drinks";
import Starters from "./Starters";
import Auth from "./Auth";
import Order from "./Order";
import Profile from "./Profile";
import AdminPanel from "./AdminPanel";
import CategoryManage from "./CategoryManage";
import OrderHistory from "./OrderHistory"; 
import Users from "./Users";
import Qrcode from "./QRCode";
import Menu from "./Menu";
import ItemDetails from "./ItemDetails"; // ✅ Import ItemDetails Component
import CouponHistory from "./CouponHistory";
import Table from "./Tables";
import Coupons from "./Coupons";
import History from "./tablehistory";
import "./Hero.css";
import "./Footer.css";

// ✅ Protected Routes for Logged-In Users
const ProtectedRoute = ({ children }) => {
  const { user } = useContext(AuthContext);
  return user ? children : <Navigate to="/auth" replace />;
};

// ✅ Protected Routes for Admin Only
const AdminRoute = ({ children }) => {
  const { user } = useContext(AuthContext);
  const isAdmin = user && localStorage.getItem("userRole") === "admin";
  return isAdmin ? children : <Navigate to="/" replace />;
};

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Navbar />

        <Routes>
          {/* ✅ Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/auth" element={<Auth />} />

          {/* ✅ User-Protected Routes */}
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
          <Route path="/order" element={<ProtectedRoute><Order /></ProtectedRoute>} />

          {/* ✅ Food Categories */}
          <Route path="/veg" element={<ProtectedRoute><Veg /></ProtectedRoute>} />
          <Route path="/nonveg" element={<ProtectedRoute><NonVeg /></ProtectedRoute>} />
          <Route path="/desserts" element={<ProtectedRoute><Desserts /></ProtectedRoute>} />
          <Route path="/icecream" element={<ProtectedRoute><IceCream /></ProtectedRoute>} />
          <Route path="/drinks" element={<ProtectedRoute><Drinks /></ProtectedRoute>} />
          <Route path="/starters" element={<ProtectedRoute><Starters /></ProtectedRoute>} />
          <Route path="/menu" element={<ProtectedRoute><Menu /></ProtectedRoute>} />

          {/* ✅ Dynamic Item Details Route */}
          <Route path="/:category/:itemId" element={<ProtectedRoute><ItemDetails /></ProtectedRoute>} />

          {/* ✅ Admin-Only Routes */}
          <Route path="/admin" element={<AdminRoute><AdminPanel /></AdminRoute>} />
          <Route path="/admin/category/:category" element={<AdminRoute><CategoryManage /></AdminRoute>} />
          <Route path="/admin/order-history" element={<AdminRoute><OrderHistory /></AdminRoute>} />
          <Route path="/admin/users" element={<AdminRoute><Users /></AdminRoute>} />
          <Route path="/admin/qrcode" element={<AdminRoute><Qrcode /></AdminRoute>} />
          <Route path="/admin/coupon" element={<AdminRoute><Coupons /></AdminRoute>} />
          <Route path="/admin/coupons-history" element={<AdminRoute><CouponHistory /></AdminRoute>} />
          <Route path="/admin/table-management" element={<AdminRoute><Table /></AdminRoute>} />
          <Route path="/history" element={<AdminRoute><History /></AdminRoute>} />



          {/* ✅ Redirect Unknown Routes */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        <Footer />
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
