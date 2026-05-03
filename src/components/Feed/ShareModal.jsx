import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Share2, Check, Search, Loader } from 'lucide-react';
import Avatar from '../UI/Avatar';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';

// Static list of people you can share with (comes from network + mock)
const sharePeople = [
  { id: 'mock-cassie', name: 'Cassie Vong', username: '@cassie.v', avatarUrl: 'https://images.unsplash.com/photo-1526510747491-58f928ec870f?w=100&h=100&fit=crop&crop=faces' },
  { id: 'mock-leo', name: 'Leo Dubois', username: '@leo.dubois', avatarUrl: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=100&h=100&fit=crop&crop=faces' },
  { id: 'mock-yuna', name: 'Yuna Park', username: '@yuna.creates', avatarUrl: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=100&h=100&fit=crop&crop=faces' },
  { id: 'mock-aria', name: 'Aria Solène', username: '@aria.solene', avatarUrl: 'https://images.unsplash.com/photo-1494790108755-2616b9e91ea9?w=100&h=100&fit=crop&crop=faces' },
  { id: 'mock-luna', name: 'Luna Espinosa', username: '@luna.edit', avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=faces' },
];

export default function ShareModal({ isOpen, onClose, postId, caption }) {
  const { user } = useAuth();
  const [selected, setSelected] = useState([]);
  const [message, setMessage] = useState('');
  const [searchQ, setSearchQ] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const filtered = sharePeople.filter(p =>
    !searchQ || p.name.toLowerCase().includes(searchQ.toLowerCase())
  );

  const toggleSelect = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };

  const handleShare = async () => {
    if (selected.length === 0) return;
    setSending(true);
    try {
      const names = selected.map(id => sharePeople.find(p => p.id === id)?.name || id);
      await Promise.all(
        names.map(toName =>
          api.post('/posts/share', { postId, toName, message }).catch(() => {})
        )
      );
      setSent(true);
      setTimeout(() => {
        setSent(false);
        setSelected([]);
        setMessage('');
        setSearchQ('');
        onClose();
      }, 1500);
    } finally {
      setSending(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-50 bg-white dark:bg-zinc-900 rounded-t-3xl shadow-2xl"
            style={{ maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-gray-200 dark:bg-zinc-700 rounded-full" />
            </div>

            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <Share2 className="w-4 h-4 text-orange-500" />
                <h3 className="font-bold text-gray-900 dark:text-white text-sm">Share Post</h3>
              </div>
              <motion.button whileTap={{ scale: 0.88 }} onClick={onClose}>
                <X className="w-5 h-5 text-gray-400" />
              </motion.button>
            </div>

            {/* Post preview */}
            {caption && (
              <div className="mx-5 mt-3 p-3 bg-orange-50 dark:bg-zinc-800 rounded-2xl">
                <p className="text-xs text-gray-500 dark:text-zinc-400 line-clamp-2">{caption}</p>
              </div>
            )}

            {/* Search */}
            <div className="px-5 pt-3">
              <div className="flex items-center gap-2 bg-gray-50 dark:bg-zinc-800 rounded-2xl px-3 py-2.5 border border-gray-100 dark:border-zinc-700">
                <Search className="w-4 h-4 text-gray-400 shrink-0" />
                <input
                  type="text"
                  value={searchQ}
                  onChange={e => setSearchQ(e.target.value)}
                  placeholder="Search people..."
                  className="flex-1 bg-transparent text-sm text-gray-700 dark:text-zinc-300 placeholder-gray-400 outline-none"
                />
              </div>
            </div>

            {/* People list */}
            <div className="flex-1 overflow-y-auto scrollbar-hide px-5 py-3 space-y-1">
              {filtered.map(person => {
                const isSelected = selected.includes(person.id);
                return (
                  <motion.button
                    key={person.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => toggleSelect(person.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-colors ${isSelected ? 'bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800' : 'hover:bg-gray-50 dark:hover:bg-zinc-800'}`}
                  >
                    <Avatar src={person.avatarUrl} name={person.name} size="sm" />
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{person.name}</p>
                      <p className="text-xs text-gray-400">{person.username}</p>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'gradient-orange border-orange-400' : 'border-gray-300 dark:border-zinc-600'}`}>
                      {isSelected && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* Message + Send */}
            <div className="px-5 pb-5 pt-2 border-t border-gray-100 dark:border-zinc-800 space-y-3">
              <input
                type="text"
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Add a message... (optional)"
                className="w-full bg-gray-50 dark:bg-zinc-800 rounded-2xl px-4 py-2.5 text-sm text-gray-700 dark:text-zinc-300 placeholder-gray-400 border border-gray-100 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-orange-400/30"
              />
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleShare}
                disabled={selected.length === 0 || sending}
                className="w-full gradient-orange text-white font-bold py-3 rounded-2xl shadow-lg shadow-orange-400/25 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {sent ? (
                  <><Check className="w-4 h-4" /> Shared! ✓</>
                ) : sending ? (
                  <Loader className="w-5 h-5 animate-spin" />
                ) : (
                  <><Share2 className="w-4 h-4" /> Share with {selected.length > 0 ? `${selected.length} person${selected.length > 1 ? 's' : ''}` : '...'}</>
                )}
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
