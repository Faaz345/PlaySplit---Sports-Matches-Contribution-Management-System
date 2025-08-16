import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { HelmetProvider } from 'react-helmet-async';

// Context Providers
import { AuthProvider } from './contexts/AuthContext';

// Components
import LoadingSpinner from './components/ui/LoadingSpinner';
import ErrorBoundary from './components/ui/ErrorBoundary';
import ProtectedRoute from './components/auth/ProtectedRoute';
import FloatingElements from './components/ui/FloatingElements';
import Navbar from './components/layout/Navbar';

// Lazy load pages for better performance
const HomePage = React.lazy(() => import('./pages/HomePage'));
const LoginPage = React.lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = React.lazy(() => import('./pages/auth/RegisterPage'));
const DashboardPage = React.lazy(() => import('./pages/DashboardPage'));
const MatchesPage = React.lazy(() => import('./pages/MatchesPage'));
const MatchDetailPage = React.lazy(() => import('./pages/MatchDetailPage'));
const CreateMatchPage = React.lazy(() => import('./pages/CreateMatchPage'));
const ProfilePage = React.lazy(() => import('./pages/ProfilePage'));
const PaymentsPage = React.lazy(() => import('./pages/PaymentsPage'));
const AdminDashboard = React.lazy(() => import('./pages/admin/AdminDashboard'));
const NotFoundPage = React.lazy(() => import('./pages/NotFoundPage'));

function App() {
  return (
    <HelmetProvider>
      <ErrorBoundary>
        <AuthProvider>
          <Router>
            <div className="min-h-screen bg-gradient-to-br from-grass-900 via-green-800 to-grass-700 relative overflow-hidden">
              {/* Background floating elements */}
              <FloatingElements />
              
              {/* Main app content */}
              <div className="relative z-10">
                {/* Navigation */}
                <Navbar />
                
                {/* Main content */}
                <main className="pt-16">
                  <ErrorBoundary>
                    <Suspense 
                      fallback={
                        <div className="flex items-center justify-center min-h-screen">
                          <LoadingSpinner size="lg" />
                        </div>
                      }
                    >
                      <Routes>
                        {/* Public routes */}
                        <Route path="/" element={<HomePage />} />
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/register" element={<RegisterPage />} />
                        <Route path="/match/:id" element={<MatchDetailPage />} />
                        
                        {/* Protected routes */}
                        <Route path="/dashboard" element={
                          <ProtectedRoute>
                            <DashboardPage />
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/matches" element={
                          <ProtectedRoute>
                            <MatchesPage />
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/create-match" element={
                          <ProtectedRoute>
                            <CreateMatchPage />
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/profile" element={
                          <ProtectedRoute>
                            <ProfilePage />
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/payments" element={
                          <ProtectedRoute>
                            <PaymentsPage />
                          </ProtectedRoute>
                        } />
                        
                        {/* Admin routes */}
                        <Route path="/admin/*" element={
                          <ProtectedRoute adminOnly>
                            <AdminDashboard />
                          </ProtectedRoute>
                        } />
                        
                        {/* 404 page */}
                        <Route path="*" element={<NotFoundPage />} />
                      </Routes>
                    </Suspense>
                  </ErrorBoundary>
                </main>
              </div>
              
              {/* Toast notifications */}
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  className: 'toast',
                  success: {
                    iconTheme: {
                      primary: '#22c55e',
                      secondary: '#fff',
                    },
                  },
                  error: {
                    iconTheme: {
                      primary: '#ef4444',
                      secondary: '#fff',
                    },
                  },
                }}
              />
            </div>
          </Router>
        </AuthProvider>
      </ErrorBoundary>
    </HelmetProvider>
  );
}

export default App;
