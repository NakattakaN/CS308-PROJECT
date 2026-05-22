#  Saatinden

> Discover your next timepiece. Saatinden is a comprehensive e-commerce platform designed for browsing, purchasing, and managing a curated collection of premium and everyday watches. Developed for the CS 308 Software Engineering course.

---

##  Table of Contents

* [About the Project](#-about-the-project)
* [Core Features](#-core-features)
* [Tech Stack](#-tech-stack)
* [Database Schema Outline](#-database-schema-outline)
* [Installation & Setup](#-installation--setup)
* [Development Lifecycle](#-development-lifecycle)

---

##  About the Project
**Saatinden** is a full-stack digital storefront dedicated to horology enthusiasts and casual buyers alike. The platform provides a seamless shopping experience, allowing users to browse watches by brand, movement type (automatic, manual, quartz), and style. 

Beyond the customer-facing storefront, Saatinden includes a robust administrative backend for inventory management, order tracking, and dynamic pricing adjustments, fulfilling the complex requirements of a modern software engineering architecture.

##  Core Features

### For Customers (Frontend)
* **Advanced Product Filtering:** Sort and filter watches by brand, price range, movement type, case material, and water resistance.
* **Shopping Cart & Checkout:** Persistent cart sessions with a simulated secure payment gateway.
* **User Profiles:** Customers can create accounts, save their shipping details, and view their order history.
* **Wishlist:** Save favorite timepieces for future reference or purchase, with instant add/remove from any product page and a dedicated wishlist view.

### For Administrators (Backend/Dashboard)
* **Inventory Management:** Add, edit, or remove watch listings, including uploading high-resolution images and updating stock counts.
* **Order Fulfillment:** Track user orders from placement to delivery status.
* **Sales Analytics:** View basic metrics on total revenue and best-selling watch models.

##  Tech Stack
The application is built using a modern JavaScript ecosystem to ensure high performance and responsive design:
* **Frontend:** HTML5, CSS3, JavaScript (ES6+), [React/Vue]
* **Backend:** Node.js, Express.js
* **Database:** [MongoDB]
* **Authentication:** JSON Web Tokens (JWT) & bcrypt for secure password hashing
* **Tools:** Git, GitHub Actions (CI/CD), Postman

##  Database Schema Outline
The data architecture relies on three primary models:
1. **Users:** Handles authentication credentials, shipping addresses, and role-based access (Customer vs. Admin).
2. **Products (Watches):** Stores SKU, brand, model name, price, stock quantity, specifications (movement, dial color, strap), and image URLs.
3. **Orders:** Links Users to Products, tracking total cost, payment status, and shipping milestones.

---

##  Installation & Setup

Because this is a full-stack application, you will need to run both the backend API and the frontend development server simultaneously in separate terminal windows.

### 1. Clone the repository
```bash
git clone [https://github.com/NakattakaN/CS308-PROJECT.git](https://github.com/NakattakaN/CS308-PROJECT.git)
cd CS308-PROJECT/308-app
