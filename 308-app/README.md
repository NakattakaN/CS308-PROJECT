# ⌚ Saatinden | Watch Marketplace
**The premier marketplace for horology enthusiasts.**

This repository contains the full-stack implementation of the **Saatinden** Watch Store, developed for the **Sabancı University CS 308 (Software Engineering)** course. 

---

## 🚀 Sprint 2 Status (April 2026)
The core backend API has been successfully integrated with the React frontend. Current features include:

- **Secure Authentication**: JWT-based login with `bcrypt` password encryption.
- **Product Catalog**: Dynamic watch inventory (Rolex, Casio, Apple Watch) with category support.
- **Search Logic**: Server-side filtering by model, brand, and description.
- **Database Integration**: Live connection to MongoDB Atlas for real-time data persistence.

---

## 🛠 Tech Stack

| Component | Technology |
| :--- | :--- |
| **Frontend** | ReactJS, CSS Modules |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB Atlas |
| **Security** | JSON Web Tokens (JWT), Bcrypt |
| **Tools** | Git, VS Code, Postman |

---

## 📂 Project Structure

```text
.
├── 308-app/              # React Frontend Application
│   ├── src/
│   │   ├── LoginPage.jsx  # Integrated Login Component
│   │   └── main.jsx       # React Entry Point
│   └── index.html         # SPA Shell
└── server/                # Node.js Backend Server
    ├── models/            # Mongoose Schemas (User.js, Product.js)
    ├── routes/            # API Endpoints (authRoutes.js)
    ├── index.js           # Express Server Entry Point
    └── seed.js            # Database Seeding Script





## ⚙️ Setup and Installation

### 1. Clone & Branching
Ensure you are working on the correct feature branch for development tracking.

```bash
git clone [https://github.com/NakattakaN/CS308-PROJECT.git](https://github.com/NakattakaN/CS308-PROJECT.git)
git checkout taha.bayraktar

cd server
npm install
node index.js





## 🛡 Security & Defensive Programming
In compliance with CS 308 requirements:

* **Sensitive Data**: Passwords are never stored in plain text (Encrypted via Bcrypt).
* **Environment Safety**: Database credentials and secrets are managed via `.env` and ignored by Git.
* **Branch Protection**: Direct pushes to `main` are avoided; all work is integrated through the `taha.bayraktar` feature branch to maintain system stability.

## 👥 Contributors
* **Taha Bayraktar** - Backend Architecture & Database Integration
* **Team Members** - Frontend UI/UX & React Components
