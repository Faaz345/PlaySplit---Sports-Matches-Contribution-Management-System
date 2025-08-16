# PlaySplit Development Setup

## 🚀 Quick Start for Development

### 1. Install Dependencies

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd frontend
npm install
```

### 2. Missing Firebase Configuration

You still need to add your Firebase Admin SDK credentials to `backend/.env`:

#### Get Firebase Admin SDK Key:
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `playsplit-694ef`
3. Go to **Project Settings** → **Service Accounts**
4. Click **"Generate new private key"**
5. Download the JSON file

#### Update backend/.env:
```env
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_ACTUAL_PRIVATE_KEY_FROM_JSON\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@playsplit-694ef.iam.gserviceaccount.com
```

### 3. Webhook Setup for Development

Since Razorpay doesn't allow localhost URLs, choose one of these options:

#### Option A: Use ngrok (Recommended)

**Install ngrok:**
```bash
# Download from https://ngrok.com/download
# Or install globally
npm install -g ngrok
```

**Setup process:**
```bash
# Terminal 1: Start backend
cd backend
npm run dev

# Terminal 2: Create tunnel
ngrok http 5000
```

**Copy the ngrok URL** (e.g., `https://abc123.ngrok.io`) and use it in Razorpay:
- **Webhook URL**: `https://abc123.ngrok.io/api/payments/webhook`
- **Events**: Select `payment.captured`, `payment.failed`, `order.paid`
- **Copy the webhook secret** and update `backend/.env`:

```env
RAZORPAY_WEBHOOK_SECRET=your_actual_webhook_secret_from_razorpay
```

#### Option B: Test Without Webhooks

For initial development, you can skip webhook setup:
- Keep the current temporary webhook secret
- Manually test payments through the frontend
- Payments will work, but auto-verification won't happen

#### Option C: Deploy Backend First

Deploy your backend to Render/Heroku first, then use that URL for webhooks.

## 🎯 Start Development

### 1. Start Backend
```bash
cd backend
npm run dev
```
✅ Backend runs on: http://localhost:5000
✅ Health check: http://localhost:5000/health

### 2. Start Frontend  
```bash
cd frontend
npm start
```
✅ Frontend runs on: http://localhost:3000

## 🧪 Testing the Application

### 1. Test Authentication
- Visit http://localhost:3000
- Try Google login and email registration
- Check if Firebase authentication works

### 2. Test Match Creation
- Login as a user
- Create a new match
- Share the match link
- Test joining/leaving matches

### 3. Test Payments
- Start a match
- Try to make a payment
- Check if Razorpay integration works
- (Webhook auto-verification will only work with ngrok or deployed backend)

## 🔧 Development Commands

### Backend Commands
```bash
npm run dev         # Start development server
npm start          # Start production server
npm test           # Run tests
npm run lint       # Check code quality
```

### Frontend Commands
```bash
npm start          # Start development server
npm run build      # Build for production
npm test           # Run tests
npm run lint       # Check code quality
```

## 🐛 Common Issues & Solutions

### 1. Firebase Authentication Not Working
- ✅ Check if Firebase config is correct in `frontend/.env`
- ✅ Ensure Firebase Admin SDK is properly configured in `backend/.env`
- ✅ Verify that your domain is authorized in Firebase Console

### 2. MongoDB Connection Issues
- ✅ Check if your IP is whitelisted in MongoDB Atlas
- ✅ Verify connection string is correct
- ✅ Test connection with MongoDB Compass

### 3. CORS Errors
- ✅ Ensure `CLIENT_URL` in backend/.env matches your frontend URL
- ✅ Check if both servers are running on correct ports

### 4. Payment Issues
- ✅ Verify Razorpay keys are correct
- ✅ Check if webhook URL is accessible (use ngrok for development)
- ✅ Test with Razorpay's test card numbers

## 📱 Test Payment Details

### Razorpay Test Cards
```
Card Number: 4111 1111 1111 1111
Expiry: Any future date
CVV: Any 3 digits
Name: Any name
```

### Test UPI IDs
```
success@razorpay
failure@razorpay
```

## 🚀 Ready for Production?

Once development is working:
1. Deploy backend to Render
2. Deploy frontend to Vercel  
3. Update webhook URL to production backend URL
4. Switch to live Razorpay keys (when ready)
5. Update environment variables in production

---

## 🎉 You're Ready to Develop!

Start with getting Firebase credentials, then choose your webhook approach, and you'll have a fully functional development environment!
