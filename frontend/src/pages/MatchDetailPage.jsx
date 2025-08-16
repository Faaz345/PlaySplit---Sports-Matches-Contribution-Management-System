import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { 
  FaFutbol, 
  FaMapMarkerAlt, 
  FaCalendarAlt,
  FaClock,
  FaUsers,
  FaRupeeSign,
  FaArrowLeft,
  FaUserPlus,
  FaUserMinus,
  FaCreditCard,
  FaShare,
  FaStar,
  FaPhone,
  FaEnvelope,
  FaEdit,
  FaTrash,
  FaCheckCircle,
  FaExclamationCircle,
  FaCopy
} from 'react-icons/fa';
import api from '../config/api';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const MatchDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joinLoading, setJoinLoading] = useState(false);
  const [isParticipant, setIsParticipant] = useState(false);
  const [showContactInfo, setShowContactInfo] = useState(false);

  useEffect(() => {
    fetchMatchDetails();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (match && currentUser) {
      setIsParticipant(match.participants?.some(p => p.userId === currentUser.uid));
    }
  }, [match, currentUser]);

  const fetchMatchDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/matches/${id}`);
      
      if (response.data.success) {
        const matchData = response.data.data?.match;
        // Transform the backend data structure to match frontend expectations
        if (matchData) {
          const transformedMatch = {
            ...matchData,
            // Map venue fields to frontend structure
            location: matchData.venue?.name || 'Unknown Location',
            address: matchData.venue?.address || 'Unknown Address',
            // Transform players array to participants for frontend compatibility
            participants: matchData.players?.map(player => ({
              userId: player.user?._id || player.user,
              name: player.user?.name || 'Anonymous Player',
              displayName: player.user?.name,
              joinedAt: player.joinedAt,
              paymentStatus: player.paymentStatus === 'paid' ? 'completed' : player.paymentStatus
            })) || [],
            // Update status mapping
            status: matchData.status === 'open' ? 'upcoming' : matchData.status,
            // Ensure required fields exist
            description: matchData.description || '',
            additionalNotes: matchData.additionalNotes || '',
            paymentRequired: matchData.costPerPlayer > 0
          };
          setMatch(transformedMatch);
        } else {
          toast.error('Match data not found');
          navigate('/matches');
        }
      } else {
        toast.error('Match not found');
        navigate('/matches');
      }
    } catch (error) {
      console.error('Fetch match details error:', error);
      if (error.response?.status === 404) {
        toast.error('Match not found');
      } else {
        toast.error('Failed to load match details. Please try again.');
      }
      navigate('/matches');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinMatch = async () => {
    if (!currentUser) {
      toast.error('Please login to join the match');
      navigate('/login');
      return;
    }

    try {
      setJoinLoading(true);
      const response = await api.post(`/api/matches/${id}/join`);
      
      if (response.data.success) {
        toast.success('Successfully joined the match!');
        fetchMatchDetails(); // Refresh match data
      } else {
        toast.error(response.data.message || 'Failed to join match');
      }
    } catch (error) {
      console.error('Join match error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to join match. Please try again.';
      toast.error(errorMessage);
    } finally {
      setJoinLoading(false);
    }
  };

  const handleLeaveMatch = async () => {
    try {
      setJoinLoading(true);
      const response = await api.post(`/api/matches/${id}/leave`);
      
      if (response.data.success) {
        toast.success('Left the match successfully');
        fetchMatchDetails(); // Refresh match data
      } else {
        toast.error(response.data.message || 'Failed to leave match');
      }
    } catch (error) {
      console.error('Leave match error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to leave match. Please try again.';
      toast.error(errorMessage);
    } finally {
      setJoinLoading(false);
    }
  };

  const copyMatchLink = async () => {
    const link = window.location.href;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(link);
        toast.success('Match link copied to clipboard!');
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = link;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        toast.success('Match link copied to clipboard!');
      }
    } catch (error) {
      console.error('Failed to copy link:', error);
      toast.error('Failed to copy link. Please copy the URL manually.');
    }
  };

  const shareMatch = () => {
    if (navigator.share) {
      navigator.share({
        title: match.title,
        text: `Join me for ${match.title} on ${formatDate(match.dateTime)}`,
        url: window.location.href
      });
    } else {
      copyMatchLink();
    }
  };

  const handleMakePayment = async () => {
    if (!currentUser) {
      toast.error('Please login to make payment');
      navigate('/login');
      return;
    }

    try {
      const paymentData = {
        matchId: id,
        amount: match.costPerPlayer,
        currency: 'INR',
        customerName: currentUser.displayName || 'Guest',
        customerEmail: currentUser.email,
        description: `Payment for ${match.title}`
      };

      const response = await api.post('/api/payments/create-payment-link', paymentData);
      
      if (response.data.success) {
        const paymentLink = response.data.data.paymentLink;
        // Open payment link in new tab
        window.open(paymentLink, '_blank');
        toast.success('Payment link opened in new tab');
      } else {
        toast.error('Failed to create payment link');
      }
    } catch (error) {
      console.error('Payment creation error:', error);
      // For demo purposes, show a mock payment URL
      const mockPaymentUrl = `https://checkout.razorpay.com/v1/checkout.html?payment_id=${Date.now()}`;
      window.open(mockPaymentUrl, '_blank');
      toast.success('Payment link opened in new tab');
    }
  };

  const formatDate = (dateTime) => {
    const date = new Date(dateTime);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric',
      month: 'long', 
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

  const getPaymentStatusColor = (status) => {
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

  const isMatchFull = match && match.participants.length >= match.maxPlayers;
  const spotsLeft = match ? match.maxPlayers - match.participants.length : 0;
  const isOrganizer = match && currentUser && match.organizer._id === currentUser.uid;
  const canJoin = match && currentUser && !isParticipant && !isMatchFull && match.status === 'upcoming';
  const canLeave = match && currentUser && isParticipant && match.status === 'upcoming';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <FaFutbol className="text-6xl text-white/30 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-white mb-2">Match not found</h3>
          <p className="text-white/60 mb-6">The match you're looking for doesn't exist.</p>
          <Link to="/matches" className="btn-primary inline-flex items-center space-x-2">
            <FaArrowLeft />
            <span>Back to Matches</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with Back Button */}
        <motion.div
          className="flex items-center mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <button
            onClick={() => navigate(-1)}
            className="glass p-3 rounded-xl border border-white/20 hover:border-grass-400/50 text-white hover:text-grass-400 transition-all mr-4"
          >
            <FaArrowLeft />
          </button>
          <div className="flex-1">
            <h1 className="text-4xl font-bold text-white mb-2">{match.title}</h1>
            <div className="flex items-center space-x-4">
              <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getStatusColor(match.status)}`}>
                {match.status}
              </span>
              <span className="text-white/60">by {match.organizer?.name || match.organizer?.displayName || 'Organizer'}</span>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={shareMatch}
              className="glass border border-white/20 hover:border-grass-400/50 text-white p-3 rounded-xl transition-all duration-300 hover:bg-grass-500/10"
              title="Share Match"
            >
              <FaShare />
            </button>
            {isOrganizer && (
              <>
                <Link
                  to={`/match/${id}/edit`}
                  className="glass border border-white/20 hover:border-blue-400/50 text-white p-3 rounded-xl transition-all duration-300 hover:bg-blue-500/10"
                  title="Edit Match"
                >
                  <FaEdit />
                </Link>
                <button
                  className="glass border border-white/20 hover:border-red-400/50 text-white p-3 rounded-xl transition-all duration-300 hover:bg-red-500/10"
                  title="Delete Match"
                >
                  <FaTrash />
                </button>
              </>
            )}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Match Details Card */}
            <motion.div
              className="glass p-6 rounded-2xl border border-white/20"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-4">
                  <div className="flex items-center text-white">
                    <FaMapMarkerAlt className="text-grass-400 mr-3 flex-shrink-0" />
                    <div>
                      <p className="font-medium">{match.location}</p>
                      <p className="text-white/70 text-sm">{match.address}</p>
                    </div>
                  </div>

                  <div className="flex items-center text-white">
                    <FaCalendarAlt className="text-grass-400 mr-3 flex-shrink-0" />
                    <div>
                      <p className="font-medium">{formatDate(match.dateTime)}</p>
                      <p className="text-white/70 text-sm">{formatTime(match.dateTime)}</p>
                    </div>
                  </div>

                  <div className="flex items-center text-white">
                    <FaClock className="text-grass-400 mr-3 flex-shrink-0" />
                    <span>{match.duration} minutes</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center text-white">
                    <FaUsers className="text-grass-400 mr-3 flex-shrink-0" />
                    <div>
                      <p className="font-medium">{match.participants.length}/{match.maxPlayers} players</p>
                      <div className="w-full bg-white/20 rounded-full h-2 mt-1">
                        <div 
                          className="bg-grass-400 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(match.participants.length / match.maxPlayers) * 100}%` }}
                        />
                      </div>
                      <p className="text-white/70 text-sm mt-1">{spotsLeft} spots left</p>
                    </div>
                  </div>

                  {match.costPerPlayer > 0 && (
                    <div className="flex items-center text-white">
                      <FaRupeeSign className="text-grass-400 mr-3 flex-shrink-0" />
                      <div>
                        <p className="font-medium">₹{match.costPerPlayer} per player</p>
                        <p className="text-white/70 text-sm">
                          {match.paymentRequired ? 'Payment required' : 'Pay at venue'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              {match.description && (
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-white mb-3">About this match</h3>
                  <p className="text-white/80 leading-relaxed">{match.description}</p>
                </div>
              )}

              {/* Additional Notes */}
              {match.additionalNotes && (
                <div>
                  <h3 className="text-xl font-bold text-white mb-3">Additional Information</h3>
                  <p className="text-white/80 leading-relaxed">{match.additionalNotes}</p>
                </div>
              )}
            </motion.div>

            {/* Participants List */}
            <motion.div
              className="glass p-6 rounded-2xl border border-white/20"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Players ({match.participants.length})</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {match.participants.map((participant, index) => {
                  const participantName = participant.name || participant.displayName || 'Anonymous Player';
                  const joinedDate = participant.joinedAt ? new Date(participant.joinedAt).toLocaleDateString() : 'Unknown';
                  
                  return (
                    <div key={index} className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-grass-600 rounded-full flex items-center justify-center text-white font-medium">
                          {participantName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-white font-medium">{participantName}</p>
                          <p className="text-white/60 text-sm">
                            Joined {joinedDate}
                          </p>
                        </div>
                      </div>
                      {match.costPerPlayer > 0 && (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(participant.paymentStatus)}`}>
                          {participant.paymentStatus === 'completed' ? <FaCheckCircle /> : 
                           participant.paymentStatus === 'pending' ? <FaClock /> : 
                           <FaExclamationCircle />}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Join/Leave Action Card */}
            <motion.div
              className="glass p-6 rounded-2xl border border-white/20"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              <div className="text-center mb-6">
                {isMatchFull ? (
                  <div className="text-center">
                    <FaUsers className="text-4xl text-red-400 mx-auto mb-3" />
                    <h3 className="text-lg font-bold text-red-400 mb-2">Match Full</h3>
                    <p className="text-white/70 text-sm">This match has reached maximum capacity</p>
                  </div>
                ) : match.status === 'upcoming' ? (
                  <div>
                    <FaFutbol className="text-4xl text-grass-400 mx-auto mb-3" />
                    <h3 className="text-lg font-bold text-white mb-2">Join the Match</h3>
                    <p className="text-white/70 text-sm">{spotsLeft} spots remaining</p>
                  </div>
                ) : (
                  <div>
                    <FaCheckCircle className="text-4xl text-blue-400 mx-auto mb-3" />
                    <h3 className="text-lg font-bold text-blue-400 mb-2">Match {match.status}</h3>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                {canJoin && (
                  <button
                    onClick={handleJoinMatch}
                    disabled={joinLoading}
                    className="w-full btn-primary flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {joinLoading ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <>
                        <FaUserPlus />
                        <span>Join Match</span>
                      </>
                    )}
                  </button>
                )}

                {canLeave && (
                  <button
                    onClick={handleLeaveMatch}
                    disabled={joinLoading}
                    className="w-full glass border border-red-400/50 text-red-400 px-4 py-3 rounded-xl transition-all duration-300 hover:bg-red-500/10 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {joinLoading ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <>
                        <FaUserMinus />
                        <span>Leave Match</span>
                      </>
                    )}
                  </button>
                )}

                {isParticipant && match.costPerPlayer > 0 && match.paymentRequired && (
                  <button 
                    onClick={handleMakePayment}
                    className="w-full glass border border-grass-400/50 text-grass-400 px-4 py-3 rounded-xl transition-all duration-300 hover:bg-grass-500/10 flex items-center justify-center space-x-2"
                  >
                    <FaCreditCard />
                    <span>Make Payment</span>
                  </button>
                )}

                <button
                  onClick={copyMatchLink}
                  className="w-full glass border border-white/20 hover:border-grass-400/50 text-white px-4 py-3 rounded-xl transition-all duration-300 hover:bg-grass-500/10 flex items-center justify-center space-x-2"
                >
                  <FaCopy />
                  <span>Copy Link</span>
                </button>
              </div>
            </motion.div>

            {/* Organizer Info Card */}
            <motion.div
              className="glass p-6 rounded-2xl border border-white/20"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
            >
              <h3 className="text-lg font-bold text-white mb-4">Organizer</h3>
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-grass-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {(match.organizer?.name || match.organizer?.displayName || 'Organizer').charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-white font-medium">{match.organizer?.name || match.organizer?.displayName || 'Organizer'}</p>
                  <div className="flex items-center space-x-2 text-white/70">
                    <FaStar className="text-yellow-400" />
                    <span className="text-sm">4.8 rating</span>
                  </div>
                </div>
              </div>

              {(isParticipant || isOrganizer) && (
                <div className="space-y-2">
                  {!showContactInfo ? (
                    <button
                      onClick={() => setShowContactInfo(true)}
                      className="w-full glass border border-white/20 hover:border-grass-400/50 text-white px-4 py-2 rounded-xl transition-all duration-300 hover:bg-grass-500/10"
                    >
                      Show Contact Info
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center space-x-3 text-white/80">
                        <FaPhone className="text-grass-400" />
                        <span className="text-sm">{match.organizer.phone}</span>
                      </div>
                      <div className="flex items-center space-x-3 text-white/80">
                        <FaEnvelope className="text-grass-400" />
                        <span className="text-sm">{match.organizer.email}</span>
                      </div>
                      <button
                        onClick={() => setShowContactInfo(false)}
                        className="text-white/60 text-sm hover:text-white transition-colors"
                      >
                        Hide contact info
                      </button>
                    </div>
                  )}
                </div>
              )}
            </motion.div>

            {/* Quick Stats Card */}
            <motion.div
              className="glass p-6 rounded-2xl border border-white/20"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7, duration: 0.6 }}
            >
              <h3 className="text-lg font-bold text-white mb-4">Match Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-white">
                  <span className="text-white/70">Created</span>
                  <span>{new Date(match.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between text-white">
                  <span className="text-white/70">Players Joined</span>
                  <span>{match.participants.length}</span>
                </div>
                {match.costPerPlayer > 0 && (
                  <>
                    <div className="flex justify-between text-white">
                      <span className="text-white/70">Total Cost</span>
                      <span>₹{match.costPerPlayer * match.participants.length}</span>
                    </div>
                    <div className="flex justify-between text-white">
                      <span className="text-white/70">Paid Players</span>
                      <span>{match.participants.filter(p => p.paymentStatus === 'completed').length}</span>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MatchDetailPage;
