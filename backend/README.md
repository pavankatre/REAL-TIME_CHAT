# Backend - Real-Time Chat

Node.js + Express + TypeScript backend for the Real-Time Chat application.

## 🛠️ Development

### Installation
```bash
npm install
```

### Environment Variables
Ensure you have a `.env` file in this directory with the following keys:
- `PORT`
- `MONGODB_URI`
- `JWT_SECRET`
- `EMAIL_HOST`
- `EMAIL_USER`
- `EMAIL_PASS`
- `REDIS_URL`

### Run Commands
- **Launch Development Server**:
  ```bash
  npm run dev
  ```
- **Build for Production**:
  ```bash
  npm run build
  ```
- **Run Production Build**:
  ```bash
  npm start
  ```

## 🏗️ Architecture
- **Express**: Web framework
- **Mongoose**: MongoDB ODM
- **Socket.io**: Real-time communication
- **Redis**: Adapter for Socket.io horizontal scaling
- **Winston**: Logging
- **Zod**: Schema validation
