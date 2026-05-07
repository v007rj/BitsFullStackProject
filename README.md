# School Equipment Lending Portal

A full-stack web application for managing school equipment borrowing, built with React, Node.js/Express, and SQLite.

## Architecture

```
┌─────────────────┐     HTTP/REST      ┌─────────────────┐     SQLite      ┌──────────┐
│  React Frontend │ ◄───────────────► │  Express Backend │ ◄────────────► │ Database │
│   (Vite, :3000) │                    │     (:5000)      │                │  (.sqlite)│
└─────────────────┘                    └─────────────────┘                └──────────┘
```

## Tech Stack

| Layer     | Technology                        |
|-----------|-----------------------------------|
| Frontend  | React 18, React Router, Axios     |
| Backend   | Node.js, Express.js               |
| Database  | SQLite (via better-sqlite3)        |
| Auth      | JWT (jsonwebtoken), bcryptjs       |
| Build     | Vite                              |

## Features

- **User Authentication & Roles** — Login/signup with JWT tokens. Three roles: Student, Staff, Admin.
- **Equipment Management** — Full CRUD operations (admin only). Equipment has name, category, condition, quantity, and availability tracking.
- **Borrow & Return Workflow** — Students request equipment → Staff/Admin approves/rejects → Mark as returned when completed. Prevents duplicate active requests for same item by same user.
- **Dashboard** — Stats overview for admin/staff. Recent equipment and requests for all users.
- **Search & Filter** — Search by name, filter by category, filter available-only.
- **Responsive UI** — Clean, mobile-friendly interface with modular React components.

## Database Schema

### users
| Column     | Type    | Details                          |
|------------|---------|----------------------------------|
| id         | INTEGER | Primary key, auto-increment      |
| name       | TEXT    | Required                         |
| email      | TEXT    | Unique, required                 |
| password   | TEXT    | Hashed with bcrypt               |
| role       | TEXT    | student / staff / admin          |
| created_at | DATETIME| Auto-generated                   |

### equipment
| Column             | Type    | Details                          |
|--------------------|---------|----------------------------------|
| id                 | INTEGER | Primary key, auto-increment      |
| name               | TEXT    | Required                         |
| category           | TEXT    | Required                         |
| description        | TEXT    | Optional                         |
| condition          | TEXT    | new / good / fair / poor         |
| total_quantity     | INTEGER | Default 1                        |
| available_quantity | INTEGER | Tracks current availability      |
| created_at         | DATETIME| Auto-generated                   |
| updated_at         | DATETIME| Auto-updated                     |

### borrow_requests
| Column       | Type    | Details                                    |
|--------------|---------|-------------------------------------------|
| id           | INTEGER | Primary key, auto-increment               |
| user_id      | INTEGER | FK → users(id)                            |
| equipment_id | INTEGER | FK → equipment(id)                        |
| quantity     | INTEGER | Default 1                                  |
| status       | TEXT    | pending / approved / rejected / returned   |
| request_date | DATETIME| Auto-generated                             |
| due_date     | DATETIME| Optional expected return date              |
| return_date  | DATETIME| Set when returned                          |
| notes        | TEXT    | Optional                                   |
| reviewed_by  | INTEGER | FK → users(id), set on approval/rejection  |

## API Documentation

### Authentication
| Method | Endpoint          | Body                                         | Auth | Description     |
|--------|-------------------|----------------------------------------------|------|-----------------|
| POST   | /api/auth/register| { name, email, password, role }              | No   | Register user   |
| POST   | /api/auth/login   | { email, password }                          | No   | Login user      |
| GET    | /api/auth/me      | —                                            | Yes  | Get current user|

### Equipment
| Method | Endpoint              | Query/Body                                    | Auth  | Description        |
|--------|-----------------------|-----------------------------------------------|-------|--------------------|
| GET    | /api/equipment        | ?search=&category=&available=true             | Yes   | List equipment     |
| GET    | /api/equipment/categories | —                                          | Yes   | Get categories     |
| GET    | /api/equipment/:id    | —                                             | Yes   | Get one item       |
| POST   | /api/equipment        | { name, category, description, condition, total_quantity } | Admin | Add equipment |
| PUT    | /api/equipment/:id    | { name, category, description, condition, total_quantity } | Admin | Update equipment |
| DELETE | /api/equipment/:id    | —                                             | Admin | Delete equipment   |

### Borrow Requests
| Method | Endpoint                          | Body                                  | Auth        | Description      |
|--------|-----------------------------------|---------------------------------------|-------------|------------------|
| GET    | /api/borrow-requests              | —                                     | Yes         | List requests    |
| POST   | /api/borrow-requests              | { equipment_id, quantity, due_date, notes } | Yes   | Create request   |
| PUT    | /api/borrow-requests/:id/approve  | —                                     | Staff/Admin | Approve request  |
| PUT    | /api/borrow-requests/:id/reject   | —                                     | Staff/Admin | Reject request   |
| PUT    | /api/borrow-requests/:id/return   | —                                     | Staff/Admin | Mark returned    |
| GET    | /api/borrow-requests/stats        | —                                     | Staff/Admin | Dashboard stats  |

## Getting Started

### Prerequisites
- Node.js 18+

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd BitsFullStackProject

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Running the Application

**Terminal 1 — Backend (port 5000):**
```bash
cd backend
npm start
```

**Terminal 2 — Frontend (port 3000):**
```bash
cd frontend
npm run dev
```

Open http://localhost:3000 in your browser.

### Demo Accounts
| Role    | Email               | Password     |
|---------|---------------------|-------------|
| Admin   | admin@school.com    | password123 |
| Staff   | staff@school.com    | password123 |
| Student | john@school.com     | password123 |

## Project Structure

```
BitsFullStackProject/
├── backend/
│   ├── config/
│   │   ├── db.js           # SQLite database setup & schema
│   │   └── seed.js         # Initial seed data
│   ├── middleware/
│   │   └── auth.js         # JWT authentication & role authorization
│   ├── routes/
│   │   ├── auth.js         # Auth endpoints (register, login, me)
│   │   ├── equipment.js    # Equipment CRUD endpoints
│   │   └── borrowRequests.js # Borrow request endpoints
│   ├── server.js           # Express app entry point
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── context/
│   │   │   └── AuthContext.jsx  # Auth state management
│   │   ├── components/
│   │   │   └── Navbar.jsx       # Navigation bar
│   │   ├── pages/
│   │   │   ├── Login.jsx        # Login page
│   │   │   ├── Register.jsx     # Registration page
│   │   │   ├── Dashboard.jsx    # Dashboard with stats
│   │   │   ├── Equipment.jsx    # Equipment listing & management
│   │   │   ├── BorrowRequests.jsx # Borrow request table
│   │   │   └── AdminPanel.jsx   # Admin overview panel
│   │   ├── api.js               # Axios instance with interceptors
│   │   ├── App.jsx              # Routes & auth guards
│   │   ├── main.jsx             # React entry point
│   │   └── index.css            # Global styles
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── Assignment.md
└── README.md
```

## Component Hierarchy

```
App
├── AuthProvider (Context)
├── BrowserRouter
│   ├── Navbar
│   └── Routes
│       ├── /login → Login
│       ├── /register → Register
│       ├── /dashboard → Dashboard (PrivateRoute)
│       ├── /equipment → Equipment (PrivateRoute)
│       ├── /requests → BorrowRequests (PrivateRoute)
│       └── /admin → AdminPanel (PrivateRoute, admin only)
```
