import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  FaFutbol, 
  FaUsers, 
  FaCreditCard, 
  FaChartLine,
  FaArrowRight,
  FaPlay
} from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import Footer from '../components/layout/Footer';

const HomePage = () => {
  const { currentUser } = useAuth();

  const features = [
    {
      icon: FaFutbol,
      title: 'Easy Match Creation',
      description: 'Create and organize football matches with just a few clicks. Set location, time, and player limits.',
      color: 'from-green-500 to-grass-600'
    },
    {
      icon: FaUsers,
      title: 'Player Management',
      description: 'Manage player registrations, track attendance, and organize teams efficiently.',
      color: 'from-blue-500 to-blue-600'
    },
    {
      icon: FaCreditCard,
      title: 'Secure Payments',
      description: 'Integrated payment system powered by Razorpay. Split costs fairly among all participants.',
      color: 'from-purple-500 to-purple-600'
    },
    {
      icon: FaChartLine,
      title: 'Analytics & Insights',
      description: 'Track your playing history, match statistics, and payment records in one place.',
      color: 'from-orange-500 to-red-600'
    }
  ];

  const stats = [
    { number: '500+', label: 'Matches Organized' },
    { number: '2000+', label: 'Happy Players' },
    { number: '50+', label: 'Football Turfs' },
    { number: '₹5L+', label: 'Payments Processed' }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Background gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-grass-900/50 via-green-800/50 to-grass-700/50" />
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            {/* Hero Title */}
            <motion.h1 
              className="text-5xl md:text-7xl font-bold text-white leading-tight"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
            >
              Organize <span className="text-grass-400 glow-text">Football</span>
              <br />Matches Like a Pro
            </motion.h1>

            {/* Hero Subtitle */}
            <motion.p 
              className="text-xl md:text-2xl text-white/80 max-w-3xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
            >
              The ultimate platform for football enthusiasts to create matches, 
              manage players, handle payments, and build lasting connections on the turf.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div 
              className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
            >
              {currentUser ? (
                <Link to="/dashboard" className="btn-primary text-lg px-8 py-4">
                  <span>Go to Dashboard</span>
                  <FaArrowRight className="ml-2" />
                </Link>
              ) : (
                <>
                  <Link to="/register" className="btn-primary text-lg px-8 py-4">
                    <span>Get Started Free</span>
                    <FaPlay className="ml-2" />
                  </Link>
                  <Link 
                    to="/login" 
                    className="glass border border-white/30 hover:border-grass-400/50 text-white px-8 py-4 rounded-xl transition-all duration-300 hover:bg-white/10"
                  >
                    Sign In
                  </Link>
                </>
              )}
            </motion.div>

            {/* Hero Stats */}
            <motion.div 
              className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-16"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.8 }}
            >
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  className="text-center"
                  whileHover={{ scale: 1.05 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 + (index * 0.1) }}
                >
                  <div className="text-3xl md:text-4xl font-bold text-grass-400 glow-text">
                    {stat.number}
                  </div>
                  <div className="text-white/60 mt-1">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Everything You Need to 
              <span className="text-grass-400 block">Manage Football Matches</span>
            </h2>
            <p className="text-xl text-white/70 max-w-2xl mx-auto">
              From organizing matches to handling payments, PlaySplit has got you covered with professional-grade tools.
            </p>
          </motion.div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  className="glass p-8 rounded-2xl border border-white/20 group hover:border-grass-400/30 transition-all duration-500"
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.2, duration: 0.8 }}
                  viewport={{ once: true }}
                  whileHover={{ scale: 1.02, y: -5 }}
                >
                  <div className={`inline-flex p-4 rounded-xl bg-gradient-to-r ${feature.color} mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="text-2xl text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">
                    {feature.title}
                  </h3>
                  <p className="text-white/70 leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              How It <span className="text-grass-400">Works</span>
            </h2>
            <p className="text-xl text-white/70 max-w-2xl mx-auto">
              Get started in just three simple steps and organize your first match today.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Create Your Match',
                description: 'Set up your football match with location, time, player limits, and cost per player.',
                icon: FaFutbol
              },
              {
                step: '02',
                title: 'Invite Players',
                description: 'Share your match link and let players join. Track registrations in real-time.',
                icon: FaUsers
              },
              {
                step: '03',
                title: 'Handle Payments',
                description: 'Collect payments securely through our integrated system. Split costs automatically.',
                icon: FaCreditCard
              }
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.step}
                  className="text-center group"
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.2, duration: 0.8 }}
                  viewport={{ once: true }}
                >
                  <div className="relative mb-8">
                    <div className="w-24 h-24 mx-auto glass rounded-full flex items-center justify-center border-2 border-grass-400/30 group-hover:border-grass-400 group-hover:scale-110 transition-all duration-300">
                      <Icon className="text-3xl text-grass-400" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-grass-400 rounded-full flex items-center justify-center text-grass-900 font-bold text-sm">
                      {item.step}
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-grass-400 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-white/70 leading-relaxed">
                    {item.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            className="glass p-12 rounded-3xl border border-white/20"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <FaFutbol className="text-6xl text-grass-400 mx-auto mb-8 animate-bounce" />
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to Organize Your First Match?
            </h2>
            <p className="text-xl text-white/70 mb-8 max-w-2xl mx-auto">
              Join thousands of football enthusiasts who are already using PlaySplit 
              to organize amazing matches and build their football community.
            </p>
            {!currentUser && (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to="/register" className="btn-primary text-lg px-8 py-4">
                  <span>Start For Free</span>
                  <FaArrowRight className="ml-2" />
                </Link>
                <Link 
                  to="/login" 
                  className="text-white/80 hover:text-white underline underline-offset-4 transition-colors"
                >
                  Already have an account? Sign in
                </Link>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default HomePage;
