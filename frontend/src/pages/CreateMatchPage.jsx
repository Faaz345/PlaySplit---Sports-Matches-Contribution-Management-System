import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { 
  FaFutbol, 
  FaMapMarkerAlt, 
  FaCalendarAlt, 
  FaClock, 
  FaUsers, 
  FaRupeeSign,
  FaSave,
  FaArrowLeft,
  FaBolt,
  FaToggleOn,
  FaToggleOff
} from 'react-icons/fa';
import api from '../config/api';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const CreateMatchPage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isQuickMatch, setIsQuickMatch] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    address: '',
    date: '',
    time: '',
    duration: '90',
    maxPlayers: '22',
    costPerPlayer: '',
    paymentRequired: true,
    additionalNotes: ''
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let matchData;
      
      if (isQuickMatch) {
        // Quick Match mode - minimal data required
        matchData = {
          isQuickMatch: true,
          maxPlayers: parseInt(formData.maxPlayers),
          duration: parseInt(formData.duration)
        };
        
        // Include optional fields only if they have values
        if (formData.title.trim()) matchData.title = formData.title;
        if (formData.description.trim()) matchData.description = formData.description;
        if (formData.location.trim() || formData.address.trim()) {
          matchData.venue = {
            name: formData.location || 'TBD',
            address: formData.address || 'TBD'
          };
        }
        if (formData.date && formData.time) {
          matchData.dateTime = new Date(`${formData.date}T${formData.time}`);
        }
        if (formData.costPerPlayer) {
          matchData.costPerPlayer = parseFloat(formData.costPerPlayer);
          matchData.totalCost = parseFloat(formData.costPerPlayer) * parseInt(formData.maxPlayers);
        }
        if (formData.additionalNotes.trim()) matchData.additionalNotes = formData.additionalNotes;
      } else {
        // Regular mode - all data required
        const matchDateTime = new Date(`${formData.date}T${formData.time}`);
        
        matchData = {
          title: formData.title,
          description: formData.description,
          venue: {
            name: formData.location,
            address: formData.address
          },
          dateTime: matchDateTime,
          maxPlayers: parseInt(formData.maxPlayers),
          costPerPlayer: parseFloat(formData.costPerPlayer) || 0,
          totalCost: (parseFloat(formData.costPerPlayer) || 0) * parseInt(formData.maxPlayers),
          duration: parseInt(formData.duration),
          paymentRequired: formData.paymentRequired,
          additionalNotes: formData.additionalNotes
        };
      }
      
      // Set turfType based on maxPlayers for both modes
      if (parseInt(formData.maxPlayers) <= 10) {
        matchData.turfType = '5v5';
      } else if (parseInt(formData.maxPlayers) <= 14) {
        matchData.turfType = '7v7';
      } else {
        matchData.turfType = 'full';
      }

      const response = await api.post('/api/matches', matchData);
      
      if (response.data.success) {
        toast.success(isQuickMatch ? 'Quick match created successfully!' : 'Match created successfully!');
        navigate(`/match/${response.data.data.match.matchId}`);
      } else {
        toast.error('Failed to create match');
      }
    } catch (error) {
      console.error('Create match error:', error);
      toast.error(error.response?.data?.message || 'Failed to create match');
    } finally {
      setIsLoading(false);
    }
  };

  // Get today's date for min date validation
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center mb-6">
            <button
              onClick={() => navigate(-1)}
              className="glass p-3 rounded-xl border border-white/20 hover:border-grass-400/50 text-white hover:text-grass-400 transition-all mr-4"
            >
              <FaArrowLeft />
            </button>
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                Create New Match ⚽
              </h1>
              <p className="text-white/70">
                Set up a new football match and invite players to join
              </p>
            </div>
          </div>
        </motion.div>

        {/* Quick Match Toggle */}
        <motion.div
          className="mb-6 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.6 }}
        >
          <div className="glass p-4 rounded-xl border border-white/20 flex items-center space-x-3">
            <FaBolt className={`text-lg ${isQuickMatch ? 'text-yellow-400' : 'text-white/50'}`} />
            <span className="text-white font-medium">Quick Match Mode</span>
            <button
              type="button"
              onClick={() => setIsQuickMatch(!isQuickMatch)}
              className="text-2xl transition-colors duration-300"
            >
              {isQuickMatch ? (
                <FaToggleOn className="text-grass-400" />
              ) : (
                <FaToggleOff className="text-white/50" />
              )}
            </button>
            <div className="text-xs text-white/60 max-w-xs">
              {isQuickMatch ? 'Create with minimal details' : 'Fill in all match details'}
            </div>
          </div>
        </motion.div>

        {/* Create Match Form */}
        <motion.form
          onSubmit={handleSubmit}
          className="glass p-8 rounded-2xl border border-white/20 space-y-6"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          {/* Match Title */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                <FaFutbol className="inline mr-2" />
                Match Title {!isQuickMatch && '*'}
                {isQuickMatch && <span className="text-white/60 text-xs ml-1">(optional)</span>}
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder={isQuickMatch ? "Leave blank for auto-generated title" : "e.g., Sunday Evening Football"}
                required={!isQuickMatch}
                className={`w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-grass-400 focus:border-transparent transition-all duration-300 ${isQuickMatch ? 'opacity-75' : ''}`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                <FaUsers className="inline mr-2" />
                Max Players *
              </label>
              <select
                name="maxPlayers"
                value={formData.maxPlayers}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-grass-400 focus:border-transparent transition-all duration-300"
              >
                <option value="10">10 Players (5v5)</option>
                <option value="14">14 Players (7v7)</option>
                <option value="22">22 Players (11v11)</option>
                <option value="16">16 Players (8v8)</option>
                <option value="18">18 Players (9v9)</option>
              </select>
            </div>
          </div>

          {/* Location Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                <FaMapMarkerAlt className="inline mr-2" />
                Venue Name {!isQuickMatch && '*'}
                {isQuickMatch && <span className="text-white/60 text-xs ml-1">(optional)</span>}
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                placeholder={isQuickMatch ? "Leave blank if not decided" : "e.g., Central Park Football Ground"}
                required={!isQuickMatch}
                className={`w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-grass-400 focus:border-transparent transition-all duration-300 ${isQuickMatch ? 'opacity-75' : ''}`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Address {!isQuickMatch && '*'}
                {isQuickMatch && <span className="text-white/60 text-xs ml-1">(optional)</span>}
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder={isQuickMatch ? "Leave blank if not decided" : "Full address with landmarks"}
                required={!isQuickMatch}
                className={`w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-grass-400 focus:border-transparent transition-all duration-300 ${isQuickMatch ? 'opacity-75' : ''}`}
              />
            </div>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                <FaCalendarAlt className="inline mr-2" />
                Match Date {!isQuickMatch && '*'}
                {isQuickMatch && <span className="text-white/60 text-xs ml-1">(optional)</span>}
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                min={today}
                required={!isQuickMatch}
                className={`w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-grass-400 focus:border-transparent transition-all duration-300 ${isQuickMatch ? 'opacity-75' : ''}`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                <FaClock className="inline mr-2" />
                Start Time {!isQuickMatch && '*'}
                {isQuickMatch && <span className="text-white/60 text-xs ml-1">(optional)</span>}
              </label>
              <input
                type="time"
                name="time"
                value={formData.time}
                onChange={handleInputChange}
                required={!isQuickMatch}
                className={`w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-grass-400 focus:border-transparent transition-all duration-300 ${isQuickMatch ? 'opacity-75' : ''}`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Duration (minutes)
              </label>
              <select
                name="duration"
                value={formData.duration}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-grass-400 focus:border-transparent transition-all duration-300"
              >
                <option value="60">60 minutes</option>
                <option value="90">90 minutes</option>
                <option value="120">120 minutes</option>
              </select>
            </div>
          </div>

          {/* Payment Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                <FaRupeeSign className="inline mr-2" />
                Cost per Player (₹)
              </label>
              <input
                type="number"
                name="costPerPlayer"
                value={formData.costPerPlayer}
                onChange={handleInputChange}
                placeholder="e.g., 200"
                min="0"
                step="10"
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-grass-400 focus:border-transparent transition-all duration-300"
              />
            </div>

            <div className="flex items-center space-x-3 pt-8">
              <input
                type="checkbox"
                id="paymentRequired"
                name="paymentRequired"
                checked={formData.paymentRequired}
                onChange={handleInputChange}
                className="w-5 h-5 bg-white/10 border border-white/20 rounded focus:ring-2 focus:ring-grass-400"
              />
              <label htmlFor="paymentRequired" className="text-white/80">
                Require payment before joining
              </label>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Match Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Describe the match, skill level, rules, etc..."
              rows={4}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-grass-400 focus:border-transparent transition-all duration-300 resize-none"
            />
          </div>

          {/* Additional Notes */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Additional Notes
            </label>
            <textarea
              name="additionalNotes"
              value={formData.additionalNotes}
              onChange={handleInputChange}
              placeholder="Equipment needed, parking info, contact details, etc..."
              rows={3}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-grass-400 focus:border-transparent transition-all duration-300 resize-none"
            />
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-end space-x-4 pt-6">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="glass border border-white/20 hover:border-red-400/50 text-white px-6 py-3 rounded-xl transition-all duration-300 hover:bg-red-500/10"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary px-8 py-3 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isLoading ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <FaSave />
                  <span>{isQuickMatch ? 'Create Quick Match' : 'Create Match'}</span>
                </>
              )}
            </button>
          </div>
        </motion.form>

        {/* Quick Match Info Panel */}
        {isQuickMatch && (
          <motion.div
            className="mt-6 glass p-4 rounded-2xl border border-yellow-400/30 bg-yellow-400/5"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center mb-2">
              <FaBolt className="text-yellow-400 mr-2" />
              <h4 className="text-white font-semibold">Quick Match Mode</h4>
            </div>
            <p className="text-white/80 text-sm">
              Your match will be created with minimal details. You can edit and complete the match information later from the match detail page. 
              Missing details like venue, date/time will show as "TBD" until updated.
            </p>
          </motion.div>
        )}

        {/* Tips Section */}
        <motion.div
          className="mt-8 glass p-6 rounded-2xl border border-white/20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          <h3 className="text-xl font-bold text-white mb-4">💡 Tips for Creating a Great Match</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-white/70">
            <div>
              • Be specific about the venue and provide clear directions
              • Set a reasonable cost that covers field rental and equipment
              • Include skill level expectations in the description
            </div>
            <div>
              • Plan for extra players in case of dropouts
              • Consider weather conditions and have backup plans
              • Share contact info for last-minute coordination
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default CreateMatchPage;
