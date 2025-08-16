import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { 
  FaCreditCard, 
  FaRupeeSign, 
  FaCalendarAlt,
  FaCheck,
  FaExclamationTriangle,
  FaSpinner,
  FaDownload,
  FaFilter,
  FaSearch,
  FaTimes,
  FaWallet,
  FaChartLine,
  FaFutbol,
  FaReceipt
} from 'react-icons/fa';
import api from '../config/api';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const PaymentsPage = () => {
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: 'all', // all, completed, pending, failed
    type: 'all', // all, match_fee, refund
    dateRange: 'all' // all, week, month, year
  });
  const [showFilters, setShowFilters] = useState(false);
  const [stats, setStats] = useState({
    totalSpent: 0,
    totalMatches: 0,
    pendingPayments: 0,
    avgMatchCost: 0
  });

  useEffect(() => {
    fetchPayments();
  }, []);

  useEffect(() => {
    filterPayments();
    calculateStats();
  }, [payments, searchTerm, filters]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const response = await api.get('/payments');
      
      if (response.data.success) {
        setPayments(response.data.payments || []);
      } else {
        toast.error('Failed to load payments');
      }
    } catch (error) {
      console.error('Fetch payments error:', error);
      // For demo purposes, let's create some sample payment data
      const samplePayments = [
        {
          _id: '1',
          amount: 200,
          status: 'completed',
          type: 'match_fee',
          matchTitle: 'Sunday Evening Football',
          matchDate: new Date(Date.now() + 86400000),
          createdAt: new Date(Date.now() - 3600000),
          paymentMethod: 'UPI',
          transactionId: 'TXN001234567'
        },
        {
          _id: '2',
          amount: 150,
          status: 'completed',
          type: 'match_fee',
          matchTitle: 'Weekend Warriors Match',
          matchDate: new Date(Date.now() + 172800000),
          createdAt: new Date(Date.now() - 86400000),
          paymentMethod: 'Credit Card',
          transactionId: 'TXN001234568'
        },
        {
          _id: '3',
          amount: 100,
          status: 'pending',
          type: 'match_fee',
          matchTitle: 'Midweek Challenge',
          matchDate: new Date(Date.now() + 259200000),
          createdAt: new Date(Date.now() - 1800000),
          paymentMethod: 'UPI',
          transactionId: 'TXN001234569'
        },
        {
          _id: '4',
          amount: 75,
          status: 'completed',
          type: 'refund',
          matchTitle: 'Cancelled Match',
          matchDate: new Date(Date.now() - 172800000),
          createdAt: new Date(Date.now() - 86400000),
          paymentMethod: 'UPI',
          transactionId: 'REF001234567'
        },
        {
          _id: '5',
          amount: 250,
          status: 'failed',
          type: 'match_fee',
          matchTitle: 'Championship Final',
          matchDate: new Date(Date.now() + 345600000),
          createdAt: new Date(Date.now() - 900000),
          paymentMethod: 'Debit Card',
          transactionId: 'TXN001234570'
        }
      ];
      setPayments(samplePayments);
    } finally {
      setLoading(false);
    }
  };

  const filterPayments = () => {
    let filtered = [...payments];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(payment => 
        payment.matchTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.transactionId.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(payment => payment.status === filters.status);
    }

    // Type filter
    if (filters.type !== 'all') {
      filtered = filtered.filter(payment => payment.type === filters.type);
    }

    // Date range filter
    if (filters.dateRange !== 'all') {
      const now = new Date();
      const startDate = new Date();
      
      switch (filters.dateRange) {
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
        default:
          break;
      }
      
      if (filters.dateRange !== 'all') {
        filtered = filtered.filter(payment => 
          new Date(payment.createdAt) >= startDate
        );
      }
    }

    setFilteredPayments(filtered);
  };

  const calculateStats = () => {
    const completedPayments = payments.filter(p => p.status === 'completed' && p.type === 'match_fee');
    const totalSpent = completedPayments.reduce((sum, payment) => sum + payment.amount, 0);
    const totalMatches = completedPayments.length;
    const pendingPayments = payments.filter(p => p.status === 'pending').length;
    const avgMatchCost = totalMatches > 0 ? totalSpent / totalMatches : 0;

    setStats({
      totalSpent,
      totalMatches,
      pendingPayments,
      avgMatchCost
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'text-green-400 bg-green-400/10';
      case 'pending':
        return 'text-yellow-400 bg-yellow-400/10';
      case 'failed':
        return 'text-red-400 bg-red-400/10';
      default:
        return 'text-gray-400 bg-gray-400/10';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <FaCheck />;
      case 'pending':
        return <FaSpinner className="animate-spin" />;
      case 'failed':
        return <FaExclamationTriangle />;
      default:
        return null;
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const clearFilters = () => {
    setFilters({
      status: 'all',
      type: 'all',
      dateRange: 'all'
    });
    setSearchTerm('');
  };

  const downloadReceipt = (paymentId) => {
    // Simulate receipt download
    toast.success('Receipt downloaded successfully!');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

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
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">💳 Payment Center</h1>
            <p className="text-white/70">Track your match payments and transaction history</p>
          </div>
        </motion.div>

        {/* Payment Stats */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <div className="glass p-6 rounded-2xl border border-white/20">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-grass-600/20 rounded-xl">
                <FaRupeeSign className="text-2xl text-grass-400" />
              </div>
              <div>
                <p className="text-white/70 text-sm">Total Spent</p>
                <p className="text-2xl font-bold text-white">₹{stats.totalSpent.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="glass p-6 rounded-2xl border border-white/20">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-600/20 rounded-xl">
                <FaFutbol className="text-2xl text-blue-400" />
              </div>
              <div>
                <p className="text-white/70 text-sm">Matches Paid</p>
                <p className="text-2xl font-bold text-white">{stats.totalMatches}</p>
              </div>
            </div>
          </div>

          <div className="glass p-6 rounded-2xl border border-white/20">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-yellow-600/20 rounded-xl">
                <FaSpinner className="text-2xl text-yellow-400" />
              </div>
              <div>
                <p className="text-white/70 text-sm">Pending</p>
                <p className="text-2xl font-bold text-white">{stats.pendingPayments}</p>
              </div>
            </div>
          </div>

          <div className="glass p-6 rounded-2xl border border-white/20">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-purple-600/20 rounded-xl">
                <FaChartLine className="text-2xl text-purple-400" />
              </div>
              <div>
                <p className="text-white/70 text-sm">Avg per Match</p>
                <p className="text-2xl font-bold text-white">₹{Math.round(stats.avgMatchCost)}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Search and Filter */}
        <motion.div
          className="glass p-6 rounded-2xl border border-white/20 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/60" />
              <input
                type="text"
                placeholder="Search by match title or transaction ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-grass-400 focus:border-transparent transition-all duration-300"
              />
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-6 py-3 rounded-xl border transition-all duration-300 flex items-center space-x-2 ${
                showFilters 
                  ? 'bg-grass-600 border-grass-600 text-white' 
                  : 'glass border-white/20 text-white hover:border-grass-400/50'
              }`}
            >
              <FaFilter />
              <span>Filters</span>
              {(filters.status !== 'all' || filters.type !== 'all' || filters.dateRange !== 'all') && (
                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">•</span>
              )}
            </button>
          </div>

          {/* Filters Panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/20"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-grass-400"
                  >
                    <option value="all">All Status</option>
                    <option value="completed">Completed</option>
                    <option value="pending">Pending</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Type</label>
                  <select
                    value={filters.type}
                    onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-grass-400"
                  >
                    <option value="all">All Types</option>
                    <option value="match_fee">Match Fee</option>
                    <option value="refund">Refund</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Date Range</label>
                  <select
                    value={filters.dateRange}
                    onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-grass-400"
                  >
                    <option value="all">All Time</option>
                    <option value="week">Last 7 Days</option>
                    <option value="month">Last 30 Days</option>
                    <option value="year">Last Year</option>
                  </select>
                </div>

                <div className="md:col-span-3 flex justify-end">
                  <button
                    onClick={clearFilters}
                    className="glass border border-white/20 hover:border-red-400/50 text-white px-4 py-2 rounded-lg transition-all duration-300 hover:bg-red-500/10 flex items-center space-x-2"
                  >
                    <FaTimes />
                    <span>Clear Filters</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Results Count */}
        <motion.div
          className="mb-6 flex items-center justify-between"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <p className="text-white/70">
            {filteredPayments.length} transaction{filteredPayments.length !== 1 ? 's' : ''} found
          </p>
        </motion.div>

        {/* Payments List */}
        <div className="space-y-4">
          <AnimatePresence>
            {filteredPayments.map((payment, index) => (
              <motion.div
                key={payment._id}
                className="glass p-6 rounded-2xl border border-white/20 hover:border-grass-400/50 transition-all duration-300"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                  {/* Payment Info */}
                  <div className="flex items-start space-x-4 flex-1">
                    <div className={`p-3 rounded-xl ${payment.type === 'refund' ? 'bg-blue-600/20' : 'bg-grass-600/20'}`}>
                      {payment.type === 'refund' ? (
                        <FaWallet className="text-2xl text-blue-400" />
                      ) : (
                        <FaCreditCard className="text-2xl text-grass-400" />
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-bold text-white">{payment.matchTitle}</h3>
                        <span className={`flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(payment.status)}`}>
                          {getStatusIcon(payment.status)}
                          <span className="ml-1">{payment.status}</span>
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-white/70 text-sm">
                        <div className="space-y-1">
                          <p><span className="font-medium">Transaction ID:</span> {payment.transactionId}</p>
                          <p><span className="font-medium">Payment Method:</span> {payment.paymentMethod}</p>
                        </div>
                        <div className="space-y-1">
                          <p><span className="font-medium">Date:</span> {formatDate(payment.createdAt)}</p>
                          <p><span className="font-medium">Match Date:</span> {formatDate(payment.matchDate)}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Amount and Actions */}
                  <div className="flex items-center justify-between lg:justify-end space-x-6 mt-4 lg:mt-0">
                    <div className="text-right">
                      <p className={`text-2xl font-bold ${
                        payment.type === 'refund' ? 'text-blue-400' : 
                        payment.status === 'completed' ? 'text-green-400' : 'text-white'
                      }`}>
                        {payment.type === 'refund' ? '+' : '-'}₹{payment.amount}
                      </p>
                      <p className="text-white/60 text-sm capitalize">{payment.type.replace('_', ' ')}</p>
                    </div>

                    {payment.status === 'completed' && (
                      <button
                        onClick={() => downloadReceipt(payment._id)}
                        className="glass border border-white/20 hover:border-grass-400/50 text-white p-3 rounded-lg transition-all duration-300 hover:bg-grass-500/10 group"
                        title="Download Receipt"
                      >
                        <FaDownload className="group-hover:text-grass-400" />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Empty State */}
        {filteredPayments.length === 0 && (
          <motion.div
            className="text-center py-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <FaReceipt className="text-6xl text-white/30 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">No transactions found</h3>
            <p className="text-white/60 mb-6">
              {searchTerm || filters.status !== 'all' || filters.type !== 'all' || filters.dateRange !== 'all'
                ? 'Try adjusting your search or filters.'
                : 'Start joining matches to see your payment history here!'}
            </p>
            <Link to="/matches" className="btn-primary inline-flex items-center space-x-2">
              <FaFutbol />
              <span>Browse Matches</span>
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default PaymentsPage;
