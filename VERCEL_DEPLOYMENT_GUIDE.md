# Vercel Full-Stack Deployment Guide

Deploy both your React frontend and Node.js backend on Vercel.

## 🚀 Option 1: Vercel Only (Monorepo Approach)

### Advantages:
✅ Single platform for everything  
✅ Automatic HTTPS  
✅ Global CDN  
✅ Easy environment variable management  
✅ Built-in analytics  

### Limitations:
❌ Serverless functions have cold starts  
❌ 10-second timeout limit for functions  
❌ Less control over server configuration  
❌ WebSocket support is limited  

## 📋 Prerequisites
- GitHub repository (already done ✅)
- Vercel account
- Environment variables ready

## 🛠️ Setup Steps

### 1. Project Structure Adjustment
Your current structure works well for Vercel monorepo deployment:

```
PlaySplit/
├── frontend/          # React app
├── backend/           # API routes
└── vercel.json       # Deployment config
```

### 2. Update Frontend API Configuration
Update `frontend/src/config/api.js`:

```javascript
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
  // ... rest of config
});
```

In production, `REACT_APP_API_URL` will be: `https://your-project.vercel.app/api`

### 3. Deploy to Vercel

#### Method 1: Through Dashboard
1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub
3. Click "New Project"
4. Import your PlaySplit repository
5. Vercel will automatically detect the configuration

#### Method 2: Using Vercel CLI
```bash
npm i -g vercel
cd "C:\Users\faazr\Desktop\PlaySplit Website v3"
vercel --prod
```

### 4. Configure Environment Variables

In Vercel Dashboard → Your Project → Settings → Environment Variables:

#### Backend Environment Variables:
```
NODE_ENV=production
MONGODB_URI=mongodb+srv://playsplitadmin:tXv40BNlZH6M5eBb@playsplit-cluster.w9tdosf.mongodb.net/playsplit?retryWrites=true&w=majority&appName=PlaySplit-Cluster
JWT_SECRET=11b7f8e9b8a4c57fbc9c072e74f7e6df99ef6cb542f4c6f5ff8e92d38b4479b92a29cd91e3f0aef1e09840d7cc8fa93d
FIREBASE_PROJECT_ID=playsplit-694ef
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
YOUR_FIREBASE_PRIVATE_KEY_HERE
-----END PRIVATE KEY-----"
FIREBASE_CLIENT_EMAIL=your-service-account@playsplit-694ef.iam.gserviceaccount.com
RAZORPAY_KEY_ID=rzp_test_R4yHE376UzBKEn
RAZORPAY_KEY_SECRET=ikTWd3dOGUDr0Zhz3MeIHTf8
CLIENT_URL=https://your-project.vercel.app
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
```

#### Frontend Environment Variables:
```
REACT_APP_API_URL=https://your-project.vercel.app/api
REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=playsplit-694ef.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=playsplit-694ef
REACT_APP_FIREBASE_STORAGE_BUCKET=playsplit-694ef.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
REACT_APP_FIREBASE_APP_ID=your_firebase_app_id
REACT_APP_RAZORPAY_KEY_ID=rzp_test_R4yHE376UzBKEn
```

### 5. Test Your Deployment
Once deployed, test:
- Frontend: `https://your-project.vercel.app`
- Backend API: `https://your-project.vercel.app/api`

---

## 🚀 Option 2: Hybrid Approach (Recommended)

For better performance and fewer limitations:

### Frontend: Vercel
- Deploy frontend separately
- Perfect for React apps
- No limitations

### Backend: Railway or Render
- Better for persistent connections
- No timeout limitations
- WebSocket support

## 🔧 Which Option to Choose?

### Choose Vercel Only If:
- You prefer single platform simplicity
- Your app doesn't need WebSockets
- API requests complete quickly (< 10s)
- You don't need persistent background jobs

### Choose Hybrid Approach If:
- You need WebSocket connections
- You have long-running API requests
- You need persistent background processes
- You want maximum performance

## 📝 Quick Deploy Commands

### For Vercel Only:
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from project root
cd "C:\Users\faazr\Desktop\PlaySplit Website v3"
vercel --prod
```

### For Hybrid (Frontend to Vercel, Backend to Railway):
```bash
# Deploy frontend
cd frontend
vercel --prod

# Deploy backend to Railway (through dashboard)
# Go to railway.app → Deploy from GitHub → Select backend folder
```

## 🎯 My Recommendation

For your PlaySplit app, I recommend the **Hybrid Approach**:

1. **Frontend → Vercel**: Perfect for React apps
2. **Backend → Railway**: Better for API performance

This gives you the best of both worlds!

Would you like me to set up configurations for this approach?
