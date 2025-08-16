const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const initializeFirebase = () => {
  try {
    if (!admin.apps.length) {
      // Check if Firebase credentials are properly configured
      if (!process.env.FIREBASE_PROJECT_ID || 
          !process.env.FIREBASE_PRIVATE_KEY || 
          !process.env.FIREBASE_CLIENT_EMAIL ||
          process.env.FIREBASE_PRIVATE_KEY.includes('YOUR_PRIVATE_KEY_HERE') ||
          process.env.FIREBASE_CLIENT_EMAIL.includes('your-service-account')) {
        
        console.log('⚠️  Firebase Admin SDK not configured - skipping initialization');
        console.log('   Please update your .env file with actual Firebase credentials');
        console.log('   See DEVELOPMENT.md for setup instructions');
        return null;
      }

      const serviceAccount = {
        type: "service_account",
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
      };

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: process.env.FIREBASE_PROJECT_ID,
      });

      console.log('✅ Firebase Admin initialized successfully');
    }
    return admin;
  } catch (error) {
    console.error('❌ Firebase Admin initialization failed:', error);
    console.log('   Please check your Firebase credentials in .env file');
    console.log('   See DEVELOPMENT.md for setup instructions');
    return null;
  }
};

// Verify Firebase ID token
const verifyIdToken = async (idToken) => {
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    console.error('❌ Firebase token verification failed:', error);
    throw new Error('Invalid Firebase token');
  }
};

// Get user by UID
const getUserByUid = async (uid) => {
  try {
    const userRecord = await admin.auth().getUser(uid);
    return userRecord;
  } catch (error) {
    console.error('❌ Firebase get user failed:', error);
    throw new Error('User not found');
  }
};

// Create custom token
const createCustomToken = async (uid, additionalClaims = {}) => {
  try {
    const customToken = await admin.auth().createCustomToken(uid, additionalClaims);
    return customToken;
  } catch (error) {
    console.error('❌ Firebase custom token creation failed:', error);
    throw new Error('Failed to create custom token');
  }
};

// Set custom user claims
const setCustomUserClaims = async (uid, customClaims) => {
  try {
    await admin.auth().setCustomUserClaims(uid, customClaims);
    return true;
  } catch (error) {
    console.error('❌ Firebase set custom claims failed:', error);
    throw new Error('Failed to set custom claims');
  }
};

// Delete user
const deleteUser = async (uid) => {
  try {
    await admin.auth().deleteUser(uid);
    return true;
  } catch (error) {
    console.error('❌ Firebase delete user failed:', error);
    throw new Error('Failed to delete user');
  }
};

module.exports = {
  admin,
  initializeFirebase,
  verifyIdToken,
  getUserByUid,
  createCustomToken,
  setCustomUserClaims,
  deleteUser
};
