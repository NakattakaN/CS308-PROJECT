# ⌚ Saatinden (CS308 Project)

An elegant, full-stack e-commerce web application dedicated to luxury watches. Built with a modern React frontend and a robust Node.js/Express backend, featuring comprehensive role-based access control, secure payment processing, and an automated testing suite.

## 🌟 Key Features

### User Experience
* **Authentication & Profiles:** Secure registration and login using JWT. Users can manage their personal information, home addresses, and view their wallet balance.
* **Shopping Cart:** Dynamic cart management with real-time stock validation to prevent over-ordering.
* **Checkout & Invoicing:** Seamless checkout process that generates automated PDF invoices sent directly to the user's email.
* **Order Management & Selective Returns:** Users can view their entire order history and request **selective returns** for individual items within an order, rather than returning the entire purchase.

### Admin & Manager Portals
* **Product Managers:** Have exclusive access to add new watches, update inventory limits, edit watch details, and remove discontinued products.
* **Sales Managers:** Review selective item return requests, approve/reject them, and automatically process refunds directly into the user's digital wallet.

### Developer & Architecture Features
* **RESTful API Architecture:** Clean separation of concerns with domain-driven routing (`/auth`, `/products`, `/orders`, `/cart`, `/admin`).
* **Robust Automated Testing:** A full suite of 28 Unit Tests verifying critical backend logic (orders, stock boundaries, cart limits, access control) using Mocha, Chai, and an in-memory MongoDB instance.
* **Security:** Password hashing via bcrypt and role-based route protection middleware.

---

## 🛠️ Technology Stack

* **Frontend:** React, Vite, Vanilla CSS
* **Backend:** Node.js, Express.js
* **Database:** MongoDB & Mongoose
* **Testing:** Mocha, Chai, Supertest, MongoDB-Memory-Server
* **Utilities:** PDFKit (Invoicing), Nodemailer (Emails), JSONWebToken (Auth)

---

## 🚀 Installation & Setup

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) and [MongoDB](https://www.mongodb.com/) installed on your machine.

### 1. Clone the Repository
```bash
git clone <repository-url>
cd 308-app
```

### 2. Setup the Backend
Open a terminal and navigate to the backend folder:
```bash
cd backend
npm install
```
Create a `.env` file in the `backend/` directory with the following variables:
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

### 3. Setup the Frontend
Open a new terminal in the project root (`308-app`):
```bash
npm install
```

---

## 💻 Running the Application

You will need two terminals running simultaneously.

**Start the Backend Server:**
```bash
cd backend
npm run dev
```

**Start the Frontend Client:**
```bash
# In the root directory (308-app)
npm run dev
```
The application will be available at `http://localhost:5173`.

---

## 🧪 Running the Unit Tests (20% Dev Activities)

This project features a comprehensive suite of unit tests that run on an isolated in-memory database to prevent modifying your actual data.

To execute the tests:
```bash
cd backend
npm test
```
*You should see 28 passing tests covering Authentication, Cart Management, Order Processing, Admin controls, and Inventory validation.*

---

## 👥 Roles & Accounts

To fully test the application, you can assign different roles to users in the database (`role: 'user'`, `role: 'product_manager'`, or `role: 'sales_manager'`).

* **Users:** Can browse products, add to cart, checkout, view orders, and request returns.
* **Product Managers:** Can view the "Manage Products" dashboard to alter inventory.
* **Sales Managers:** Can view the "Manage Returns" dashboard to approve item returns.
