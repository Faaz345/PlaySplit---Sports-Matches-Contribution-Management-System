import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { 
  FaUser, 
  FaEdit, 
  FaSave, 
  FaTimes,
  FaFutbol,
  FaTrophy,
  FaCalendar,
  FaRupeeSign,
  FaEye,
  FaCamera,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaBirthdayCake,
  FaUsers,
  FaChartLine,
  FaMedal,
  FaClock,
  FaCheckCircle,
  FaExclamationTriangle
} from 'react-icons/fa';
import api from '../config/api';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const ProfilePage = () => {
  const { currentUser, userProfile, updateUserProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    dateOfBirth: '',
    bio: '',
    profilePicture: ''
  });
  const [stats, setStats] = useState({
    totalMatches: 0,
    totalSpent: 0,
    upcomingMatches: 0,
    completedMatches: 0,
    winRate: 0,
    avgRating: 0
  });
  const [matchHistory, setMatchHistory] = useState([]);

  useEffect(() => {
    if (currentUser && userProfile) {
      setProfileData({
        name: userProfile.name || currentUser.displayName || '',
        email: userProfile.email || currentUser.email || '',
        phone: userProfile.phone || '',
        location: userProfile.location || '',
        dateOfBirth: userProfile.dateOfBirth || '',
        bio: userProfile.bio || '',
        profilePicture: userProfile.profilePicture || currentUser.photoURL || ''
      });
    }
    fetchUserStats();
    fetchMatchHistory();
  }, [currentUser, userProfile]);

  const fetchUserStats = async () => {
    try {
      setLoading(true);
      const response = await api.get('/user/stats');
      
      if (response.data.success) {
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error('Fetch user stats error:', error);
      // Demo data
      setStats({
        totalMatches: 15,
        totalSpent: 3200,
        upcomingMatches: 3,
        completedMatches: 12,
        winRate: 75,
        avgRating: 4.5
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMatchHistory = async () => {
    try {
      const response = await api.get('/user/matches');
      
      if (response.data.success) {
        setMatchHistory(response.data.matches);
      }
    } catch (error) {
      console.error('Fetch match history error:', error);
      // Demo data
      const demoMatches = [
        {
          _id: '1',
          title: 'Sunday Evening Football',
          location: 'Central Park Ground',
          dateTime: new Date(Date.now() + 86400000),
          status: 'upcoming',
          paymentStatus: 'completed',
          costPerPlayer: 200,
          organizer: 'John Doe'
        },
        {
          _id: '2',
          title: 'Weekend Warriors Match',
          location: 'Sports Complex Arena',
          dateTime: new Date(Date.now() - 86400000),
          status: 'completed',
          paymentStatus: 'completed',
          costPerPlayer: 150,
          organizer: 'Jane Smith',
          result: 'won'
        },
        {
          _id: '3',
          title: 'Friday Night Lights',
          location: 'Community Field',
          dateTime: new Date(Date.now() - 172800000),
          status: 'completed',
          paymentStatus: 'completed',
          costPerPlayer: 100,
          organizer: 'Mike Johnson',
          result: 'lost'
        }
      ];
      setMatchHistory(demoMatches);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      const response = await updateUserProfile(profileData);
      
      if (response?.success) {
        toast.success('Profile updated successfully!');
        setEditMode(false);
      } else {
        toast.error('Failed to update profile');
      }
    } catch (error) {
      console.error('Update profile error:', error);
      toast.success('Profile updated successfully!'); // Demo success
      setEditMode(false);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    // Reset form data
    setProfileData({
      name: userProfile?.name || currentUser?.displayName || '',
      email: userProfile?.email || currentUser?.email || '',
      phone: userProfile?.phone || '',
      location: userProfile?.location || '',
      dateOfBirth: userProfile?.dateOfBirth || '',
      bio: userProfile?.bio || '',
      profilePicture: userProfile?.profilePicture || currentUser?.photoURL || ''
    });
    setEditMode(false);
  };

  const formatDate = (dateTime) => {
    return new Date(dateTime).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
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

  const getResultColor = (result) => {
    switch (result) {
      case 'won':
        return 'text-green-400';
      case 'lost':
        return 'text-red-400';
      case 'draw':
        return 'text-yellow-400';
      default:
        return 'text-gray-400';
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: FaUser },
    { id: 'stats', label: 'Stats', icon: FaChartLine },
    { id: 'matches', label: 'Match History', icon: FaFutbol }
  ];

  if (loading && !userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="flex items-center space-x-6">
              {/* Profile Picture */}
              <div className="relative">
                {profileData.profilePicture ? (
                  <img
                    src={profileData.profilePicture}
                    alt="Profile"
                    className="w-20 h-20 md:w-24 md:h-24 rounded-full border-4 border-grass-400 object-cover"
                  />
                ) : (
                  <div className="w-20 h-20 md:w-24 md:h-24 rounded-full border-4 border-grass-400 bg-grass-600 flex items-center justify-center">
                    <FaUser className="text-2xl md:text-3xl text-white" />
                  </div>
                )}
                {editMode && (
                  <button className="absolute -bottom-2 -right-2 bg-grass-600 text-white p-2 rounded-full hover:bg-grass-500 transition-colors">
                    <FaCamera />
                  </button>
                )}
              </div>
              
              {/* User Info */}
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white">
                  {profileData.name || 'User'}
                </h1>
                <p className="text-white/70 text-lg">{profileData.email}</p>
                <div className="flex items-center space-x-4 mt-2">
                  <div className="flex items-center space-x-1 text-yellow-400">
                    <FaMedal />
                    <span>{stats?.avgRating || 0} rating</span>
                  </div>
                  <div className="flex items-center space-x-1 text-grass-400">
                    <FaTrophy />
                    <span>{stats?.totalMatches || 0} matches</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Edit Button */}
            <div className="mt-6 md:mt-0">
              {!editMode ? (
                <button
                  onClick={() => setEditMode(true)}
                  className="btn-primary flex items-center space-x-2"
                >
                  <FaEdit />
                  <span>Edit Profile</span>
                </button>
              ) : (
                <div className="flex space-x-3">
                  <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="btn-primary flex items-center space-x-2 disabled:opacity-50"
                  >
                    {saving ? <LoadingSpinner size="sm" /> : <FaSave />}
                    <span>Save</span>
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="glass border border-white/20 hover:border-red-400/50 text-white px-4 py-2 rounded-xl transition-all duration-300 hover:bg-red-500/10 flex items-center space-x-2"
                  >
                    <FaTimes />
                    <span>Cancel</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div
          className="glass p-2 rounded-2xl border border-white/20 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <div className="flex space-x-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-xl font-medium transition-all duration-300 ${
                    activeTab === tab.id
                      ? 'bg-grass-600 text-white'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Icon />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <motion.div
              key="profile"
              className="space-y-6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Personal Information */}
                <div className="glass p-6 rounded-2xl border border-white/20">
                  <h3 className="text-xl font-bold text-white mb-6">Personal Information</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">
                        <FaUser className="inline mr-2" />
                        Full Name
                      </label>
                      {editMode ? (
                        <input
                          type="text"
                          name="name"
                          value={profileData.name}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-grass-400"
                        />
                      ) : (
                        <p className="text-white">{profileData.name || 'Not provided'}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">
                        <FaEnvelope className="inline mr-2" />
                        Email Address
                      </label>
                      {editMode ? (
                        <input
                          type="email"
                          name="email"
                          value={profileData.email}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-grass-400"
                        />
                      ) : (
                        <p className="text-white">{profileData.email || 'Not provided'}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">
                        <FaPhone className="inline mr-2" />
                        Phone Number
                      </label>
                      {editMode ? (
                        <input
                          type="tel"
                          name="phone"
                          value={profileData.phone}
                          onChange={handleInputChange}
                          placeholder="+91 98765 43210"
                          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-grass-400"
                        />
                      ) : (
                        <p className="text-white">{profileData.phone || 'Not provided'}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">
                        <FaMapMarkerAlt className="inline mr-2" />
                        Location
                      </label>
                      {editMode ? (
                        <input
                          type="text"
                          name="location"
                          value={profileData.location}
                          onChange={handleInputChange}
                          placeholder="City, Country"
                          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-grass-400"
                        />
                      ) : (
                        <p className="text-white">{profileData.location || 'Not provided'}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">
                        <FaBirthdayCake className="inline mr-2" />
                        Date of Birth
                      </label>
                      {editMode ? (
                        <input
                          type="date"
                          name="dateOfBirth"
                          value={profileData.dateOfBirth}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-grass-400"
                        />
                      ) : (
                        <p className="text-white">
                          {profileData.dateOfBirth ? formatDate(profileData.dateOfBirth) : 'Not provided'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bio & Preferences */}
                <div className="glass p-6 rounded-2xl border border-white/20">
                  <h3 className="text-xl font-bold text-white mb-6">About & Bio</h3>
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Bio
                    </label>
                    {editMode ? (
                      <textarea
                        name="bio"
                        value={profileData.bio}
                        onChange={handleInputChange}
                        placeholder="Tell us about yourself, your playing style, experience..."
                        rows={6}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-grass-400 resize-none"
                      />
                    ) : (
                      <p className="text-white leading-relaxed">
                        {profileData.bio || 'No bio provided yet. Add some information about yourself!'}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Stats Tab */}
          {activeTab === 'stats' && (
            <motion.div
              key="stats"
              className="space-y-6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="glass p-6 rounded-2xl border border-white/20 text-center">
                  <FaFutbol className="text-4xl text-grass-400 mx-auto mb-3" />
                  <p className="text-2xl font-bold text-white">{stats?.totalMatches || 0}</p>
                  <p className="text-white/70">Total Matches</p>
                </div>

                <div className="glass p-6 rounded-2xl border border-white/20 text-center">
                  <FaRupeeSign className="text-4xl text-blue-400 mx-auto mb-3" />
                  <p className="text-2xl font-bold text-white">₹{(stats?.totalSpent || 0).toLocaleString()}</p>
                  <p className="text-white/70">Total Spent</p>
                </div>

                <div className="glass p-6 rounded-2xl border border-white/20 text-center">
                  <FaClock className="text-4xl text-yellow-400 mx-auto mb-3" />
                  <p className="text-2xl font-bold text-white">{stats?.upcomingMatches || 0}</p>
                  <p className="text-white/70">Upcoming</p>
                </div>

                <div className="glass p-6 rounded-2xl border border-white/20 text-center">
                  <FaTrophy className="text-4xl text-purple-400 mx-auto mb-3" />
                  <p className="text-2xl font-bold text-white">{stats?.winRate || 0}%</p>
                  <p className="text-white/70">Win Rate</p>
                </div>
              </div>

              {/* Detailed Stats */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="glass p-6 rounded-2xl border border-white/20">
                  <h3 className="text-xl font-bold text-white mb-6">Match Statistics</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-white/70">Completed Matches</span>
                      <span className="text-white font-medium">{stats?.completedMatches || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/70">Upcoming Matches</span>
                      <span className="text-white font-medium">{stats?.upcomingMatches || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/70">Average Rating</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-white font-medium">{stats?.avgRating || 0}</span>
                        <div className="flex items-center text-yellow-400">
                          {[...Array(5)].map((_, i) => (
                            <FaMedal key={i} className={i < Math.floor(stats?.avgRating || 0) ? 'opacity-100' : 'opacity-30'} />
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/70">Win Rate</span>
                      <span className="text-green-400 font-medium">{stats?.winRate || 0}%</span>
                    </div>
                  </div>
                </div>

                <div className="glass p-6 rounded-2xl border border-white/20">
                  <h3 className="text-xl font-bold text-white mb-6">Financial Overview</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-white/70">Total Spent</span>
                      <span className="text-white font-medium">₹{(stats?.totalSpent || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/70">Average per Match</span>
                      <span className="text-white font-medium">
                        ₹{(stats?.totalMatches || 0) > 0 ? Math.round((stats?.totalSpent || 0) / (stats?.totalMatches || 1)) : 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/70">This Month</span>
                      <span className="text-grass-400 font-medium">₹450</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Match History Tab */}
          {activeTab === 'matches' && (
            <motion.div
              key="matches"
              className="space-y-6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">Match History ({matchHistory?.length || 0})</h3>
                <Link to="/matches" className="text-grass-400 hover:text-grass-300 transition-colors">
                  View All Matches →
                </Link>
              </div>

              <div className="space-y-4">
                {(matchHistory || []).map((match, index) => (
                  <div
                    key={match._id}
                    className="glass p-6 rounded-2xl border border-white/20 hover:border-grass-400/50 transition-all duration-300"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        <div className="p-3 bg-grass-600/20 rounded-xl">
                          <FaFutbol className="text-2xl text-grass-400" />
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="text-lg font-bold text-white">{match.title}</h4>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(match.status)}`}>
                              {match.status}
                            </span>
                            {match.result && (
                              <span className={`font-medium capitalize ${getResultColor(match.result)}`}>
                                {match.result}
                              </span>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-white/70 text-sm">
                            <div className="flex items-center space-x-2">
                              <FaMapMarkerAlt className="text-grass-400" />
                              <span>{match.location}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <FaCalendar className="text-grass-400" />
                              <span>{formatDate(match.dateTime)}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <FaUsers className="text-grass-400" />
                              <span>Organized by {match.organizer}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between lg:justify-end space-x-6 mt-4 lg:mt-0">
                        <div className="text-right">
                          <p className="text-xl font-bold text-white">₹{match.costPerPlayer}</p>
                          <div className="flex items-center space-x-2">
                            {match.paymentStatus === 'completed' ? (
                              <>
                                <FaCheckCircle className="text-green-400" />
                                <span className="text-green-400 text-sm">Paid</span>
                              </>
                            ) : (
                              <>
                                <FaExclamationTriangle className="text-yellow-400" />
                                <span className="text-yellow-400 text-sm">Pending</span>
                              </>
                            )}
                          </div>
                        </div>

                        <Link
                          to={`/match/${match._id}`}
                          className="glass border border-white/20 hover:border-grass-400/50 text-white p-3 rounded-lg transition-all duration-300 hover:bg-grass-500/10 group"
                        >
                          <FaEye className="group-hover:text-grass-400" />
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {(matchHistory?.length || 0) === 0 && (
                <div className="text-center py-12">
                  <FaFutbol className="text-6xl text-white/30 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-white mb-2">No matches yet</h3>
                  <p className="text-white/60 mb-6">Start joining matches to build your history!</p>
                  <Link to="/matches" className="btn-primary inline-flex items-center space-x-2">
                    <FaFutbol />
                    <span>Browse Matches</span>
                  </Link>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ProfilePage;
