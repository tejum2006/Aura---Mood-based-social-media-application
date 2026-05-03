import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Heart, MessageCircle, Eye, Clock, ChevronRight, Search, X, Loader, User, LogOut } from 'lucide-react';
import { discoverSeries, discoverVideos, creatorPosts, posts as mockPosts } from '../data/mockData';
import Avatar from '../components/UI/Avatar';
import Modal from '../components/UI/Modal';
import { useAuth } from '../context/AuthContext';
import { formatCount } from '../lib/utils';
import api from '../lib/api';

function SkeletonStrip() {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden border border-orange-50 dark:border-zinc-800">
      <div className="h-48 skeleton" />
      <div className="p-4 space-y-2">
        <div className="h-4 w-3/4 rounded-full skeleton" />
        <div className="h-3 w-full rounded-full skeleton" />
      </div>
    </div>
  );
}

// Search Results component
function SearchResults({ results, query, onClose }) {
  const { dbPosts = [], mockPostIds = [], users = [] } = results;
  const matchedMock = mockPosts.filter(p => mockPostIds.includes(p.id));

  const hasResults = dbPosts.length > 0 || matchedMock.length > 0 || users.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className="space-y-4"
    >
      {!hasResults && (
        <div className="text-center py-16">
          <p className="text-3xl mb-2">🔍</p>
          <p className="text-gray-400 dark:text-zinc-500 text-sm">No results for "{query}"</p>
          <p className="text-gray-300 dark:text-zinc-600 text-xs mt-1">Try different keywords or hashtags</p>
        </div>
      )}

      {/* Users */}
      {users.length > 0 && (
        <section>
          <h3 className="text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider mb-3">People</h3>
          <div className="space-y-2">
            {users.map(u => (
              <motion.div key={u.id} whileHover={{ scale: 1.01 }}
                className="flex items-center gap-3 bg-white dark:bg-zinc-900 p-3 rounded-2xl border border-orange-50/80 dark:border-zinc-800">
                <div className="w-10 h-10 rounded-full gradient-orange flex items-center justify-center text-white font-bold shrink-0">
                  {u.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-900 dark:text-white">{u.name}</p>
                  <p className="text-xs text-gray-400">{u.email}</p>
                </div>
                <User className="w-4 h-4 text-orange-400" />
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Posts from DB */}
      {dbPosts.length > 0 && (
        <section>
          <h3 className="text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider mb-3">Posts</h3>
          <div className="space-y-3">
            {dbPosts.map(p => (
              <motion.div key={p.id} whileHover={{ y: -1 }}
                className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-orange-50/80 dark:border-zinc-800">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-full gradient-orange flex items-center justify-center text-white text-xs font-bold">{p.username?.[0]}</div>
                  <span className="text-xs font-semibold text-gray-700 dark:text-zinc-300">{p.username}</span>
                  <span className="text-xs text-orange-400 capitalize bg-orange-50 dark:bg-orange-950/30 px-2 py-0.5 rounded-full ml-auto">{p.mood}</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-zinc-400 line-clamp-2">{p.caption}</p>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Mock posts matching search */}
      {matchedMock.length > 0 && (
        <section>
          <h3 className="text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider mb-3">Posts</h3>
          <div className="space-y-3">
            {matchedMock.map(p => (
              <motion.div key={p.id} whileHover={{ y: -1 }}
                className="bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden border border-orange-50/80 dark:border-zinc-800">
                {p.image && (
                  <div className="h-32">
                    <img src={p.image} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Avatar src={p.user.avatarUrl} name={p.user.name} size="xs" />
                    <span className="text-xs font-semibold text-gray-700 dark:text-zinc-300">{p.user.name}</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-zinc-400 line-clamp-2">{p.caption}</p>
                  <div className="flex gap-1.5 mt-2 flex-wrap">
                    {p.hashtags.map(tag => (
                      <span key={tag} className="text-orange-500 text-xs font-medium">{tag}</span>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}
    </motion.div>
  );
}

export default function Discover() {
  const { logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [videoModal, setVideoModal] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(t);
  }, []);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }
    const timer = setTimeout(() => doSearch(searchQuery), 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const doSearch = async (q) => {
    setSearching(true);
    try {
      const res = await api.get(`/search?q=${encodeURIComponent(q)}`);
      setSearchResults(res.data);
    } catch {
      // Fallback: client-side only search
      const regex = new RegExp(q, 'i');
      const matchedMock = mockPosts
        .filter(p => regex.test(p.caption) || p.hashtags.some(h => regex.test(h)) || regex.test(p.user?.name))
        .map(p => p.id);
      setSearchResults({ dbPosts: [], mockPostIds: matchedMock, users: [] });
    } finally {
      setSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults(null);
  };

  const cardAnim = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } };

  return (
    <div className="flex flex-col h-full bg-[#FFF8F3] dark:bg-zinc-950">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#FFF8F3]/90 dark:bg-zinc-950/90 backdrop-blur-xl px-5 pt-5 pb-4 border-b border-orange-100/50 dark:border-zinc-800">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Discover</h1>
            <span className="text-xs font-semibold text-orange-400 bg-orange-50 dark:bg-orange-950/40 px-3 py-1.5 rounded-full border border-orange-100 dark:border-orange-800">
              New Series ✦
            </span>
          </div>
          <motion.button whileTap={{ scale: 0.88 }} onClick={logout} title="Sign out"
            className="w-9 h-9 rounded-xl bg-white dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 flex items-center justify-center shadow-sm">
            <LogOut className="w-4 h-4 text-gray-500 dark:text-zinc-400" />
          </motion.button>
        </div>
        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-500 pointer-events-none" style={{ width: 16, height: 16 }} />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search stories, creators, hashtags..."
            className="w-full pl-9 pr-10 py-2.5 bg-white dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 rounded-2xl text-sm text-gray-700 dark:text-zinc-300 placeholder-gray-300 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-orange-400/30"
          />
          {searchQuery ? (
            searching ? (
              <Loader className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-400 animate-spin" />
            ) : (
              <motion.button whileTap={{ scale: 0.85 }} onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-gray-200 dark:bg-zinc-700 rounded-full flex items-center justify-center">
                <X className="w-3 h-3 text-gray-500 dark:text-zinc-400" />
              </motion.button>
            )
          ) : null}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto scrollbar-hide px-4 pb-28 pt-4 space-y-8">
        <AnimatePresence mode="wait">
          {/* Search Results */}
          {searchResults !== null ? (
            <SearchResults key="results" results={searchResults} query={searchQuery} />
          ) : loading ? (
            <div key="loading" className="space-y-5">
              {[1, 2].map(i => <SkeletonStrip key={i} />)}
            </div>
          ) : (
            <motion.div key="content" className="space-y-8">
              {/* ─── Series ─── */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-bold text-gray-900 dark:text-white">New Series</h2>
                  <button className="flex items-center gap-0.5 text-xs text-orange-500 font-semibold">
                    See all <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
                <div className="space-y-4">
                  {discoverSeries.map((item, i) => (
                    <motion.article key={item.id} {...cardAnim} transition={{ delay: i * 0.1 }}
                      whileHover={{ y: -2 }}
                      className="bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden shadow-sm border border-orange-50/80 dark:border-zinc-800">
                      <div className="relative h-52">
                        <img src={item.image} alt={item.title} className="w-full h-full object-cover" loading="lazy" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                        <span className="absolute top-3 left-3 text-xs font-bold text-white bg-orange-500 px-2.5 py-1 rounded-full">{item.category}</span>
                        <div className="absolute bottom-3 left-4 right-4">
                          <p className="text-white font-bold text-base leading-tight">{item.title}</p>
                        </div>
                      </div>
                      <div className="px-5 py-4">
                        <p className="text-gray-500 dark:text-zinc-400 text-sm line-clamp-2 mb-3">{item.description}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar src={item.author.avatarUrl} name={item.author.name} size="xs" />
                            <span className="text-xs font-medium text-gray-600 dark:text-zinc-400">{item.author.name}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1 text-xs text-gray-400"><Heart className="w-3.5 h-3.5 text-red-400 fill-red-400" />{formatCount(item.likes)}</span>
                            <span className="flex items-center gap-1 text-xs text-gray-400"><MessageCircle className="w-3.5 h-3.5 text-blue-400" />{formatCount(item.comments)}</span>
                            <span className="text-xs text-orange-400 font-medium">{item.readTime}</span>
                          </div>
                        </div>
                      </div>
                    </motion.article>
                  ))}
                </div>
              </section>

              {/* ─── Videos ─── */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-bold text-gray-900 dark:text-white">Featured Videos</h2>
                  <button className="flex items-center gap-0.5 text-xs text-orange-500 font-semibold">See all <ChevronRight className="w-3 h-3" /></button>
                </div>
                <div className="space-y-4">
                  {discoverVideos.map((video, i) => (
                    <motion.div key={video.id} {...cardAnim} transition={{ delay: i * 0.1 + 0.2 }}
                      className="bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden border border-orange-50/80 dark:border-zinc-800 shadow-sm">
                      <div className="relative h-44 cursor-pointer group" onClick={() => setVideoModal(video)}>
                        <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" loading="lazy" />
                        <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors" />
                        <span className="absolute bottom-3 right-3 bg-black/70 text-white text-xs font-semibold px-2 py-0.5 rounded-full">{video.duration}</span>
                        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="absolute inset-0 flex items-center justify-center">
                          <div className="w-14 h-14 glass rounded-full flex items-center justify-center shadow-xl">
                            <Play className="w-6 h-6 text-white fill-white ml-1" />
                          </div>
                        </motion.div>
                      </div>
                      <div className="px-4 py-3 flex items-center gap-3">
                        <Avatar src={video.creator.avatarUrl} name={video.creator.name} size="xs" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-1">{video.title}</p>
                          <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-zinc-500 mt-0.5">
                            <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{video.views}</span>
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{video.time}</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </section>

              {/* ─── Creator Spotlight ─── */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-bold text-gray-900 dark:text-white">Creator Spotlights</h2>
                  <button className="flex items-center gap-0.5 text-xs text-orange-500 font-semibold">See all <ChevronRight className="w-3 h-3" /></button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {creatorPosts.map((item, i) => (
                    <motion.article key={item.id} {...cardAnim} transition={{ delay: i * 0.12 + 0.3 }}
                      whileHover={{ scale: 1.02 }}
                      className="bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden border border-orange-50/80 dark:border-zinc-800 shadow-sm">
                      <div className="relative h-32">
                        <img src={item.image} alt="" className="w-full h-full object-cover" loading="lazy" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                        <div className="absolute bottom-2 left-2 right-2">
                          <div className="flex items-center gap-1.5">
                            <Avatar src={item.user.avatarUrl} name={item.user.name} size="xs" />
                            <span className="text-white text-[11px] font-semibold truncate">{item.user.name}</span>
                          </div>
                        </div>
                      </div>
                      <div className="px-3 py-2.5">
                        <p className="text-xs text-gray-600 dark:text-zinc-400 line-clamp-2">{item.caption}</p>
                        <div className="flex items-center gap-2 mt-1.5 text-[10px] text-gray-400">
                          <span className="flex items-center gap-0.5"><Eye className="w-3 h-3" />{item.views}</span>
                          <span>{item.time}</span>
                        </div>
                      </div>
                    </motion.article>
                  ))}
                </div>
              </section>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Video Modal */}
      <Modal isOpen={!!videoModal} onClose={() => setVideoModal(null)} title={videoModal?.title}>
        {videoModal && (
          <div className="p-4 pb-6">
            <div className="relative h-52 rounded-2xl overflow-hidden bg-black mb-4">
              <img src={videoModal.thumbnail} alt="" className="w-full h-full object-cover opacity-80" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 gradient-orange rounded-full flex items-center justify-center shadow-xl shadow-orange-500/40">
                  <Play className="w-7 h-7 text-white fill-white ml-1" />
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                <div className="h-full w-1/3 gradient-orange" />
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-zinc-400">{videoModal.description}</p>
            <div className="flex items-center gap-3 mt-4">
              <Avatar src={videoModal.creator.avatarUrl} name={videoModal.creator.name} size="sm" />
              <div>
                <p className="text-sm font-semibold text-gray-800 dark:text-white">{videoModal.creator.name}</p>
                <p className="text-xs text-gray-400">{videoModal.creator.followers} followers</p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
