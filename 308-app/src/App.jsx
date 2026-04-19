import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './LoginPage';
import RegisterPage from './RegisterPage';
import ProductPage from './ProductPage';
import CartPage from './CartPage';
// IMPORTING THE NEW PAGE
import ProductDetailsPage from './ProductDetailsPage';
import PaymentPage from './PaymentPage'; // NEW PAYMENT PAGE
import AboutUsPage from './AboutUsPage';
import AdminPage from './AdminPage';
import Navbar from './Navbar';
import Footer from './Footer';

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

        {/* ABOUT US */}
        <Route path="/about" element={<AboutUsPage />} />

        {/* ADMIN */}
        <Route path="/admin" element={<AdminPage />} />
      </Routes>

      <Footer />
    </Router>
  );
}

export default App;
