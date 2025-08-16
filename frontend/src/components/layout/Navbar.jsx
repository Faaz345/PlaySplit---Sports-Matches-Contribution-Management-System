import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { 
  FaFutbol, 
  FaUser, 
  FaSignOutAlt, 
  FaPlus, 
  FaCreditCard,
  FaBars,
  FaTimes,
  FaHome,
  FaList,
  FaCog
} from 'react-icons/fa';

const Navbar = () => {
  const { currentUser, userProfile, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const navLinks = [
    { to: '/', label: 'Home', icon: FaHome },
    ...(currentUser ? [
      { to: '/dashboard', label: 'Dashboard', icon: FaUser },
      { to: '/matches', label: 'Matches', icon: FaList },
      { to: '/create-match', label: 'Create Match', icon: FaPlus },
      { to: '/payments', label: 'Payments', icon: FaCreditCard },
    ] : []),
    ...(isAdmin ? [
      { to: '/admin', label: 'Admin', icon: FaCog }
    ] : [])
  ];

  const isActiveLink = (path) => {
    return location.pathname === path;
  };

  return (
    <motion.nav 
      className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/20"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 group">
            <motion.div
              className="text-grass-400 text-2xl"
              whileHover={{ rotate: 360, scale: 1.1 }}
              transition={{ duration: 0.5 }}
            >
              <FaFutbol />
            </motion.div>
            <span className="text-xl font-bold text-white group-hover:text-grass-400 transition-colors">
              PlaySplit
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-all duration-300 ${
                    isActiveLink(link.to)
                      ? 'bg-grass-600 text-white'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Icon className="text-sm" />
                  <span>{link.label}</span>
                </Link>
              );
            })}

            {/* User Menu */}
            {currentUser ? (
              <div className="flex items-center space-x-4 ml-4 pl-4 border-l border-white/20">
                <Link 
                  to="/profile"
                  className="flex items-center space-x-2 text-white/80 hover:text-white transition-colors"
                >
                  {userProfile?.profilePicture ? (
                    <img
                      src={userProfile.profilePicture}
                      alt="Profile"
                      className="w-8 h-8 rounded-full border-2 border-grass-400"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-grass-600 flex items-center justify-center">
                      <FaUser className="text-sm text-white" />
                    </div>
                  )}
                  <span className="hidden lg:block">{userProfile?.name}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-white/80 hover:text-red-400 transition-colors p-2 hover:bg-red-500/10 rounded-lg"
                  title="Logout"
                >
                  <FaSignOutAlt />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2 ml-4 pl-4 border-l border-white/20">
                <Link
                  to="/login"
                  className="text-white/80 hover:text-white px-4 py-2 rounded-lg transition-colors hover:bg-white/10"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="btn-primary text-sm"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-white p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            className="md:hidden glass-dark border-t border-white/20"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="px-4 py-4 space-y-2">
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setIsMenuOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-300 ${
                      isActiveLink(link.to)
                        ? 'bg-grass-600 text-white'
                        : 'text-white/80 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <Icon />
                    <span>{link.label}</span>
                  </Link>
                );
              })}

              {currentUser ? (
                <>
                  <div className="border-t border-white/20 pt-2 mt-2">
                    <Link
                      to="/profile"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center space-x-3 px-4 py-3 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-all duration-300"
                    >
                      {userProfile?.profilePicture ? (
                        <img
                          src={userProfile.profilePicture}
                          alt="Profile"
                          className="w-6 h-6 rounded-full border border-grass-400"
                        />
                      ) : (
                        <FaUser />
                      )}
                      <span>{userProfile?.name || 'Profile'}</span>
                    </Link>
                    <button
                      onClick={() => {
                        handleLogout();
                        setIsMenuOpen(false);
                      }}
                      className="flex items-center space-x-3 w-full px-4 py-3 rounded-lg text-red-400 hover:bg-red-500/10 transition-all duration-300"
                    >
                      <FaSignOutAlt />
                      <span>Logout</span>
                    </button>
                  </div>
                </>
              ) : (
                <div className="border-t border-white/20 pt-2 mt-2 space-y-2">
                  <Link
                    to="/login"
                    onClick={() => setIsMenuOpen(false)}
                    className="block w-full text-center py-3 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-300"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setIsMenuOpen(false)}
                    className="block w-full text-center py-3 bg-grass-600 hover:bg-grass-500 text-white rounded-lg transition-all duration-300"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;
