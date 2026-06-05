# 🔐 AuthFlow

A production-ready JWT authentication REST API built with Node.js, Express, and MongoDB. Features access token + refresh token rotation, httpOnly cookie storage, and protected routes.

---

## Features

- User registration and login
- JWT access tokens (15 minute expiry)
- Refresh token rotation with httpOnly cookies (7 day expiry)
- Bcrypt password hashing
- Protected routes via custom auth middleware
- Server-side logout with token invalidation
- Simple HTML/CSS frontend for live demo

---

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB + Mongoose
- **Auth:** JSON Web Tokens (jsonwebtoken)
- **Security:** bcryptjs, cookie-parser
- **Dev Tools:** Nodemon, dotenv

---

## Project Structure

```
authflow/
├── controllers/
│   └── auth.controller.js     # Register, login, logout, refresh, getMe
├── middleware/
│   └── auth.middleware.js     # JWT verification middleware
├── models/
│   └── user.model.js          # User schema with password hashing hook
├── routes/
│   └── auth.routes.js         # Auth route definitions
├── public/
│   ├── index.html             # Frontend demo
│   └── style.css              # Styles
├── .env                       # Environment variables (not committed)
├── server.js                  # Entry point
└── package.json
```

---

## Getting Started

### Prerequisites

- Node.js v18+
- MongoDB running locally or MongoDB Atlas URI

### Installation

```bash
# Clone the repository
git clone https://github.com/tosvn/authflow.git
cd authflow

# Install dependencies
npm install

# Create environment file
cp .env.example .env
```

### Environment Variables

Create a `.env` file in the root directory:

```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<dbname>?appName=<AppName
ACCESS_TOKEN_SECRET=your_access_token_secret
REFRESH_TOKEN_SECRET=your_refresh_token_secret
ACCESS_TOKEN_EXPIRES=15m
REFRESH_TOKEN_EXPIRES=7d
```

### Run the server

```bash
# Development
npm run dev

# Production
npm start
```

Visit `http://localhost:5000` to see the frontend demo.

---

## API Endpoints

### Auth Routes — `/api/auth`

| Method | Endpoint    | Access  | Description                        |
|--------|-------------|---------|-----------------------------------|
| POST   | /register   | Public  | Register a new user                |
| POST   | /login      | Public  | Login and receive tokens           |
| POST   | /refresh    | Public  | Rotate refresh token               |
| POST   | /logout     | Public  | Invalidate refresh token           |
| GET    | /me         | Private | Get current authenticated user     |

---

## Request & Response Examples

### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "tosin",
  "email": "tosin@example.com",
  "password": "secret123"
}
```

```json
{
  "message": "Registration successful",
  "accessToken": "eyJhbGci...",
  "user": {
    "id": "64abc123...",
    "username": "tosin",
    "email": "tosin@example.com"
  }
}
```

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "tosin@example.com",
  "password": "secret123"
}
```

```json
{
  "message": "Login successful",
  "accessToken": "eyJhbGci...",
  "user": {
    "id": "64abc123...",
    "username": "tosin",
    "email": "tosin@example.com"
  }
}
```

### Get Current User (Protected)
```http
GET /api/auth/me
Authorization: Bearer <accessToken>
```

```json
{
  "user": {
    "_id": "64abc123...",
    "username": "tosin",
    "email": "tosin@example.com",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

## How Token Rotation Works

1. On login/register, the server issues a short-lived **access token** (15 min) and a long-lived **refresh token** (7 days)
2. The refresh token is stored in an **httpOnly cookie** — JavaScript cannot access it, protecting against XSS attacks
3. The refresh token is also saved in the database against the user
4. When the access token expires, the client calls `POST /api/auth/refresh` — the server verifies the cookie, issues a **brand new pair** of tokens, and invalidates the old refresh token
5. On logout, the refresh token is deleted from the database and the cookie is cleared — the user is fully signed out server-side

---

## Security Highlights

- Passwords hashed with **bcrypt** (12 salt rounds) via Mongoose pre-save hook
- Refresh tokens stored in **httpOnly, SameSite cookies** (not localStorage)
- Invalid credentials always return the same message — never reveal which field is wrong
- Refresh token rotation means stolen tokens expire immediately on next use

---

## License

MIT
