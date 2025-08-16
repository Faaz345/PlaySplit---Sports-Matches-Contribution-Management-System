import React from 'react';
import { motion } from 'framer-motion';
import { FaCog } from 'react-icons/fa';

const AdminDashboard = () => {
  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <FaCog className="text-6xl text-grass-400 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-white mb-4">Admin Dashboard</h1>
          <p className="text-white/70">Manage users, matches, and system settings</p>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminDashboard;
