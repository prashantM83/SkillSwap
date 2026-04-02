# 🚀 SkillSwap

Live Demo=https://prskillswap.vercel.app/

A modern skill exchange platform that allows users to connect, share skills, and learn from each other through a collaborative marketplace — teach what you know, learn what you don't.

## ⚠️ Note :

- To get the most smooth experience please use desktop only for now.

## ✨ Features

- 🔐 **User Authentication** - Secure login/register with JWT + refresh tokens
- 🔑 **Password Reset** - OTP-based forgot password flow via email
- 👤 **User Profiles** - Manage personal information, skills offered & wanted
- 🔍 **Skill Browser** - Discover and search users by skills
- 🤝 **Swap Requests** - Send, receive, accept & manage skill exchange requests
- 💬 **Real-time Messaging** - Chat with swap partners via Socket.IO (swap-gated)
- 🔔 **Real-time Notifications** - Instant in-app notifications for all activity
- 📅 **Session Scheduling** - Schedule skill sessions with calendar view
- 🎥 **Video Sessions** - Integrated Jitsi Meet for live video sessions
- 📧 **Email Notifications** - Automated email reminders via Nodemailer
- ⏰ **Scheduled Reminders** - Cron-based session reminder jobs
- ⭐ **Feedback System** - Rate and review skill exchanges
- 🚩 **Message Reporting** - Report abusive messages
- 👨‍💼 **Admin Dashboard** - Platform stats, user management, ban/unban, reports
- 📱 **Responsive Design** - Works seamlessly on all devices

## 🛠️ Tech Stack

### Backend

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database with Mongoose ODM
- **Socket.IO** - Real-time bidirectional communication
- **JWT** - Authentication & refresh tokens
- **bcryptjs** - Password hashing
- **Nodemailer** - Email sending (SMTP/Gmail)
- **node-cron** - Scheduled reminder jobs
- **CORS** - Cross-origin resource sharing

### Frontend

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Redux Toolkit** - State management
- **React Router v7** - Client-side routing
- **Tailwind CSS** - Styling framework
- **Radix UI** - Accessible UI primitives
- **Socket.IO Client** - Real-time communication
- **Axios** - HTTP client
- **React Big Calendar** - Session calendar view
- **React Toastify** - Toast notifications
- **date-fns** - Date utility library
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

Create a `.env` file in the `backend/` directory with the following variables:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
NODE_ENV=development
JWT_SECRET=your_strong_jwt_secret_key
JWT_REFRESH_SECRET=your_strong_refresh_secret_key
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_gmail_app_password
SMTP_FROM=your_email@gmail.com
FRONTEND_URL=http://localhost:5173
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
│   ├── jobs/
│   │   └── reminderJob.js
│   ├── middleware/
│   │   └── authMiddleware.js
│   ├── models/
│   │   ├── AdminMessage.js
│   │   ├── Feedback.js
│   │   ├── Message.js
│   │   ├── Notification.js
│   │   ├── ReportedMessage.js
│   │   ├── Session.js
│   │   ├── SwapRequest.js
│   │   └── User.js
│   ├── routes/
│   │   ├── admin.js
│   │   ├── auth.js
│   │   ├── feedback.js
│   │   ├── messages.js
│   │   ├── notifications.js
│   │   ├── sessions.js
│   │   ├── swaps.js
│   │   └── users.js
│   ├── socket/
│   │   └── socketHandler.js
│   ├── utils/
│   │   └── mailSender.js
│   ├── makeAdmin.js
│   ├── server.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Auth/
│   │   │   ├── Chat/
│   │   │   ├── Notifications/
│   │   │   ├── ui/
│   │   │   ├── AdminDashboard.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── Home.tsx
│   │   │   ├── JitsiMeet.tsx
│   │   │   ├── MessagesPage.tsx
│   │   │   ├── ScheduleSessionDialog.tsx
│   │   │   ├── SessionsCalendar.tsx
│   │   │   ├── SkillBrowser.tsx
│   │   │   ├── SwapRequests.tsx
│   │   │   └── UserProfile.tsx
│   │   ├── context/
│   │   │   └── SocketContext.tsx
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   └── swaps/
│   │   ├── services/
│   │   │   ├── adminService.ts
│   │   │   ├── feedbackService.ts
│   │   │   ├── sessionService.ts
│   │   │   └── userService.ts
│   │   ├── App.tsx
│   │   ├── store.ts
│   │   ├── types.ts
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
- `GET /api/auth/me` - Get current user (protected)
- `POST /api/auth/refresh` - Refresh JWT token
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/forgot-password` - Send OTP to email
- `POST /api/auth/verify-otp` - Verify OTP code
- `POST /api/auth/reset-password` - Reset password with OTP

### Users

- `GET /api/users` - Get all users
- `GET /api/users/search` - Search users by skill/name
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user profile
- `DELETE /api/users/:id` - Delete user
- `POST /api/users/:id/ban` - Ban user (admin only)
- `POST /api/users/:id/unban` - Unban user (admin only)

### Swaps

- `POST /api/swaps` - Create new swap request
- `GET /api/swaps` - Get all swaps
- `GET /api/swaps/sent` - Get sent swap requests
- `GET /api/swaps/received` - Get received swap requests
- `GET /api/swaps/:id` - Get swap by ID
- `PUT /api/swaps/:id` - Update swap status
- `DELETE /api/swaps/:id` - Delete swap request

### Messages

- `GET /api/messages/conversations` - Get all conversations (swap-gated)
- `GET /api/messages/:userId` - Get messages with a user
- `POST /api/messages/:userId` - Send a message
- `POST /api/messages/:id/report` - Report a message

### Notifications

- `GET /api/notifications` - Get all notifications (paginated)
- `GET /api/notifications/unread-count` - Get unread count
- `PATCH /api/notifications/:id/read` - Mark notification as read
- `PATCH /api/notifications/read-all` - Mark all as read

### Sessions

- `POST /api/sessions` - Schedule a new session
- `GET /api/sessions` - Get user's sessions
- `PUT /api/sessions/:id` - Update session
- `DELETE /api/sessions/:id` - Cancel session

### Feedback

- `GET /api/feedback` - Get all feedback
- `POST /api/feedback` - Submit feedback
- `GET /api/feedback/user/:userId` - Get feedback received by user
- `GET /api/feedback/by/:userId` - Get feedback given by user
- `DELETE /api/feedback/:id` - Delete feedback (admin only)

### Admin

- `GET /api/admin/stats` - Platform statistics
- `GET /api/admin/users` - Get all users
- `GET /api/admin/swaps` - Get all swaps
- `GET /api/admin/feedback` - Get all feedback
- `POST /api/admin/messages` - Create admin message
- `GET /api/admin/messages` - Get admin messages
- `PUT /api/admin/messages/:id` - Update admin message
- `DELETE /api/admin/messages/:id` - Delete admin message
- `GET /api/admin/reports` - Get reported messages
- `POST /api/admin/recalculate-swap-counts` - Recalculate swap counts

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

**Happy Coding! 🎉**
