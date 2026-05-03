import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, Share2, LogOut } from 'lucide-react';
import { reels as reelData } from '../data/mockData';
import Avatar from '../components/UI/Avatar';
import CommentSheet from '../components/Feed/CommentSheet';
import ShareModal from '../components/Feed/ShareModal';
import { useAuth } from '../context/AuthContext';
import { formatCount } from '../lib/utils';
import api from '../lib/api';

function ActionButton({ icon: Icon, count, active, onClick, activeColor = 'text-orange-500' }) {
  return (
    <motion.button whileTap={{ scale: 0.82 }} onClick={onClick} className="flex flex-col items-center gap-1.5">
      <div className="w-12 h-12 glass rounded-2xl flex items-center justify-center shadow-lg">
        <Icon className={`w-5 h-5 transition-colors ${active ? activeColor + ' fill-current' : 'text-white'}`} strokeWidth={active ? 0 : 1.8} />
      </div>
      <span className="text-white/80 text-xs font-semibold tabular-nums">{formatCount(count)}</span>
    </motion.button>
  );
}

export default function Reels() {
  const { logout } = useAuth();
  const [reels, setReels] = useState(reelData);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const currentReel = reels[currentIndex];

  const handleLike = useCallback(async () => {
    // Optimistic toggle
    setReels(prev => prev.map((r, i) => i === currentIndex ? { ...r, isLiked: !r.isLiked } : r));
    try {
      await api.post('/likes/toggle', { postId: `reel-${currentReel.id}` });
    } catch {}
  }, [currentIndex, currentReel?.id]);

  return (
    <div className="relative h-full overflow-hidden">
      {/* Fullscreen bg */}
      <div className="absolute inset-0">
        <img src={currentReel.image} alt="" className="w-full h-full object-cover" />
        <div className={`absolute inset-0 bg-gradient-to-t ${currentReel.gradient} opacity-60`} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-black/20" />
      </div>

      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-10 px-5 pt-5 pb-3">
        <div className="flex items-center justify-between">
          <h2 className="text-white font-bold text-lg">Reels</h2>
          <motion.button whileTap={{ scale: 0.88 }} onClick={logout} title="Sign out"
            className="w-9 h-9 rounded-xl bg-black/20 backdrop-blur-md border border-white/10 flex items-center justify-center shadow-lg">
            <LogOut className="w-4 h-4 text-white/80" />
          </motion.button>
        </div>
        <div className="flex gap-2 mt-2">
          {reels.map((_, i) => (
            <button key={i}
              onClick={() => { setCurrentIndex(i); setCommentsOpen(false); setShareOpen(false); }}
              className={`h-1 rounded-full transition-all duration-300 ${i === currentIndex ? 'w-8 bg-orange-400' : 'w-4 bg-white/40'}`}
            />
          ))}
        </div>
      </header>

      {/* Right action buttons */}
      <div className="absolute right-4 bottom-32 z-20 flex flex-col items-center gap-4">
        <ActionButton
          icon={Heart}
          count={currentReel.isLiked ? currentReel.likes + 1 : currentReel.likes}
          active={currentReel.isLiked}
          activeColor="text-red-500"
          onClick={handleLike}
        />
        <ActionButton
          icon={MessageCircle}
          count={currentReel.comments}
          onClick={() => setCommentsOpen(true)}
        />
        <ActionButton
          icon={Share2}
          count={currentReel.shares}
          onClick={() => setShareOpen(true)}
        />
      </div>

      {/* Bottom user info */}
      <div className="absolute bottom-28 left-0 right-20 px-5 z-10">
        <div className="flex items-center gap-3 mb-3">
          <Avatar src={currentReel.user.avatarUrl} name={currentReel.user.name} size="sm" online={currentReel.user.isOnline} />
          <div>
            <p className="text-white font-bold text-sm">{currentReel.user.name}</p>
            <p className="text-white/60 text-xs">{currentReel.user.username}</p>
          </div>
          <button className="ml-auto glass text-white text-xs font-semibold px-4 py-1.5 rounded-full">Follow</button>
        </div>
        <p className="text-white text-sm leading-relaxed mb-2">{currentReel.caption}</p>
        <div className="flex flex-wrap gap-1.5">
          {currentReel.hashtags.map(tag => (
            <span key={tag} className="text-orange-300 text-xs font-medium">{tag}</span>
          ))}
        </div>
      </div>

      {/* Comments Sheet — wired to backend */}
      <CommentSheet
        isOpen={commentsOpen}
        onClose={() => setCommentsOpen(false)}
        postId={`reel-${currentReel.id}`}
        initialComments={currentReel.commentsList.map(c => ({
          id: c.id,
          text: c.text,
          time: c.time,
          user: c.user,
        }))}
      />

      {/* Share Modal — wired to backend */}
      <ShareModal
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        postId={`reel-${currentReel.id}`}
        caption={currentReel.caption}
      />
    </div>
  );
}
