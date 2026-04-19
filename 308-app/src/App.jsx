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
import InvoicePage from './InvoicePage';
import Navbar from './Navbar';
import Footer from './Footer';
import { ToastProvider } from './Toast';

function App() {
  return (
    <ToastProvider>
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

        {/* INVOICE */}
        <Route path="/invoice/:orderId" element={<InvoicePage />} />

        {/* ADMIN */}
        <Route path="/admin" element={<AdminPage />} />
      </Routes>

      <Footer />
    </Router>
    </ToastProvider>
  );
}

export default App;
