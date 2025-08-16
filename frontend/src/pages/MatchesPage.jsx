import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { 
  FaFutbol, 
  FaSearch, 
  FaFilter, 
  FaPlus,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaClock,
  FaUsers,
  FaRupeeSign,
  FaEye,
  FaTimes
} from 'react-icons/fa';
import api from '../config/api';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const MatchesPage = () => {
  const [matches, setMatches] = useState([]);
  const [filteredMatches, setFilteredMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: 'all', // all, upcoming, completed, cancelled
    location: '',
    dateRange: 'all', // all, today, week, month
    maxPlayers: 'all'
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchMatches();
  }, []);

  useEffect(() => {
    filterMatches();
  }, [matches, searchTerm, filters]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchMatches = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/matches');
      
      if (response.data.success) {
        const matchesData = response.data.data?.matches || [];
        
        // Transform backend data to match frontend expectations
        const transformedMatches = matchesData.map(match => ({
          ...match,
          // Map venue fields to frontend structure
          location: match.venue?.name || 'Unknown Location',
          address: match.venue?.address || 'Unknown Address',
          // Calculate current players from players array
          currentPlayers: match.players?.filter(p => p.status === 'joined').length || 0,
          // Map status for frontend compatibility
          status: match.status === 'open' ? 'upcoming' : match.status,
          // Use matchId for routing
          _id: match.matchId
        }));
        
        setMatches(transformedMatches);
      } else {
        toast.error('Failed to load matches');
      }
    } catch (error) {
      console.error('Fetch matches error:', error);
      toast.error('Failed to load matches. Please try again later.');
      setMatches([]); // Set empty array instead of dummy data
    } finally {
      setLoading(false);
    }
  };

  const filterMatches = () => {
    let filtered = [...matches];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(match => 
        match.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        match.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        match.address.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(match => match.status === filters.status);
    }

    // Location filter
    if (filters.location) {
      filtered = filtered.filter(match => 
        match.location.toLowerCase().includes(filters.location.toLowerCase())
      );
    }

    // Date range filter
    if (filters.dateRange !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      filtered = filtered.filter(match => {
        const matchDate = new Date(match.dateTime);
        
        switch (filters.dateRange) {
          case 'today':
            return matchDate.toDateString() === today.toDateString();
          case 'week':
            const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
            return matchDate >= today && matchDate <= weekFromNow;
          case 'month':
            const monthFromNow = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate());
            return matchDate >= today && matchDate <= monthFromNow;
          default:
            return true;
        }
      });
    }

    // Max players filter
    if (filters.maxPlayers !== 'all') {
      filtered = filtered.filter(match => match.maxPlayers.toString() === filters.maxPlayers);
    }

    setFilteredMatches(filtered);
  };

  const formatDate = (dateTime) => {
    const date = new Date(dateTime);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatTime = (dateTime) => {
    const date = new Date(dateTime);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'upcoming':
        return 'text-grass-400 bg-grass-400/10';
      case 'completed':
        return 'text-blue-400 bg-blue-400/10';
      case 'cancelled':
        return 'text-red-400 bg-red-400/10';
      default:
        return 'text-gray-400 bg-gray-400/10';
    }
  };

  const clearFilters = () => {
    setFilters({
      status: 'all',
      location: '',
      dateRange: 'all',
      maxPlayers: 'all'
    });
    setSearchTerm('');
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
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">⚽ Football Matches</h1>
              <p className="text-white/70">Find and join football matches in your area</p>
            </div>
            <Link 
              to="/create-match"
              className="btn-primary mt-4 md:mt-0 inline-flex items-center space-x-2 hover:scale-105 transition-transform"
            >
              <FaPlus />
              <span>Create Match</span>
            </Link>
          </div>

          {/* Search and Filter Bar */}
          <div className="glass p-6 rounded-2xl border border-white/20">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/60" />
                <input
                  type="text"
                  placeholder="Search matches by title, location, or address..."
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
                {(filters.status !== 'all' || filters.location || filters.dateRange !== 'all' || filters.maxPlayers !== 'all') && (
                  <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">•</span>
                )}
              </button>
            </div>

            {/* Filters Panel */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/20"
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
                      <option value="all">All Matches</option>
                      <option value="upcoming">Upcoming</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">Location</label>
                    <input
                      type="text"
                      placeholder="Filter by location"
                      value={filters.location}
                      onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-grass-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">Date Range</label>
                    <select
                      value={filters.dateRange}
                      onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-grass-400"
                    >
                      <option value="all">All Dates</option>
                      <option value="today">Today</option>
                      <option value="week">This Week</option>
                      <option value="month">This Month</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">Team Size</label>
                    <select
                      value={filters.maxPlayers}
                      onChange={(e) => setFilters({ ...filters, maxPlayers: e.target.value })}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-grass-400"
                    >
                      <option value="all">All Sizes</option>
                      <option value="10">5v5 (10 players)</option>
                      <option value="14">7v7 (14 players)</option>
                      <option value="16">8v8 (16 players)</option>
                      <option value="22">11v11 (22 players)</option>
                    </select>
                  </div>

                  <div className="md:col-span-2 lg:col-span-4 flex justify-end">
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
          </div>
        </motion.div>

        {/* Match Results */}
        <motion.div
          className="mb-6 flex items-center justify-between"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <p className="text-white/70">
            {filteredMatches.length} match{filteredMatches.length !== 1 ? 'es' : ''} found
          </p>
        </motion.div>

        {/* Matches Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredMatches.map((match, index) => (
              <motion.div
                key={match._id}
                className="glass p-6 rounded-2xl border border-white/20 hover:border-grass-400/50 transition-all duration-300 group"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5 }}
              >
                {/* Match Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-1 group-hover:text-grass-400 transition-colors">
                      {match.title}
                    </h3>
                    <p className="text-white/60 text-sm">by {match.organizer?.name}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(match.status)}`}>
                    {match.status}
                  </span>
                </div>

                {/* Match Details */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-center text-white/70">
                    <FaMapMarkerAlt className="text-grass-400 mr-3 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-white">{match.location}</p>
                      <p className="text-sm">{match.address}</p>
                    </div>
                  </div>

                  <div className="flex items-center text-white/70">
                    <FaCalendarAlt className="text-grass-400 mr-3 flex-shrink-0" />
                    <span>{formatDate(match.dateTime)}</span>
                  </div>

                  <div className="flex items-center text-white/70">
                    <FaClock className="text-grass-400 mr-3 flex-shrink-0" />
                    <span>{formatTime(match.dateTime)}</span>
                  </div>

                  <div className="flex items-center text-white/70">
                    <FaUsers className="text-grass-400 mr-3 flex-shrink-0" />
                    <span>{match.currentPlayers || 0}/{match.maxPlayers} players</span>
                  </div>

                  {match.costPerPlayer > 0 && (
                    <div className="flex items-center text-white/70">
                      <FaRupeeSign className="text-grass-400 mr-3 flex-shrink-0" />
                      <span>₹{match.costPerPlayer} per player</span>
                    </div>
                  )}
                </div>

                {/* Match Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-white/20">
                  <div className="flex-1">
                    <div className="w-full bg-white/20 rounded-full h-2 mb-2">
                      <div 
                        className="bg-grass-400 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${((match.currentPlayers || 0) / match.maxPlayers) * 100}%` }}
                      />
                    </div>
                    <p className="text-xs text-white/60">
                      {match.maxPlayers - (match.currentPlayers || 0)} spots left
                    </p>
                  </div>
                  
                  <Link
                    to={`/match/${match._id}`}
                    className="ml-4 btn-primary text-sm px-4 py-2 flex items-center space-x-2 hover:scale-105 transition-transform"
                  >
                    <FaEye />
                    <span>View</span>
                  </Link>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Empty State */}
        {filteredMatches.length === 0 && (
          <motion.div
            className="text-center py-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <FaFutbol className="text-6xl text-white/30 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">No matches found</h3>
            <p className="text-white/60 mb-6">Try adjusting your search or filters, or create a new match!</p>
            <Link to="/create-match" className="btn-primary inline-flex items-center space-x-2">
              <FaPlus />
              <span>Create Your First Match</span>
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default MatchesPage;
