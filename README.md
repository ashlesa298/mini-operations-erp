
# 🚀 Mini Operations ERP

A simple full-stack ERP application for managing inventory, work orders, stock transfers, and customer orders.

## 🛠️ Tech Stack

- **Frontend:** React.js, Vite, JavaScript, Axios, CSS
- **Backend:** Node.js, Express.js, JavaScript, Prisma ORM
- **Database:** PostgreSQL
- **Authentication:** JWT, Cookie-based Authentication, RBAC
- **Testing:** Jest, Supertest
- **Tools:** Git, GitHub, Postman, VS Code

## 📥 Project Setup

```bash
git clone https://github.com/ashlesa298/mini-operations-erp.git
cd mini-operations-erp
````

Install backend dependencies:

```bash
cd backend
npm install
```

Install frontend dependencies:

```bash
cd ../frontend
npm install
```

## 🗄️ Database Setup

The project uses PostgreSQL with Prisma ORM.

```bash
cd backend
npx prisma generate
npx prisma migrate dev
```

Make sure the PostgreSQL database is created and connected through `DATABASE_URL`.

## 🔐 Environment Variables

Create a `.env` file inside the `backend` folder:

```env
DATABASE_URL="your_postgresql_database_url"
JWT_SECRET="your_jwt_secret"
CLIENT_URL="http://localhost:5173"
PORT=5000
```

⚠️ Do not upload the actual `.env` file to GitHub.

## ▶️ How to Run

### Backend

```bash
cd backend
npm run dev
```

Backend: `http://localhost:5000`

### Frontend

Open another terminal:

```bash
cd frontend
npm run dev
```

Frontend: `http://localhost:5173`

## 🧪 How to Test

Run the tests from the `backend` folder:

```bash
cd backend
npm test
```

The tests cover:

* 🚫 Reservation beyond available stock
* 🚫 Transfer beyond available stock
* 📦 Destination stock update after receipt
* 🚫 Duplicate transfer receipt
* 🔒 Unauthorized operations

**Expected result:** 5 tests passed.
