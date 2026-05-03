import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserCheck, UserX, Users, MapPin, LogOut, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { networkRequests as initialRequests } from '../data/mockData';
import Avatar from '../components/UI/Avatar';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';

function RequestCard({ request, onAccept, onDecline }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -60, scale: 0.92 }}
      transition={{ type: 'spring', damping: 22, stiffness: 280 }}
      className="bg-white dark:bg-zinc-900 rounded-3xl p-5 border border-orange-50/80 dark:border-zinc-800 shadow-sm"
    >
      <div className="flex items-center gap-4 mb-4">
        <div className="relative">
          <div className={`w-14 h-14 rounded-full overflow-hidden ring-2 ring-orange-100`}>
            <img
              src={request.avatar}
              alt={request.name}
              className="w-full h-full object-cover"
              onError={e => { e.currentTarget.style.display = 'none'; }}
            />
            <div className={`absolute inset-0 bg-gradient-to-br ${request.gradient} flex items-center justify-center text-white font-bold text-lg rounded-full`} style={{ zIndex: -1 }}>
              {request.name[0]}
            </div>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-900 dark:text-white text-sm">{request.name}</p>
          <p className="text-xs text-gray-400 dark:text-zinc-500">{request.username}</p>
          <div className="flex items-center gap-3 mt-1">
            <span className="flex items-center gap-1 text-xs text-orange-500 font-medium">
              <Users className="w-3 h-3" />
              {request.mutual} mutual
            </span>
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <MapPin className="w-3 h-3" />
              {request.location}
            </span>
          </div>
        </div>
      </div>
      {/* Buttons */}
      <div className="flex gap-3">
        <motion.button
          whileTap={{ scale: 0.92 }}
          whileHover={{ scale: 1.02 }}
          onClick={() => onAccept(request.id)}
          className="flex-1 gradient-orange text-white flex items-center justify-center gap-2 py-2.5 rounded-2xl text-sm font-semibold shadow-md shadow-orange-400/25"
        >
          <UserCheck className="w-4 h-4" />
          Accept
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.92 }}
          whileHover={{ scale: 1.02 }}
          onClick={() => onDecline(request.id)}
          className="flex-1 bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300 flex items-center justify-center gap-2 py-2.5 rounded-2xl text-sm font-semibold border border-gray-200 dark:border-zinc-700"
        >
          <UserX className="w-4 h-4" />
          Decline
        </motion.button>
      </div>
    </motion.div>
  );
}

function ConnectionCard({ user }) {
  const navigate = useNavigate();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.88 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-green-100 dark:border-zinc-800 shadow-sm flex items-center justify-between gap-3"
    >
      <div className="flex items-center gap-3 min-w-0">
        <img src={user.avatar} alt={user.name} className="w-11 h-11 rounded-full object-cover" />
        <div className="min-w-0">
          <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{user.name}</p>
          <p className="text-xs text-gray-400 truncate">{user.username}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-green-500 font-semibold bg-green-50 dark:bg-green-950/40 px-2 py-0.5 rounded-full border border-green-100 dark:border-green-800">
          ✓ Connected
        </span>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate('/chat', { state: { receiverId: user.id, receiverName: user.name, receiverAvatar: user.avatar, isOnline: true } })}
          className="w-8 h-8 rounded-full gradient-orange flex items-center justify-center shadow-sm shadow-orange-400/30"
          title="Message"
        >
          <MessageCircle className="w-4 h-4 text-white" />
        </motion.button>
      </div>
    </motion.div>
  );
}

export default function Network() {
  const { logout } = useAuth();
  const [requests, setRequests] = useState([]);
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNetwork();
  }, []);

  const fetchNetwork = async () => {
    try {
      const res = await api.get('/users/network');
      if (res.data.requests.length === 0 && res.data.connections.length === 0) {
        setRequests(initialRequests);
      } else {
        setRequests(res.data.requests);
        setConnections(res.data.connections);
      }
    } catch (err) {
      console.error('Failed to load network, using fallback', err);
      setRequests(initialRequests);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (id) => {
    const req = requests.find(r => r.id === id);
    if (!req) return;
    
    // Optimistic update
    setRequests(prev => prev.filter(r => r.id !== id));
    setConnections(prev => [req, ...prev]);

    try {
      await api.post(`/users/follow/${id}`, { action: 'accept' });
    } catch {
      // Revert
      setRequests(prev => [req, ...prev]);
      setConnections(prev => prev.filter(c => c.id !== id));
    }
  };

  const handleDecline = async (id) => {
    const req = requests.find(r => r.id === id);
    if (!req) return;

    // Optimistic update
    setRequests(prev => prev.filter(r => r.id !== id));

    try {
      await api.post(`/users/follow/${id}`, { action: 'decline' });
    } catch {
      // Revert
      setRequests(prev => [req, ...prev]);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#FFF8F3]/90 dark:bg-zinc-950/90 backdrop-blur-xl px-5 pt-5 pb-4 border-b border-orange-100/50 dark:border-zinc-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Network</h1>
            {requests.length > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="gradient-orange text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm shadow-orange-400/25"
              >
                {requests.length} New
              </motion.span>
            )}
          </div>
          <motion.button whileTap={{ scale: 0.88 }} onClick={logout} title="Sign out"
            className="w-9 h-9 rounded-xl bg-white dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 flex items-center justify-center shadow-sm">
            <LogOut className="w-4 h-4 text-gray-500 dark:text-zinc-400" />
          </motion.button>
        </div>
        <p className="text-sm text-gray-400 dark:text-zinc-500 mt-1">Pending Requests</p>
      </header>

      <main className="flex-1 overflow-y-auto scrollbar-hide px-4 pb-28 pt-4 space-y-6">
        {/* Pending requests */}
        <section>
          <AnimatePresence>
            {!loading && requests.length === 0 && connections.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16"
              >
                <p className="text-4xl mb-3">🤝</p>
                <p className="text-gray-400 dark:text-zinc-500 text-sm">No pending requests</p>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div layout className="space-y-4">
            <AnimatePresence>
              {requests.map((req) => (
                <RequestCard
                  key={req.id}
                  request={req}
                  onAccept={handleAccept}
                  onDecline={handleDecline}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        </section>

        {/* Connections */}
        <AnimatePresence>
          {connections.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h2 className="text-base font-bold text-gray-700 dark:text-zinc-300 mb-3">Your Connections</h2>
              <motion.div layout className="space-y-3">
                <AnimatePresence>
                  {connections.map(user => (
                    <ConnectionCard key={user.id} user={user} />
                  ))}
                </AnimatePresence>
              </motion.div>
            </motion.section>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
