# PlaySplit Setup Guide

This guide will help you set up and deploy the PlaySplit football turf management system.

## 📋 Prerequisites

### Required Software
- **Node.js 18+** - [Download here](https://nodejs.org/)
- **npm or yarn** - Package manager (comes with Node.js)
- **Git** - Version control
- **MongoDB Atlas Account** - [Sign up here](https://cloud.mongodb.com/)
- **Firebase Account** - [Sign up here](https://firebase.google.com/)
- **Razorpay Account** - [Sign up here](https://razorpay.com/)

### Development Tools (Optional)
- **VS Code** - Recommended IDE
- **Docker Desktop** - For containerized development
- **Postman** - API testing
- **MongoDB Compass** - Database GUI

## 🚀 Quick Start (Local Development)

### 1. Clone the Repository
```bash
git clone <repository-url>
cd PlaySplit
```

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env` with your configuration:
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/playsplit?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-here
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
CLIENT_URL=http://localhost:3000
RAZORPAY_WEBHOOK_SECRET=your_razorpay_webhook_secret
```

Start the backend:
```bash
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env
```

Edit `.env` with your configuration:
```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_SOCKET_URL=http://localhost:5000
REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
REACT_APP_FIREBASE_PROJECT_ID=your_firebase_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
REACT_APP_FIREBASE_APP_ID=your_firebase_app_id
REACT_APP_RAZORPAY_KEY_ID=your_razorpay_key_id
```

Start the frontend:
```bash
npm start
```

### 4. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Health Check**: http://localhost:5000/health

## 🔧 Detailed Configuration

### MongoDB Atlas Setup

1. **Create a MongoDB Atlas Account**
   - Go to [MongoDB Atlas](https://cloud.mongodb.com/)
   - Create a new account or sign in
   - Create a new cluster

2. **Configure Database Access**
   - Go to Database Access
   - Add a new database user
   - Set username and password
   - Give appropriate permissions

3. **Configure Network Access**
   - Go to Network Access
   - Add IP Address (0.0.0.0/0 for development, specific IPs for production)

4. **Get Connection String**
   - Go to Clusters → Connect
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user password

### Firebase Setup

1. **Create Firebase Project**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project
   - Enable Google Analytics (optional)

2. **Enable Authentication**
   - Go to Authentication → Sign-in method
   - Enable Email/Password and Google providers
   - Configure OAuth consent screen for Google

3. **Get Web App Configuration**
   - Go to Project Settings → General
   - Scroll down to "Your apps"
   - Add a web app
   - Copy the configuration object

4. **Generate Service Account Key**
   - Go to Project Settings → Service accounts
   - Click "Generate new private key"
   - Save the JSON file securely
   - Extract required fields for backend .env

### Razorpay Setup

1. **Create Razorpay Account**
   - Go to [Razorpay Dashboard](https://dashboard.razorpay.com/)
   - Complete KYC verification
   - Activate your account

2. **Get API Keys**
   - Go to Settings → API Keys
   - Generate new API keys
   - Copy Key ID and Key Secret

3. **Set up Webhooks**
   - Go to Settings → Webhooks
   - Add webhook URL: `https://your-backend-url/api/payments/webhook`
   - Select events: `payment.captured`, `payment.failed`, `order.paid`
   - Generate webhook secret

## 🚢 Production Deployment

### Backend Deployment (Render)

1. **Prepare for Deployment**
   ```bash
   cd backend
   npm run build  # If you have a build script
   ```

2. **Deploy to Render**
   - Create account on [Render](https://render.com/)
   - Connect your GitHub repository
   - Create a new Web Service
   - Configure environment variables
   - Deploy

3. **Environment Variables on Render**
   ```
   NODE_ENV=production
   PORT=10000
   MONGODB_URI=your_mongodb_atlas_uri
   JWT_SECRET=your_jwt_secret
   FIREBASE_PROJECT_ID=your_firebase_project_id
   FIREBASE_PRIVATE_KEY=your_firebase_private_key
   FIREBASE_CLIENT_EMAIL=your_firebase_client_email
   RAZORPAY_KEY_ID=your_razorpay_key_id
   RAZORPAY_KEY_SECRET=your_razorpay_key_secret
   RAZORPAY_WEBHOOK_SECRET=your_razorpay_webhook_secret
   CLIENT_URL=https://your-frontend-url.vercel.app
   ```

### Frontend Deployment (Vercel)

1. **Prepare for Deployment**
   ```bash
   cd frontend
   npm run build
   ```

2. **Deploy to Vercel**
   - Create account on [Vercel](https://vercel.com/)
   - Connect your GitHub repository
   - Import project
   - Configure environment variables
   - Deploy

3. **Environment Variables on Vercel**
   ```
   REACT_APP_API_URL=https://your-backend-url.render.com
   REACT_APP_SOCKET_URL=https://your-backend-url.render.com
   REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
   REACT_APP_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
   REACT_APP_FIREBASE_PROJECT_ID=your_firebase_project_id
   REACT_APP_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
   REACT_APP_FIREBASE_APP_ID=your_firebase_app_id
   REACT_APP_RAZORPAY_KEY_ID=your_razorpay_key_id
   ```

## 🐳 Docker Deployment

### Using Docker Compose
```bash
# Create .env file in root directory with all environment variables
cp .env.example .env

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Individual Docker Commands
```bash
# Build backend
cd backend
docker build -t playsplit-backend .

# Run backend
docker run -p 5000:5000 --env-file .env playsplit-backend

# Build frontend
cd frontend
docker build -t playsplit-frontend .

# Run frontend
docker run -p 3000:3000 --env-file .env playsplit-frontend
```

## 📱 Mobile App Setup (Optional)

If you want to create a mobile version using React Native:

```bash
npx react-native init PlaySplitMobile
cd PlaySplitMobile
npm install @react-navigation/native
npm install react-native-firebase
# ... additional mobile-specific packages
```

## 🔒 Security Considerations

### Production Security Checklist

1. **Environment Variables**
   - Never commit .env files
   - Use strong, unique secrets
   - Rotate keys regularly

2. **Database Security**
   - Use MongoDB Atlas with restricted IP access
   - Enable authentication
   - Regular backups

3. **API Security**
   - Enable CORS with specific origins
   - Use HTTPS only in production
   - Implement rate limiting
   - Validate all inputs

4. **Firebase Security**
   - Configure security rules
   - Enable App Check
   - Monitor for suspicious activity

5. **Payment Security**
   - Verify webhook signatures
   - Use HTTPS for all payment endpoints
   - Log all payment transactions
   - Never store sensitive payment data

## 📊 Monitoring and Analytics

### Application Monitoring
- Set up error tracking (Sentry, LogRocket)
- Monitor API performance
- Set up uptime monitoring
- Configure log aggregation

### Firebase Analytics
```javascript
// Add to your React components
import { analytics } from './config/firebase';
import { logEvent } from 'firebase/analytics';

// Track custom events
logEvent(analytics, 'match_created', {
  match_type: 'football',
  participants: 12
});
```

## 🛠️ Development Tools

### Useful VS Code Extensions
- ES7+ React/Redux/React-Native snippets
- Tailwind CSS IntelliSense
- Auto Rename Tag
- Bracket Pair Colorizer
- GitLens
- Prettier
- ESLint

### Database Tools
- MongoDB Compass for database visualization
- Robo 3T (Studio 3T) as alternative MongoDB client

### API Testing
```bash
# Install HTTPie for command-line API testing
brew install httpie  # macOS
# or
pip install httpie   # Python

# Test API endpoints
http GET localhost:5000/api/matches Authorization:"Bearer YOUR_TOKEN"
```

## 🚨 Troubleshooting

### Common Issues

1. **CORS Errors**
   - Check CLIENT_URL in backend .env
   - Verify frontend URL in CORS configuration

2. **Firebase Authentication Errors**
   - Verify API keys and configuration
   - Check Firebase project settings
   - Ensure domain is authorized

3. **MongoDB Connection Issues**
   - Check connection string format
   - Verify network access in MongoDB Atlas
   - Test with MongoDB Compass

4. **Razorpay Payment Issues**
   - Verify API keys (test vs live)
   - Check webhook URL configuration
   - Test with Razorpay's test cards

5. **Build Failures**
   - Clear node_modules and reinstall
   - Check Node.js version compatibility
   - Verify all environment variables

### Debug Commands
```bash
# Check Node.js version
node --version

# Check npm version
npm --version

# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Check for security vulnerabilities
npm audit
npm audit fix

# Check for outdated packages
npm outdated
```

## 📞 Support and Community

### Getting Help
- Create issues on GitHub repository
- Check existing documentation
- Search Stack Overflow for common issues

### Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write tests
5. Submit a pull request

### License
This project is licensed under the MIT License. See LICENSE file for details.

---

## 🎉 You're All Set!

Your PlaySplit application should now be running successfully. Visit the frontend URL to start creating matches and managing payments!

For additional help or feature requests, please create an issue in the repository.
