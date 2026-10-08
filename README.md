# Apex Digital Bank - Full Stack Banking Management System

A production-ready, full-stack enterprise **Banking Management System** built with **HTML5, CSS3, JavaScript, Node.js, Express.js, and MySQL**. Features a modern financial dashboard, JWT authentication, bcrypt password security, OTP verification, ACID money transfers, Chart.js visual analytics, PDF bank statement downloads, and an Admin control panel.

---

## 🌟 Key Features

### 🎨 Frontend (Client)
- **Modern Banking UI/UX**: Professional financial design system with curated HSL color tokens, glassmorphism, and responsive grid layouts.
- **Dark/Light Mode**: Smooth theme toggling with preference persistence.
- **Dashboard Analytics**: Chart.js graphs displaying monthly cash flow (Income vs Expenses).
- **PDF Bank Statement Generator**: Export official bank statements formatted with customer details, transaction table, and balances using `jsPDF`.
- **Dynamic Animations**: Animated count-up for account balance, loading skeletons, and interactive toast notification stack.
- **Responsive Layout**: Mobile-friendly sidebar drawer and responsive tables.

### ⚙️ Backend & API (Server)
- **MVC Architecture**: Modular Separation of Concerns (Routes, Controllers, Models, Middleware, Config).
- **JWT Authentication**: Signed JSON Web Tokens passed via HTTP Bearer headers.
- **Password Security**: Strong password hashing using `bcryptjs` (salt round 10).
- **ACID Money Transfers**: Database transactions (`START TRANSACTION`, `COMMIT`, `ROLLBACK`) ensuring atomic, consistent money movement between accounts.
- **OTP Verification**: 6-digit OTP code generation for registration and high-security transfers.
- **Input Sanitization**: Server-side validation for account numbers, positive transfer amounts, email formats, and passwords.
- **Admin Control Panel**: Real-time platform KPI metrics (Total Users, Total Deposits, Total System Volume), user management with account block/unblock capabilities, and global audit logs.

---

## 📁 Directory Structure

```text
banking-system/
├── client/                     # Frontend SPA Files
│   ├── css/
│   │   ├── variables.css       # Design tokens & Light/Dark themes
│   │   ├── main.css            # Base resets & layout shell
│   │   ├── components.css     # Buttons, Cards, Modals, Toasts, Tables
│   │   └── pages.css           # Page-specific grids
│   ├── js/
│   │   ├── api.js              # Unified Fetch API client + JWT headers
│   │   ├── ui.js               # Toasts, Modals, Theme switcher, Counter animation
│   │   ├── auth.js             # Auth state handlers & OTP modal logic
│   │   ├── dashboard.js        # Balance counters & Chart.js graph
│   │   ├── transactions.js     # Search, filters, pagination, jsPDF generator
│   │   ├── admin.js            # Admin metrics & user block/unblock
│   │   └── app.js              # SPA Router & main setup
│   └── index.html              # Main HTML container with all views
├── server/                     # Backend Node.js Express API
│   ├── config/
│   │   ├── db.js               # MySQL connection pool (mysql2/promise)
│   │   └── jwt.js              # JWT secrets configuration
│   ├── controllers/            # Controller business logic
│   │   ├── authController.js
│   │   ├── accountController.js
│   │   ├── transactionController.js
│   │   ├── userController.js
│   │   └── adminController.js
│   ├── middleware/             # Express middlewares
│   │   ├── authMiddleware.js   # JWT verification & Admin role guard
│   │   ├── validateMiddleware.js # Input sanitization
│   │   └── errorMiddleware.js  # Global error handler
│   ├── models/                 # Database SQL Query models
│   │   ├── userModel.js
│   │   ├── accountModel.js
│   │   ├── transactionModel.js
│   │   ├── otpModel.js
│   │   └── notificationModel.js
│   ├── routes/                 # Express API routes
│   │   ├── authRoutes.js
│   │   ├── accountRoutes.js
│   │   ├── transactionRoutes.js
│   │   ├── userRoutes.js
│   │   └── adminRoutes.js
│   ├── .env.example            # Sample environment variables
│   ├── package.json            # Node.js dependencies
│   └── app.js                  # Main Express application server
└── database/
    └── banking.sql             # Full DDL schema & sample seed data
```

---

## 🚀 Quick Setup & Installation Guide

### Prerequisites
- [Node.js](https://nodejs.org/) (v16.0.0 or higher)
- [MySQL Database Server](https://www.mysql.com/) (MySQL 8.0+ / XAMPP / WampServer)
- [VS Code](https://code.visualstudio.com/)

---

### Step 1: Database Setup (MySQL)
1. Open your MySQL client (MySQL Workbench, phpMyAdmin, or MySQL CLI).
2. Execute the DDL script located at `database/banking.sql`:
   ```bash
   mysql -u root -p < database/banking.sql
   ```
   *(This creates the `banking_db` database, table structures, indexes, and pre-populates sample users, accounts, and transactions).*

---

### Step 2: Backend Environment Setup
1. Navigate to the `/server` directory:
   ```bash
   cd server
   ```
2. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
3. Update your `.env` credentials matching your local MySQL installation:
   ```ini
   PORT=5000
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=banking_db
   JWT_SECRET=your_super_secret_jwt_key_2026
   ```

---

### Step 3: Install Dependencies & Run Application
1. In the `server` directory, install Node.js packages:
   ```bash
   npm install
   ```
2. Start the Express server:
   ```bash
   npm start
   ```
   *Or for auto-reloading development mode:*
   ```bash
   npm run dev
   ```

3. Open your browser and navigate to:
   ```text
   http://localhost:5000
   ```

---

## 🔐 Pre-Configured Test Accounts

| Role | Email | Password | Account Number | Initial Balance |
| :--- | :--- | :--- | :--- | :--- |
| **User** | `john@example.com` | `Password@123` | `1000849201` | **$8,500.50** |
| **User** | `sarah@example.com` | `Password@123` | `1000958312` | **$14,200.75** |
| **User** | `alex@example.com` | `Password@123` | `1000472945` | **$2,350.00** |
| **Admin** | `admin@bank.com` | `Password@123` | N/A | Full System Access |

---

## 🧪 Verification & Testing Steps

1. **User Sign In**: Log in using `john@example.com` / `Password@123`.
2. **Dashboard Overview**: Observe the animated account balance counter ($8,500.50), credit card widget, and Chart.js cash flow graph.
3. **Money Transfer**:
   - Navigate to **Transfer Money**.
   - Input recipient account `1000958312` (Sarah Jenkins). Notice the real-time beneficiary name resolution.
   - Click **Generate OTP** to receive demo code, then execute transfer of `$500.00`.
4. **Statement Export**: Go to **Transactions** page and click **Download PDF** to export your bank statement.
5. **Admin Controls**:
   - Log out and sign in as `admin@bank.com`.
   - Access **Admin Panel** to view platform metrics, user lists, and toggle account block/unblock status.
