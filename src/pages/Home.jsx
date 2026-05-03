import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Sun, Moon, Sparkles, LogOut, Loader, Image as ImageIcon, Heart, MessageCircle } from 'lucide-react';
import { posts as mockPosts } from '../data/mockData';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import MoodSelector from '../components/Feed/MoodSelector';
import PostCard from '../components/Feed/PostCard';
import FloatingActionButton from '../components/Feed/FloatingActionButton';
import SkeletonCard from '../components/UI/SkeletonCard';
import Modal from '../components/UI/Modal';
import api from '../lib/api';

export default function Home() {
  const { dark, toggleDark } = useTheme();
  const { user, logout } = useAuth();
  const [activeMood, setActiveMood] = useState('all');
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [caption, setCaption] = useState('');
  const [postMood, setPostMood] = useState('happy');
  const [imageFile, setImageFile] = useState(null);
  const [submittingPost, setSubmittingPost] = useState(false);
  const [notifCount] = useState(3);
  
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Reset feed when mood changes
  useEffect(() => {
    loadFeed(true);
  }, [activeMood]);

  const loadFeed = async (reset = false) => {
    if (reset) {
      setLoading(true);
      setPage(1);
      setHasMore(true);
    } else {
      setLoadingMore(true);
    }
    
    const currentPage = reset ? 1 : page;

    try {
      // Fetch user's likes from backend
      let likedIds = new Set();
      try {
        const likesRes = await api.get('/likes/my');
        likedIds = new Set(likesRes.data.likedPostIds.map(String));
      } catch {}

      // Fetch user-created posts from DB
      let dbPosts = [];
      let totalPages = 1;
      try {
        const postsRes = await api.get(`/posts?page=${currentPage}&limit=10${activeMood !== 'all' ? `&mood=${activeMood}` : ''}`);
        totalPages = postsRes.data.totalPages || 1;
        dbPosts = postsRes.data.posts.map(p => ({
          id: `db-${p.id}`,
          user: { name: p.user.name, avatarUrl: p.user.avatarUrl, location: 'AURA Community', isOnline: false },
          mood: p.mood,
          caption: p.caption,
          image: p.image || null,
          gradient: 'from-orange-200 via-amber-100 to-rose-200',
          likes: 0, comments: 0, shares: 0,
          time: 'recently',
          hashtags: p.hashtags || [],
          isLiked: likedIds.has(String(p.id)),
          isBookmarked: p.isBookmarked,
          dbId: p.id
        }));
      } catch {}

      if (currentPage >= totalPages) {
        setHasMore(false);
      } else {
        setHasMore(true);
        if (!reset) setPage(p => p + 1);
      }

      // Filter mock posts by mood
      const filtered = activeMood === 'all'
        ? mockPosts
        : mockPosts.filter(p => p.mood === activeMood);

      const combined = [
        ...dbPosts,
        ...filtered.map(p => ({ ...p, isLiked: likedIds.has(String(p.id)) })),
      ];

      setPosts(prev => reset ? combined : [...prev, ...dbPosts]);
      if (reset) setPage(2);
    } catch {
      // Full fallback
      const filtered = activeMood === 'all' ? mockPosts : mockPosts.filter(p => p.mood === activeMood);
      setPosts(filtered);
      setHasMore(false);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleScroll = (e) => {
    const bottom = e.target.scrollHeight - e.target.scrollTop <= e.target.clientHeight + 100;
    if (bottom && hasMore && !loadingMore && !loading) {
      loadFeed(false);
    }
  };

  const handleLike = useCallback(async (postId) => {
    // Optimistic update
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, isLiked: !p.isLiked } : p));
    
    // Check if it's a mock post vs a database post
    const strPostId = String(postId);
    if (!strPostId.startsWith('db-')) return;
    
    try {
      await api.post('/likes/toggle', { postId: strPostId.replace('db-', '') });
    } catch {
      // Revert on failure
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, isLiked: !p.isLiked } : p));
    }
  }, []);

  const handleCommentAdded = useCallback((postId) => {
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, comments: p.comments + 1 } : p));
  }, []);

  const handleCreatePost = async () => {
    if (!caption.trim()) return;
    setSubmittingPost(true);
    try {
      const formData = new FormData();
      formData.append('caption', caption);
      formData.append('mood', postMood);
      if (imageFile) {
        formData.append('image', imageFile);
      }

      await api.post('/posts', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setCaption('');
      setImageFile(null);
      setShowCreateModal(false);
      loadFeed(true); // refresh feed from start
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create post.');
    } finally {
      setSubmittingPost(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-950">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-xl px-5 pt-4 pb-3 border-b border-gray-100 dark:border-zinc-800">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-orange-400" />
              <span className="text-xs font-semibold text-orange-400 uppercase tracking-widest">AURA</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
              Feed
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <motion.button onClick={() => window.location.href = '/network'} whileTap={{ scale: 0.88 }} className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-zinc-800">
              <Heart className="w-5 h-5" />
            </motion.button>
            <motion.button onClick={() => window.location.href = '/chat'} whileTap={{ scale: 0.88 }} className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-zinc-800">
              <MessageCircle className="w-5 h-5" />
            </motion.button>
            <motion.button whileTap={{ scale: 0.88 }} onClick={toggleDark}
              className="w-9 h-9 rounded-xl bg-white dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 flex items-center justify-center shadow-sm">
              {dark ? <Sun className="w-4 h-4 text-orange-400" /> : <Moon className="w-4 h-4 text-gray-500" />}
            </motion.button>
            <motion.button whileTap={{ scale: 0.88 }}
              className="w-9 h-9 rounded-xl bg-white dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 flex items-center justify-center shadow-sm relative">
              <Bell className="w-4 h-4 text-gray-600 dark:text-zinc-400" />
              {notifCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 gradient-orange rounded-full text-[9px] text-white font-bold flex items-center justify-center">
                  {notifCount}
                </span>
              )}
            </motion.button>
            <motion.button whileTap={{ scale: 0.88 }} onClick={logout} title="Sign out"
              className="w-9 h-9 rounded-xl bg-white dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 flex items-center justify-center shadow-sm">
              <LogOut className="w-4 h-4 text-gray-500 dark:text-zinc-400" />
            </motion.button>
          </div>
        </div>
        <div className="mt-4">
          <MoodSelector active={activeMood} onChange={setActiveMood} />
        </div>
      </header>

      {/* Feed */}
      <main 
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto scrollbar-hide px-4 py-4 pb-32 space-y-5"
      >
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div key="skeletons" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">
              {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
            </motion.div>
          ) : (
            <motion.div key="posts" className="space-y-5">
              <AnimatePresence>
                {posts.length === 0 ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
                    <p className="text-4xl mb-3">✦</p>
                    <p className="text-gray-400 dark:text-zinc-500 text-sm">No posts in this mood yet.</p>
                  </motion.div>
                ) : (
                  posts.map((post, i) => (
                    <motion.div key={post.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                      <PostCard post={post} onLike={handleLike} onCommentAdded={handleCommentAdded} />
                    </motion.div>
                  ))
                )}
                {loadingMore && (
                  <div className="flex justify-center py-4">
                    <Loader className="w-5 h-5 animate-spin text-orange-400" />
                  </div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <FloatingActionButton onClick={() => setShowCreateModal(true)} />

      {/* Create Post Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create Post">
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3 p-3 bg-orange-50 dark:bg-zinc-800 rounded-2xl">
            <div className="w-10 h-10 gradient-orange rounded-full flex items-center justify-center text-white font-bold">
              {user?.name?.[0]?.toUpperCase() || 'A'}
            </div>
            <div>
              <p className="font-semibold text-sm text-gray-800 dark:text-white">{user?.name || 'You'}</p>
              <p className="text-xs text-gray-400">Sharing to your aura</p>
            </div>
          </div>
          <textarea
            value={caption}
            onChange={e => setCaption(e.target.value)}
            placeholder="What's on your mind? Share your kinetic moment... (use #hashtags)"
            className="w-full h-28 bg-gray-50 dark:bg-zinc-800 rounded-2xl px-4 py-3 text-sm text-gray-700 dark:text-zinc-300 resize-none border border-gray-100 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-orange-400/30 placeholder-gray-300 dark:placeholder-zinc-600"
          />
          {/* Media Upload */}
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300 text-xs font-semibold rounded-xl cursor-pointer hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors">
              <ImageIcon className="w-4 h-4" />
              {imageFile ? imageFile.name.substring(0, 20) + '...' : 'Upload Media'}
              <input 
                type="file" 
                accept="image/*,video/*"
                className="hidden" 
                onChange={e => e.target.files && setImageFile(e.target.files[0])}
              />
            </label>
            {imageFile && (
              <button 
                className="text-xs text-red-500 font-medium hover:underline"
                onClick={() => setImageFile(null)}
              >
                Clear
              </button>
            )}
          </div>
          {/* Mood selector for new post */}
          <div className="flex gap-2">
            {['happy', 'sad', 'angry', 'relaxed'].map(m => (
              <button
                key={m}
                onClick={() => setPostMood(m)}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold capitalize transition-all ${postMood === m ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-md' : 'bg-gray-100 dark:bg-zinc-800 text-gray-500'}`}
              >
                {m === 'happy' ? '😊' : m === 'sad' ? '😢' : m === 'angry' ? '😡' : '😌'} {m}
              </button>
            ))}
          </div>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleCreatePost}
            disabled={!caption.trim() || submittingPost}
            className="w-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold py-3 rounded-2xl shadow-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submittingPost ? <Loader className="w-4 h-4 animate-spin" /> : 'Post to Aura ✦'}
          </motion.button>
        </div>
      </Modal>
    </div>
  );
}
