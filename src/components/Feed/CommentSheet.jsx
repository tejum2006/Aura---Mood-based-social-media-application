import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Send, Loader, MessageCircle, Trash2 } from 'lucide-react';
import Avatar from '../UI/Avatar';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';

function CommentItem({ comment, onDelete, isOwn }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-100 dark:border-zinc-800 last:border-0">
      <Avatar src={comment.user?.avatarUrl} name={comment.user?.name} size="xs" />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-semibold text-gray-900 dark:text-white">{comment.user?.name}</span>
          <span className="text-xs text-gray-400">{comment.time}</span>
        </div>
        <p className="text-sm text-gray-600 dark:text-zinc-400 mt-0.5">{comment.text}</p>
      </div>
      {isOwn && (
        <motion.button whileTap={{ scale: 0.85 }} onClick={() => onDelete(comment.id)}
          className="text-gray-300 dark:text-zinc-600 hover:text-red-400 transition-colors mt-0.5">
          <Trash2 className="w-3.5 h-3.5" />
        </motion.button>
      )}
    </div>
  );
}

export default function CommentSheet({ isOpen, onClose, postId, initialComments = [], onCommentAdded }) {
  const { user } = useAuth();
  const [comments, setComments] = useState(initialComments);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Load real comments from backend when sheet opens
  useEffect(() => {
    if (isOpen && postId && String(postId).startsWith('db-')) {
      setLoading(true);
      const realPostId = postId.replace('db-', '');
      api.get(`/comments/${realPostId}`)
        .then(res => {
          // Merge DB comments with any initial (mock) comments passed in
          const dbComments = res.data.comments || [];
          setComments([...dbComments, ...initialComments]);
        })
        .catch(() => setComments(initialComments))
        .finally(() => setLoading(false));
    } else if (isOpen) {
      setComments(initialComments);
    }
  }, [isOpen, postId]);

  const handleSubmit = async () => {
    if (!text.trim() || submitting) return;
    setSubmitting(true);
    
    if (!String(postId).startsWith('db-')) {
       // Mock comment
       const optimistic = {
        id: `local-${Date.now()}`,
        text: text.trim(),
        time: 'just now',
        user: { name: user?.name || 'You', avatarUrl: user?.avatar || null },
      };
      setComments(prev => [optimistic, ...prev]);
      setText('');
      setSubmitting(false);
      if (onCommentAdded) onCommentAdded();
      return;
    }

    const realPostId = postId.replace('db-', '');
    try {
      const res = await api.post('/comments', { postId: realPostId, text: text.trim() });
      setComments(prev => [res.data.comment, ...prev]);
      setText('');
      if (onCommentAdded) onCommentAdded();
    } catch (err) {
      // Optimistic fallback if backend down
      const optimistic = {
        id: `local-${Date.now()}`,
        text: text.trim(),
        time: 'just now',
        user: { name: user?.name || 'You', avatarUrl: user?.avatar || null },
      };
      setComments(prev => [optimistic, ...prev]);
      setText('');
      if (onCommentAdded) onCommentAdded();
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId) => {
    try {
      await api.delete(`/comments/${commentId}`);
    } catch {}
    setComments(prev => prev.filter(c => c.id !== commentId));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-[90]"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-[100] bg-white dark:bg-zinc-900 rounded-t-3xl shadow-2xl"
            style={{ maxHeight: '72vh', display: 'flex', flexDirection: 'column' }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-gray-200 dark:bg-zinc-700 rounded-full" />
            </div>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-orange-500" />
                <h3 className="font-bold text-gray-900 dark:text-white text-sm">
                  Comments {comments.length > 0 && `(${comments.length})`}
                </h3>
              </div>
              <motion.button whileTap={{ scale: 0.88 }} onClick={onClose}>
                <ChevronDown className="w-5 h-5 text-gray-400" />
              </motion.button>
            </div>

            {/* Comments list */}
            <div className="flex-1 overflow-y-auto scrollbar-hide px-5">
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader className="w-5 h-5 text-orange-400 animate-spin" />
                </div>
              ) : comments.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-3xl mb-2">💬</p>
                  <p className="text-sm text-gray-400">No comments yet. Be the first!</p>
                </div>
              ) : (
                comments.map(c => (
                  <CommentItem
                    key={c.id}
                    comment={c}
                    onDelete={handleDelete}
                    isOwn={c.user?.name === user?.name}
                  />
                ))
              )}
            </div>

            {/* Input */}
            <div className="px-4 py-4 border-t border-gray-100 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 gradient-orange rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {user?.name?.[0]?.toUpperCase() || 'A'}
                </div>
                <div className="flex-1 flex items-center gap-2 bg-gray-50 dark:bg-zinc-800 rounded-2xl px-4 py-2.5 border border-gray-100 dark:border-zinc-700">
                  <input
                    type="text"
                    value={text}
                    onChange={e => setText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                    placeholder="Write a comment..."
                    className="flex-1 bg-transparent text-sm text-gray-700 dark:text-zinc-300 placeholder-gray-300 dark:placeholder-zinc-600 outline-none"
                  />
                  <motion.button
                    whileTap={{ scale: 0.85 }}
                    onClick={handleSubmit}
                    disabled={!text.trim() || submitting}
                    className="text-orange-500 disabled:opacity-30"
                  >
                    {submitting ? <Loader className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
