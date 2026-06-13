<div align="center">
  <h1>⌚ Saatinden - Premium Watch E-Commerce</h1>
  <p><strong>A full-stack, role-based e-commerce platform built for horology enthusiasts.</strong></p>
  <p><i>Developed for the CS 308 Software Engineering Course</i></p>
</div>

<br />

## 📖 Overview

**Saatinden** is a comprehensive, production-ready e-commerce web application designed to deliver an elegant shopping experience for luxury watches. Built with a modern React frontend and a robust Node.js/Express backend, the platform features comprehensive role-based access control, secure payment processing, and an automated testing suite.

## ✨ Key Features

### 🛍️ Customer Experience
* **Authentication & Profiles:** Secure registration and login using JWT. Users can manage their personal information, home addresses, view their unique Customer ID, and monitor their digital Wallet Balance.
* **Shopping Cart & Checkout:** Dynamic cart management with real-time stock validation (preventing negative stock and concurrency issues). Checkout generates automated **PDF invoices** sent directly to the user's email.
* **Order Management & Returns:** Users can track their entire order history and request **selective returns** for individual items within an order (enforced by a 30-day return window limit).
* **Wishlist & Reviews:** Save favorite timepieces for future reference and leave rated reviews on purchased products.

### 🛡️ Admin & Manager Portals
* **Product Managers:** Exclusive dashboard to add new watches (with auto-generated Serial Numbers), update inventory limits, moderate customer reviews (Approve/Reject), and manage delivery statuses.
* **Sales Managers:** Review selective item return requests, authorize refunds directly into the user's digital wallet, set dynamic pricing and percentage-based discounts, and view date-filtered **Revenue & Loss/Profit Charts**.

### 💻 Developer & Architecture Highlights
* **Defensive Programming:** Strict backend validation to prevent race conditions during checkout and bounds checking for inventory.
* **Robust Automated Testing:** A full suite of 28 Unit Tests verifying critical backend logic using Mocha, Chai, and an in-memory MongoDB instance.
* **Security:** Password hashing via bcrypt and role-based route protection middleware.

---

## 🏗️ System Architecture

`mermaid
graph LR
    Client[React Frontend<br/>Vite + CSS] <-->|REST API / JSON| API[Node.js Backend<br/>Express.js]
    API <-->|Mongoose ODM| DB[(MongoDB Atlas)]
    API -->|Nodemailer| Email[SMTP Email Service]
    API -->|PDFKit| Invoice[PDF Generation]
`

---

## 🗄️ Database Schema

`mermaid
erDiagram
    USER ||--o{ ORDER : places
    USER ||--o{ REVIEW : writes
    PRODUCT ||--o{ REVIEW : receives
    PRODUCT }o--|| CATEGORY : belongs_to
    ORDER ||--|{ ORDER_ITEM : contains
    
    USER {
        ObjectId _id
        String firstName
        String email
        String password
        String role "customer, productManager, salesManager"
        Number walletBalance
    }
    PRODUCT {
        ObjectId _id
        String name
        Number price
        Number stock
        String serialNumber
    }
    ORDER {
        ObjectId _id
        ObjectId userId
        Number totalAmount
        String status "Processing, In-Transit, Delivered"
        Date createdAt
    }
`

---

## 🛠️ Technology Stack

* **Frontend:** React 19, Vite, React Router, Recharts, Vanilla CSS
* **Backend:** Node.js, Express.js
* **Database:** MongoDB & Mongoose
* **Testing:** Mocha, Chai, Supertest, MongoDB-Memory-Server
* **Utilities:** PDFKit (Invoicing), Nodemailer (Emails), JSONWebToken (Auth), Bcrypt (Security)

---

## 🚀 Installation & Setup

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) and [MongoDB](https://www.mongodb.com/) installed on your machine.

### 1. Clone the Repository
\\\ash
git clone https://github.com/NakattakaN/CS308-PROJECT.git
cd CS308-PROJECT/308-app
\\\

### 2. Setup the Backend
Open a terminal and navigate to the backend folder:
\\\ash
cd backend
npm install
\\\
Create a \.env\ file in the \ackend/\ directory with your environment variables:
\\\env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
\\\

### 3. Setup the Frontend
Open a new terminal in the project root (\308-app\):
\\\ash
npm install
\\\

---

## 💻 Running the Application

You will need two terminals running simultaneously.

**Start the Backend Server:**
\\\ash
cd backend
npm run dev
\\\

**Start the Frontend Client:**
\\\ash
# In the root directory (308-app)
npm run dev
\\\
The application will be available at \http://localhost:5173\.

---

## 🧪 Running the Unit Tests

This project features a comprehensive suite of unit tests that run on an isolated in-memory database to prevent modifying your actual data.

\\\ash
cd backend
npm test
\\\
*You should see 28 passing tests covering Authentication, Cart Management, Order Processing, Admin controls, and Inventory validation.*
