# Real-Time Chat Application

A production-ready MEAN stack real-time chat application.

## 🚀 Getting Started

Follow these instructions to get the project up and running on your local machine.

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (or local MongoDB)
- [Redis](https://redis.io/) (for Socket.io scaling)

---

## 🛠️ Running the Project

### 1. Backend Setup

Navigate to the `backend` directory:
```bash
cd backend
```

Install dependencies:
```bash
npm install
```

Set up your `.env` file (refer to `.env.example` or existing `.env`).

Run the backend in development mode:
```bash
npm run dev
```
The backend will be running at `http://localhost:5000` (default).

### 2. Frontend Setup

Navigate to the `frontend` directory:
```bash
cd frontend
```

Install dependencies:
```bash
npm install
```

Run the frontend:
```bash
npm start
```
The frontend will be available at `http://localhost:4200`.

---

## 📜 Available Scripts

### Backend
- `npm run dev`: Start development server with nodemon and ts-node.
- `npm run build`: Compile TypeScript to JavaScript.
- `npm start`: Run the compiled production server.

### Frontend
- `npm start`: Start the Angular development server (`ng serve`).
- `npm run build`: Build the project for production.
- `npm test`: Run unit tests using Vitest.
