# PlaySplit Complete Deployment Guide

This guide will help you deploy your PlaySplit application online using free hosting services.

## 🚀 Overview
- **Backend**: Railway (Node.js API)
- **Frontend**: Vercel (React App)
- **Database**: MongoDB Atlas (already configured)

---

## 📋 Prerequisites

1. **GitHub Account**: Create a repository and push your code
2. **Firebase Console**: Ensure your Firebase project is properly configured
3. **MongoDB Atlas**: Your database is already set up
4. **Razorpay Account**: For payment processing

---

## 🎯 Step 1: Deploy Backend to Railway

### 1.1 Create GitHub Repository
```bash
# If you haven't already:
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/playsplit.git
git push -u origin main
```

### 1.2 Deploy to Railway
1. Go to [railway.app](https://railway.app) and sign up with GitHub
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your PlaySplit repository
4. Choose the `backend` folder as the root directory

### 1.3 Configure Environment Variables in Railway
Go to your project → Variables tab and add:

```
NODE_ENV=production
PORT=${{ RAILWAY_PORT }}
MONGODB_URI=mongodb+srv://playsplitadmin:tXv40BNlZH6M5eBb@playsplit-cluster.w9tdosf.mongodb.net/playsplit?retryWrites=true&w=majority&appName=PlaySplit-Cluster
JWT_SECRET=11b7f8e9b8a4c57fbc9c072e74f7e6df99ef6cb542f4c6f5ff8e92d38b4479b92a29cd91e3f0aef1e09840d7cc8fa93d
FIREBASE_PROJECT_ID=playsplit-694ef
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
YOUR_FIREBASE_PRIVATE_KEY_HERE
-----END PRIVATE KEY-----"
FIREBASE_CLIENT_EMAIL=your-firebase-service-account@playsplit-694ef.iam.gserviceaccount.com
RAZORPAY_KEY_ID=rzp_test_R4yHE376UzBKEn
RAZORPAY_KEY_SECRET=ikTWd3dOGUDr0Zhz3MeIHTf8
CLIENT_URL=https://your-frontend-domain.vercel.app
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
```

**Important**: 
- Replace `YOUR_FIREBASE_PRIVATE_KEY_HERE` with your actual Firebase private key
- Replace `your-firebase-service-account@playsplit-694ef.iam.gserviceaccount.com` with your actual service account email
- `CLIENT_URL` will be updated after frontend deployment

### 1.4 Enable MongoDB Atlas Access
1. Go to MongoDB Atlas dashboard
2. Navigate to "Network Access"
3. Add IP Address: `0.0.0.0/0` (allow all IPs)
4. This allows Railway servers to connect to your database

### 1.5 Test Backend
Once deployed, your backend will be available at: `https://your-app-name.railway.app`

---

## 🎯 Step 2: Deploy Frontend to Vercel

### 2.1 Deploy to Vercel
1. Go to [vercel.com](https://vercel.com) and sign up with GitHub
2. Click "New Project"
3. Import your PlaySplit repository
4. Set the root directory to `frontend`
5. Framework Preset should be detected as "Create React App"

### 2.2 Configure Environment Variables in Vercel
In Vercel dashboard → Your Project → Settings → Environment Variables, add:

```
REACT_APP_API_URL=https://your-backend-name.railway.app
REACT_APP_FIREBASE_API_KEY=your_firebase_web_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=playsplit-694ef.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=playsplit-694ef
REACT_APP_FIREBASE_STORAGE_BUCKET=playsplit-694ef.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
REACT_APP_FIREBASE_APP_ID=your_firebase_app_id
REACT_APP_RAZORPAY_KEY_ID=rzp_test_R4yHE376UzBKEn
```

**Important**: Replace `https://your-backend-name.railway.app` with your actual Railway backend URL

### 2.3 Update Backend with Frontend URL
1. Go back to Railway → Your Backend Project → Variables
2. Update `CLIENT_URL` to your Vercel frontend URL: `https://your-frontend-name.vercel.app`
3. Redeploy the backend

---

## 🎯 Step 3: Final Configuration

### 3.1 Update Firebase Configuration
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to Project Settings → General
4. In "Your apps" section, add your Vercel domain to "Authorized domains"

### 3.2 Update Razorpay Settings (if using live mode)
1. Go to Razorpay Dashboard
2. Add your production domains to webhook URLs and authorized domains

### 3.3 Test Your Deployed Application
1. Visit your Vercel frontend URL
2. Test user registration/login
3. Test match creation
4. Test payment flow
5. Check browser developer tools for any errors

---

## 🔧 Troubleshooting

### Common Backend Issues:
1. **Build Failures**: Ensure `package.json` has correct start script
2. **Environment Variables**: Double-check all required variables are set
3. **MongoDB Connection**: Verify Atlas allows all IP connections
4. **Firebase Auth**: Ensure private key is properly formatted (with \n newlines)

### Common Frontend Issues:
1. **API Connection**: Verify REACT_APP_API_URL points to correct Railway URL
2. **Firebase Config**: Ensure all Firebase config variables are set
3. **Build Errors**: Check for any missing dependencies

### Helpful Commands:
```bash
# Test backend locally with production env
npm start

# Build frontend for production
npm run build

# Test frontend build locally
npx serve -s build
```

---

## 📱 Post-Deployment Checklist

- [ ] Backend deployed and accessible
- [ ] Frontend deployed and accessible  
- [ ] User authentication working
- [ ] Match creation/management working
- [ ] Payment integration working
- [ ] Firebase configuration updated
- [ ] MongoDB Atlas allows Railway connections
- [ ] Environment variables properly set
- [ ] SSL certificates active (automatic with both platforms)

---

## 🎉 Your PlaySplit App is Now Live!

**Frontend**: https://your-project.vercel.app
**Backend**: https://your-project.railway.app

Share your app with users and start managing football matches online!

---

## 💰 Cost Information

Both Railway and Vercel offer generous free tiers:

### Railway Free Tier:
- $5 worth of resources per month
- Usually sufficient for small to medium applications

### Vercel Free Tier:
- 100GB bandwidth per month
- Unlimited static deployments
- Perfect for React applications

### MongoDB Atlas Free Tier:
- 512MB storage
- Suitable for development and small production apps

**Total Cost**: $0 for getting started! 🎉
