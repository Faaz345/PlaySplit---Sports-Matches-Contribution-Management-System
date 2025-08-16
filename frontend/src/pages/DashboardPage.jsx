import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  FaFutbol, 
  FaUsers, 
  FaCreditCard, 
  FaCalendar,
  FaPlus,
  FaTrophy
} from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';

const DashboardPage = () => {
  const { userProfile } = useAuth();

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl font-bold text-white mb-2">
            Welcome back, {userProfile?.name || 'Player'}! 🏆
          </h1>
          <p className="text-white/70">
            Ready to organize or join some football matches?
          </p>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { 
              icon: FaFutbol, 
              title: 'Matches Played', 
              value: '12',
              color: 'from-green-500 to-grass-600' 
            },
            { 
              icon: FaUsers, 
              title: 'Matches Organized', 
              value: '5',
              color: 'from-blue-500 to-blue-600' 
            },
            { 
              icon: FaCreditCard, 
              title: 'Total Payments', 
              value: '₹2,400',
              color: 'from-purple-500 to-purple-600' 
            },
            { 
              icon: FaTrophy, 
              title: 'Win Rate', 
              value: '73%',
              color: 'from-orange-500 to-red-600' 
            }
          ].map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.title}
                className="glass p-6 rounded-2xl border border-white/20"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                whileHover={{ scale: 1.02, y: -2 }}
              >
                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${stat.color} mb-4`}>
                  <Icon className="text-xl text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-1">{stat.value}</h3>
                <p className="text-white/70 text-sm">{stat.title}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <motion.div
          className="glass p-8 rounded-2xl border border-white/20 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          <h2 className="text-2xl font-bold text-white mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link to="/create-match" className="btn-primary flex items-center justify-center py-4 hover:scale-105 transition-transform">
              <FaPlus className="mr-2" />
              Create Match
            </Link>
            <Link to="/matches" className="glass border border-white/20 hover:border-grass-400/50 text-white px-6 py-4 rounded-xl transition-all duration-300 hover:bg-white/10 flex items-center justify-center hover:scale-105">
              <FaCalendar className="mr-2" />
              View Matches
            </Link>
            <Link to="/payments" className="glass border border-white/20 hover:border-grass-400/50 text-white px-6 py-4 rounded-xl transition-all duration-300 hover:bg-white/10 flex items-center justify-center hover:scale-105">
              <FaCreditCard className="mr-2" />
              Payment History
            </Link>
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          className="glass p-8 rounded-2xl border border-white/20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.6 }}
        >
          <h2 className="text-2xl font-bold text-white mb-6">Recent Activity</h2>
          <div className="space-y-4">
            {[
              { action: 'Joined match', details: 'Sunday Football at Central Park', time: '2 hours ago' },
              { action: 'Created match', details: 'Evening Match at Sports Complex', time: '1 day ago' },
              { action: 'Payment completed', details: 'Match fee for Saturday game', time: '2 days ago' }
            ].map((activity, index) => (
              <motion.div
                key={index}
                className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 + (index * 0.1), duration: 0.6 }}
              >
                <div>
                  <p className="text-white font-medium">{activity.action}</p>
                  <p className="text-white/70 text-sm">{activity.details}</p>
                </div>
                <span className="text-white/60 text-sm">{activity.time}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default DashboardPage;
