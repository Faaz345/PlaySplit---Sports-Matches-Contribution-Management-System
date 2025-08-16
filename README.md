# PlaySplit - Football Turf Management System

A complete responsive web application for managing local football turf matches, payments, and player participation.

## 🚀 Features

- **Immersive UI/UX** with football field background and animated elements
- **Match Management** with unique shareable links
- **Player Opt-in System** like WhatsApp polls
- **Integrated Payments** with Razorpay UPI support
- **Admin Panel** for match and payment management
- **Real-time Updates** and notifications
- **Mobile-first Responsive Design**

## 🛠️ Tech Stack

- **Frontend:** React.js + TailwindCSS + Framer Motion
- **Backend:** Node.js + Express.js
- **Database:** MongoDB Atlas
- **Authentication:** Firebase Authentication
- **Payments:** Razorpay API with UPI support
- **Deployment:** Vercel (frontend) + Render (backend)

## 📁 Project Structure

```
PlaySplit/
├── frontend/                 # React.js frontend
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom hooks
│   │   ├── utils/          # Utility functions
│   │   ├── config/         # Configuration files
│   │   └── assets/         # Images and static files
│   ├── public/
│   └── package.json
├── backend/                 # Node.js backend
│   ├── src/
│   │   ├── models/         # MongoDB models
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Custom middleware
│   │   ├── controllers/    # Route controllers
│   │   ├── utils/          # Utility functions
│   │   └── config/         # Configuration
│   ├── server.js
│   └── package.json
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- MongoDB Atlas account
- Firebase project
- Razorpay account

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd PlaySplit
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Fill in your environment variables
   npm run dev
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   cp .env.example .env
   # Fill in your environment variables
   npm start
   ```

## 🔧 Environment Variables

### Backend (.env)
```
NODE_ENV=development
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_PRIVATE_KEY=your_firebase_private_key
FIREBASE_CLIENT_EMAIL=your_firebase_client_email
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
CLIENT_URL=http://localhost:3000
```

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:5000
REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
REACT_APP_FIREBASE_PROJECT_ID=your_firebase_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
REACT_APP_FIREBASE_APP_ID=your_firebase_app_id
REACT_APP_RAZORPAY_KEY_ID=your_razorpay_key_id
```

## 📱 Usage

1. **Admin Creates Match**
   - Set match details (time, location, price)
   - Generate unique shareable link
   - Share link in WhatsApp group

2. **Players Join**
   - Click shared link
   - View match details
   - Join or opt-out

3. **Match Starts**
   - Admin starts the match
   - Players receive payment requests
   - Auto payment via UPI or manual marking

4. **Payment Tracking**
   - Real-time payment status
   - Admin can manually mark cash payments
   - Automatic webhook verification

## 🚀 Deployment

### Frontend (Vercel)
```bash
cd frontend
npm run build
# Deploy to Vercel
```

### Backend (Render)
```bash
cd backend
# Deploy to Render with environment variables
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License.
