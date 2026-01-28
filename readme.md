🌍 **Live Demo:** [https://frontend-cszhgdelh-dhairya3391s-projects.vercel.app](https://frontend-cszhgdelh-dhairya3391s-projects.vercel.app)

# 🚀 SkillSwap - Odoo Hackathon Project

A modern skill exchange platform built for the Odoo hackathon, allowing users to connect, share skills, and learn from each other through a collaborative marketplace.

## ⚠️ Note :

- To get the most smooth experience please use desktop only for now.

## 🏆 Team Members

- **Dhariya Adroja** - dhairyaadroja3391@gmail.com
- **Harpalsinh Sindhav** - hsindhav746@rku.ac.in
- **Shreyansh Ranpariya** - shreyanshranpariya@gmail.com

## ✨ Features

- 🔐 **User Authentication** - Secure login/register with JWT tokens
- 👤 **User Profiles** - Manage personal information and skills
- 🔍 **Skill Browser** - Discover and search for available skills
- 🤝 **Swap Requests** - Create and manage skill exchange requests
- 💬 **Feedback System** - Rate and review skill exchanges
- 👨‍💼 **Admin Dashboard** - Manage users and platform content
- 📱 **Responsive Design** - Works seamlessly on all devices

## 🛠️ Tech Stack

### Backend

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database with Mongoose ODM
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing
- **CORS** - Cross-origin resource sharing

### Frontend

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Redux Toolkit** - State management
- **React Router** - Client-side routing
- **Tailwind CSS** - Styling framework
- **Axios** - HTTP client
- **Lucide React** - Icons

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- npm, yarn, or pnpm
- MongoDB Atlas account (or local MongoDB)

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd SkillSwap
   ```

2. **Set up environment variables**

   ```bash
   # Copy the example environment file
   cp .env.example .env

   # Edit .env with your configuration
   nano .env
   ```

3. **Install backend dependencies**

   ```bash
   cd backend
   npm install
   # or
   pnpm install
   ```

4. **Install frontend dependencies**

   ```bash
   cd ../frontend
   npm install
   # or
   pnpm install
   ```

5. **Start the development servers**

   **Terminal 1 - Backend:**

   ```bash
   cd backend
   npm run dev
   ```

   **Terminal 2 - Frontend:**

   ```bash
   cd frontend
   npm run dev
   ```

6. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000

## 📋 Environment Variables

Create a `.env` file in the backend directory with the following variables:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
NODE_ENV=development
JWT_SECRET=your_jwt_secret_key
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

## 🗄️ Database Setup

1. Create a MongoDB Atlas account or use local MongoDB
2. Create a new database cluster
3. Get your connection string
4. Update the `MONGODB_URI` in your `.env` file

## 📁 Project Structure

```
SkillSwap/
├── backend/
│   ├── config/
│   │   └── database.js
│   ├── controllers/
│   │   ├── adminController.js
│   │   ├── authController.js
│   │   ├── feedbackController.js
│   │   ├── swapController.js
│   │   └── userController.js
│   ├── middleware/
│   │   └── authMiddleware.js
│   ├── models/
│   │   ├── AdminMessage.js
│   │   ├── Feedback.js
│   │   ├── SwapRequest.js
│   │   └── User.js
│   ├── routes/
│   │   ├── admin.js
│   │   ├── auth.js
│   │   ├── feedback.js
│   │   ├── swaps.js
│   │   └── users.js
│   ├── server.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── features/
│   │   ├── services/
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── package.json
└── README.md
```

## 🔧 Available Scripts

### Backend

- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server

### Frontend

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🌐 API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh JWT token

### Users

- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/skills` - Get available skills

### Swaps

- `GET /api/swaps` - Get all swap requests
- `POST /api/swaps` - Create new swap request
- `PUT /api/swaps/:id` - Update swap request
- `DELETE /api/swaps/:id` - Delete swap request

### Feedback

- `GET /api/feedback` - Get feedback
- `POST /api/feedback` - Submit feedback

### Admin

- `GET /api/admin/users` - Get all users (admin only)
- `POST /api/admin/messages` - Send admin message

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Built for Odoo Hackathon
- Special thanks to the Odoo team for the opportunity
- Inspired by the need for skill sharing and community building

---

**Happy Coding! 🎉**
