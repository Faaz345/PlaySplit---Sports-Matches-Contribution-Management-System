# Railway Backend Deployment Guide

## Prerequisites
1. Create a GitHub repository and push your code
2. Sign up for Railway at https://railway.app

## Deployment Steps

### 1. Connect to Railway
1. Go to https://railway.app/dashboard
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your PlaySplit repository
5. Select the `backend` folder as the root directory

### 2. Configure Environment Variables
In Railway dashboard, go to your project → Variables tab and add:

```
NODE_ENV=production
PORT=${{ RAILWAY_PORT }}
MONGODB_URI=mongodb+srv://playsplitadmin:tXv40BNlZH6M5eBb@playsplit-cluster.w9tdosf.mongodb.net/playsplit?retryWrites=true&w=majority&appName=PlaySplit-Cluster
JWT_SECRET=11b7f8e9b8a4c57fbc9c072e74f7e6df99ef6cb542f4c6f5ff8e92d38b4479b92a29cd91e3f0aef1e09840d7cc8fa93d
FIREBASE_PROJECT_ID=playsplit-694ef
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
YOUR_PRIVATE_KEY_HERE
-----END PRIVATE KEY-----"
FIREBASE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
RAZORPAY_KEY_ID=rzp_test_R4yHE376UzBKEn
RAZORPAY_KEY_SECRET=ikTWd3dOGUDr0Zhz3MeIHTf8
CLIENT_URL=https://your-frontend-domain.vercel.app
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
```

**Important Notes:**
- Replace `YOUR_PRIVATE_KEY_HERE` with your actual Firebase private key
- Replace `your-service-account@your-project.iam.gserviceaccount.com` with your Firebase service account email
- The `CLIENT_URL` will be updated after frontend deployment
- Use `${{ RAILWAY_PORT }}` for the PORT variable (Railway automatically assigns this)

### 3. Deploy
1. Railway will automatically build and deploy your backend
2. Once deployed, you'll get a URL like: `https://your-app-name.railway.app`
3. Note this URL - you'll need it for frontend configuration

### 4. Test Backend
Test your deployed backend by visiting:
- `https://your-backend-url.railway.app/api/health` (if you have a health check endpoint)
- Check the logs in Railway dashboard for any issues

## Troubleshooting

### Common Issues:
1. **Build fails**: Check that `package.json` has the correct start script
2. **Environment variables**: Make sure all required variables are set
3. **MongoDB connection**: Verify your MongoDB Atlas allows connections from all IPs (0.0.0.0/0)
4. **Firebase issues**: Ensure your service account key is properly formatted

### MongoDB Atlas Setup:
1. Go to MongoDB Atlas dashboard
2. Navigate to Network Access
3. Add IP Address: `0.0.0.0/0` (allow all IPs for Railway)
4. This allows Railway servers to connect to your database
