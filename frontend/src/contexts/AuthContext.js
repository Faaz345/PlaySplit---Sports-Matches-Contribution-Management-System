import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  updateProfile,
  deleteUser
} from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';
import { apiHelpers, endpoints } from '../config/api';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Register new user
  const register = async (userData) => {
    const { email, password, name, phone } = userData;
    setIsRegistering(true);
    
    try {
      // Create Firebase user
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update display name
      await updateProfile(user, { displayName: name });
      
      // Get Firebase ID token
      const idToken = await user.getIdToken();
      
      // Register user in backend
      const response = await apiHelpers.post(endpoints.auth.register, {
        idToken,
        name,
        email,
        phone,
        authProvider: 'email'
      });
      
      if (response.data.success) {
        setUserProfile(response.data.data.user);
        toast.success('Account created successfully!');
        return { success: true, user: response.data.data.user };
      }
    } catch (error) {
      console.error('Registration error:', error);
      
      // Handle specific Firebase errors
      let errorMessage = 'Registration failed';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Email is already registered';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      toast.error(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsRegistering(false);
    }
  };

  // Login user
  const login = async (email, password) => {
    setIsLoggingIn(true);
    
    try {
      // Sign in with Firebase
      const { user } = await signInWithEmailAndPassword(auth, email, password);
      
      // Get Firebase ID token
      const idToken = await user.getIdToken();
      
      // Login in backend
      const response = await apiHelpers.post(endpoints.auth.login, { idToken });
      
      if (response.data.success) {
        setUserProfile(response.data.data.user);
        toast.success('Logged in successfully!');
        return { success: true, user: response.data.data.user };
      }
    } catch (error) {
      console.error('Login error:', error);
      
      let errorMessage = 'Login failed';
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      } else if (error.code === 'auth/user-disabled') {
        errorMessage = 'This account has been disabled';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Try again later';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      toast.error(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Google login
  const loginWithGoogle = async () => {
    setIsLoggingIn(true);
    
    try {
      // Sign in with Google popup
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Get Firebase ID token
      const idToken = await user.getIdToken();
      
      // Check if user exists in backend
      try {
        const response = await apiHelpers.post(endpoints.auth.login, { idToken });
        
        if (response.data.success) {
          setUserProfile(response.data.data.user);
          toast.success('Logged in with Google!');
          return { success: true, user: response.data.data.user };
        }
      } catch (loginError) {
        // If user doesn't exist, register them
        if (loginError.response?.status === 404) {
          const registerResponse = await apiHelpers.post(endpoints.auth.register, {
            idToken,
            name: user.displayName,
            email: user.email,
            phone: user.phoneNumber,
            authProvider: 'google'
          });
          
          if (registerResponse.data.success) {
            setUserProfile(registerResponse.data.data.user);
            toast.success('Welcome! Your account has been created.');
            return { success: true, user: registerResponse.data.data.user };
          }
        }
        throw loginError;
      }
    } catch (error) {
      console.error('Google login error:', error);
      
      let errorMessage = 'Google login failed';
      if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Login cancelled';
      } else if (error.code === 'auth/popup-blocked') {
        errorMessage = 'Popup blocked. Please allow popups and try again';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      toast.error(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Logout
  const logout = async () => {
    try {
      // Call backend logout
      await apiHelpers.post(endpoints.auth.logout);
    } catch (error) {
      console.error('Backend logout error:', error);
    } finally {
      // Always sign out from Firebase
      await signOut(auth);
      setCurrentUser(null);
      setUserProfile(null);
      toast.success('Logged out successfully');
    }
  };

  // Update user profile
  const updateUserProfile = async (updates) => {
    try {
      const response = await apiHelpers.put(endpoints.auth.profile, updates);
      
      if (response.data.success) {
        setUserProfile(response.data.data.user);
        toast.success('Profile updated successfully!');
        return response.data.data.user;
      }
    } catch (error) {
      console.error('Profile update error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to update profile';
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Delete user account
  const deleteAccount = async () => {
    try {
      // Delete from backend
      await apiHelpers.delete(endpoints.auth.deleteAccount, {
        confirmDelete: 'DELETE'
      });
      
      // Delete Firebase user
      if (currentUser) {
        await deleteUser(currentUser);
      }
      
      setCurrentUser(null);
      setUserProfile(null);
      toast.success('Account deleted successfully');
    } catch (error) {
      console.error('Account deletion error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to delete account';
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Get user profile from backend
  const fetchUserProfile = async () => {
    try {
      const response = await apiHelpers.get(endpoints.auth.profile);
      
      if (response.data.success) {
        setUserProfile(response.data.data.user);
        return response.data.data.user;
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      // Don't show error toast for profile fetch as it might be called frequently
    }
  };

  // Refresh session
  const refreshSession = async () => {
    try {
      const response = await apiHelpers.post(endpoints.auth.refresh);
      
      if (response.data.success) {
        setUserProfile(response.data.data.user);
        return response.data.data.user;
      }
    } catch (error) {
      console.error('Session refresh error:', error);
      // If refresh fails, logout user
      await logout();
    }
  };

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        // User is signed in, fetch profile
        try {
          await fetchUserProfile();
        } catch (error) {
          console.error('Error fetching profile on auth state change:', error);
        }
      } else {
        // User is signed out
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Auto-refresh token periodically
  useEffect(() => {
    if (currentUser) {
      const interval = setInterval(async () => {
        try {
          await currentUser.getIdToken(true); // Force refresh
        } catch (error) {
          console.error('Token refresh error:', error);
        }
      }, 50 * 60 * 1000); // Refresh every 50 minutes

      return () => clearInterval(interval);
    }
  }, [currentUser]);

  const value = {
    // State
    currentUser,
    userProfile,
    loading,
    isRegistering,
    isLoggingIn,
    
    // Methods
    register,
    login,
    loginWithGoogle,
    logout,
    updateUserProfile,
    deleteAccount,
    fetchUserProfile,
    refreshSession,
    
    // Computed values
    isAuthenticated: !!currentUser,
    isAdmin: userProfile?.role === 'admin',
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
