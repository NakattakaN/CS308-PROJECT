import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './LoginPage';
import RegisterPage from './RegisterPage';
import ProductPage from './ProductPage';
import CartPage from './CartPage';
// IMPORTING THE NEW PAGE
import ProductDetailsPage from './ProductDetailsPage';
import PaymentPage from './PaymentPage'; // NEW PAYMENT PAGE
import AdminReviewsPage from './AdminReviewsPage';
import Navbar from './Navbar';

function App() {
  return (
    <Router>
      <Navbar />

      <Routes>
        <Route path="/cart" element={<CartPage />} />
        <Route path="/" element={<Navigate to="/home" />} />
        <Route path="/home" element={<ProductPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* NEW ROUTE: Set up to take a dynamic ID */}
        <Route path="/product/:id" element={<ProductDetailsPage />} />

        {/* PAYMENT PAGE ROUTE */}
        <Route path="/payment" element={<PaymentPage />} />

        {/* ADMIN MODERATION PANEL */}
        <Route path="/admin/reviews" element={<AdminReviewsPage />} />
      </Routes>
    </Router>
  );
}

export default App;