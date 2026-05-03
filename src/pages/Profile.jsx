import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, MapPin, Grid, Loader } from 'lucide-react';
import Avatar from '../components/UI/Avatar';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let targetId = id;
    if (id === 'me') {
      // we assume we have useAuth hook user
      // but wait, we need to import useAuth
    }
    
    // If it's a mock ID, go back or handle gracefully
    if (targetId.startsWith('mock-')) {
      alert('This is a mock user without a real profile.');
      navigate(-1);
      return;
    }

    const fetchProfile = async () => {
      let fetchId = id;
      if (id === 'me') {
        if (user) {
          fetchId = user._id; // Replace with actual user ID from context
        } else {
          return;
        }
      }
      try {
        const res = await api.get(`/users/profile/${fetchId}`);
        setProfile(res.data.profile);
        setPosts(res.data.posts);
      } catch (err) {
        console.error('Failed to load profile', err);
        // Add a fallback for mock demo
        if (id === 'me' && user) {
          setProfile({
            name: user.name,
            avatar: user.avatar,
            location: 'India',
            followersCount: 154,
            followingCount: 201,
            isFollowing: false
          });
          setPosts([]);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [id, navigate, user]);

  return (
    <div className="flex flex-col h-full bg-[#FFF8F3] dark:bg-zinc-950">
      <header className="sticky top-0 z-30 bg-[#FFF8F3]/90 dark:bg-zinc-950/90 backdrop-blur-xl px-5 pt-4 pb-3 border-b border-orange-100/50 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <motion.button onClick={() => navigate(-1)} whileTap={{ scale: 0.88 }} className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800">
            <ArrowLeft className="w-5 h-5" />
          </motion.button>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">Profile</h1>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto scrollbar-hide pb-32">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader className="w-6 h-6 text-orange-400 animate-spin" />
          </div>
        ) : profile ? (
          <AnimatePresence>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="px-5 py-6">
              <div className="flex items-center gap-5">
                <Avatar src={profile.avatar} name={profile.name} size="lg" className="w-20 h-20 ring-4 ring-orange-100 dark:ring-zinc-800" />
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">{profile.name}</h2>
                  <div className="flex items-center gap-1 text-gray-500 dark:text-zinc-400 text-sm mt-0.5">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{profile.location}</span>
                  </div>
                  <div className="flex items-center gap-4 mt-3">
                    <div>
                      <p className="text-lg font-bold text-gray-900 dark:text-white leading-none">{profile.followersCount}</p>
                      <p className="text-xs text-gray-500">Followers</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-gray-900 dark:text-white leading-none">{profile.followingCount}</p>
                      <p className="text-xs text-gray-500">Following</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                className={`w-full mt-6 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                  profile.isFollowing 
                    ? 'bg-gray-100 text-gray-700 dark:bg-zinc-800 dark:text-zinc-300'
                    : 'gradient-orange text-white shadow-md shadow-orange-400/30'
                }`}
              >
                {profile.isFollowing ? 'Following' : 'Follow'}
              </motion.button>
            </motion.div>

            <div className="px-5 pt-2 pb-4 border-b border-gray-100 dark:border-zinc-800 flex items-center gap-2">
              <Grid className="w-4 h-4 text-orange-500" />
              <h3 className="font-bold text-gray-900 dark:text-white text-sm">Posts ({posts.length})</h3>
            </div>

            <div className="grid grid-cols-3 gap-1 p-1">
              {posts.map((post, i) => (
                <motion.div key={post.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }} className="aspect-square bg-gray-100 dark:bg-zinc-800 relative overflow-hidden">
                  {post.image ? (
                    <img src={post.image} alt="post" className="w-full h-full object-cover" />
                  ) : (
                    <div className={`w-full h-full bg-gradient-to-br from-orange-200 to-rose-200 p-2 flex items-center justify-center`}>
                      <p className="text-xs text-white/90 text-center font-medium line-clamp-3">{post.caption}</p>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
            
            {posts.length === 0 && (
              <div className="text-center py-16">
                <p className="text-gray-400 text-sm">No posts yet</p>
              </div>
            )}
          </AnimatePresence>
        ) : (
          <div className="text-center py-20 text-gray-500">User not found</div>
        )}
      </main>
    </div>
  );
}
