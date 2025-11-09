# WordCraft Admin Panel Setup

## What was created

✅ **Backend API for admin panel:**
- Middleware for admin rights verification (`adminMiddleware.ts`)
- Controller with comprehensive statistics (`adminController.ts`) 
- Routes with obfuscated URL (`adminRoutes.ts`)
- Environment variables for login/password

✅ **Frontend admin panel:**
- Page with obfuscated URL
- Basic Auth authorization
- Complete statistics and analytics
- Beautiful interface

## How to run

### 1. Environment variables setup

Add to `backend/.env` file:
```env
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="super_secret_admin_password_2024"
```

### 2. Start servers

```bash
# Backend
cd backend
npm run dev

# Frontend (in another terminal)
cd frontend  
npm run dev
```

### 3. Access admin panel

Open in browser:
```
http://localhost:3000/admin-panel-x7k9m2p8q1w4e6r3t5y7u9i0o1p2a3s4d5f6g7h8j9k0l1z2x3c4v5b6n7m8
```

**Username:** admin  
**Password:** super_secret_admin_password_2024

## What the admin panel shows

### 📊 Overview Statistics
- Total users
- New users (today/week/month)
- Active users (today/week)
- Dictionary and word counts
- Session activity

### 📈 Learning Progress Statistics
- Average learned words per user
- Users with learning streaks
- Longest streak achieved
- Average session scores
- Total words recalled vs not recalled

### 👥 Users
- Top active users by learning progress
- User activity metrics
- Detailed user information

### 📚 Content
- Popular dictionaries by likes
- Language statistics
- Public vs private dictionaries
- Dictionary creation trends

### 📊 Analytics
- Activity chart for last 30 days
- Daily statistics
- Usage trends

## Security

- 🔐 Obfuscated URL to hide admin panel
- 🔑 Basic Authentication
- 🛡️ Rights verification on backend
- 🔒 Credentials stored in environment variables

## API Endpoints

```
GET /admin/x7k9m2p8q1w4e6r3t5y7u9i0o1p2a3s4d5f6g7h8j9k0l1z2x3c4v5b6n7m8
GET /admin/x7k9m2p8q1w4e6r3t5y7u9i0o1p2a3s4d5f6g7h8j9k0l1z2x3c4v5b6n7m8/users/:userId
```

Both endpoints require Basic Auth with credentials from environment variables.
