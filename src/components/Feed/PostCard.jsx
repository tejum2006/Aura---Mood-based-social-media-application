import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, Share2, MapPin, Bookmark } from 'lucide-react';
import Avatar from '../UI/Avatar';
import CommentSheet from './CommentSheet';
import ShareModal from './ShareModal';
import { formatCount } from '../../lib/utils';
import api from '../../lib/api';

export default function PostCard({ post, onLike, onCommentAdded }) {
  const navigate = useNavigate();
  const [commentOpen, setCommentOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(post.isBookmarked || false);

  const handleBookmark = async () => {
    setIsBookmarked(prev => !prev);
    try {
      const realId = post.dbId || String(post.id).replace('db-', '');
      await api.post(`/posts/${realId}/bookmark`);
    } catch {
      setIsBookmarked(prev => !prev);
    }
  };

  return (
    <>
      <motion.article
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ type: 'spring', damping: 24, stiffness: 280 }}
        whileHover={{ y: -2 }}
        className="bg-white dark:bg-black rounded-xl overflow-hidden border border-gray-200 dark:border-zinc-800 transition-shadow duration-300"
      >
        {/* Hero Image / Video */}
        <div className="relative h-64 overflow-hidden">
          {post.image ? (
            post.image.match(/\.(mp4|webm|ogg)$/i) || post.image.includes('/video/upload/') ? (
              <video src={post.image} autoPlay loop muted playsInline className="w-full h-full object-cover bg-black" />
            ) : (
              <img src={post.image} alt={post.caption} className="w-full h-full object-cover" loading="lazy" />
            )
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${post.gradient}`} />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

          {/* Mood badge */}
          <div className="absolute top-4 left-4">
            <span className="bg-white/20 backdrop-blur-md text-white text-xs font-semibold px-3 py-1.5 rounded-full capitalize">
              {post.mood} ✦
            </span>
          </div>

          {/* Bookmark */}
          <motion.button 
            whileTap={{ scale: 0.85 }}
            onClick={handleBookmark}
            className="absolute top-4 right-4 w-9 h-9 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center transition-colors">
            <Bookmark className={`w-4 h-4 ${isBookmarked ? 'text-orange-500 fill-orange-500' : 'text-white'}`} />
          </motion.button>

          {/* User info */}
          <div className="absolute bottom-0 left-0 right-0 p-4 flex items-end gap-3">
            <div onClick={(e) => { e.stopPropagation(); navigate(`/profile/${post.user.id}`); }} className="cursor-pointer hover:opacity-90 transition-opacity">
              <Avatar src={post.user.avatarUrl} name={post.user.name} size="sm" online={post.user.isOnline} className="ring-2 ring-white/40" />
            </div>
            <div className="flex-1 min-w-0 cursor-pointer" onClick={(e) => { e.stopPropagation(); navigate(`/profile/${post.user.id}`); }}>
              <p className="text-white font-semibold text-sm leading-tight hover:underline">{post.user.name}</p>
              <div className="flex items-center gap-1 text-white/70 text-xs">
                <MapPin className="w-3 h-3" />
                <span>{post.user.location}</span>
              </div>
            </div>
            <span className="text-white/60 text-xs">{post.time}</span>
          </div>
        </div>

        {/* Caption */}
        <div className="px-5 pt-4 pb-2">
          <p className="text-gray-700 dark:text-zinc-300 text-sm leading-relaxed line-clamp-2">{post.caption}</p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {post.hashtags.map(tag => (
              <span key={tag} className="text-orange-500 text-xs font-medium hover:underline cursor-pointer">{tag}</span>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="px-5 py-3 flex items-center justify-between border-t border-gray-50 dark:border-zinc-800 mt-1">
          <div className="flex items-center gap-5">
            {/* Like */}
            <motion.button whileTap={{ scale: 0.8 }} onClick={() => onLike(post.id)} className="flex items-center gap-1.5 group">
              <AnimatePresence mode="wait">
                <motion.div
                  key={post.isLiked ? 'liked' : 'unliked'}
                  initial={{ scale: 0.5 }} animate={{ scale: 1 }} exit={{ scale: 0.5 }}
                  transition={{ duration: 0.15 }}
                >
                  <Heart className={`w-5 h-5 transition-colors ${post.isLiked ? 'text-red-500 fill-red-500' : 'text-gray-400 dark:text-zinc-500 group-hover:text-red-400'}`} />
                </motion.div>
              </AnimatePresence>
              <span className={`text-xs font-semibold tabular-nums ${post.isLiked ? 'text-red-500' : 'text-gray-500 dark:text-zinc-400'}`}>
                {formatCount(post.isLiked ? post.likes + 1 : post.likes)}
              </span>
            </motion.button>

            {/* Comment */}
            <motion.button whileTap={{ scale: 0.85 }} onClick={() => setCommentOpen(true)}
              className="flex items-center gap-1.5 group">
              <MessageCircle className="w-5 h-5 text-gray-400 dark:text-zinc-500 group-hover:text-blue-400 transition-colors" />
              <span className="text-xs font-semibold text-gray-500 dark:text-zinc-400 tabular-nums">
                {formatCount(post.comments)}
              </span>
            </motion.button>

            {/* Share */}
            <motion.button whileTap={{ scale: 0.85 }} onClick={() => setShareOpen(true)}
              className="flex items-center gap-1.5 group">
              <Share2 className="w-5 h-5 text-gray-400 dark:text-zinc-500 group-hover:text-orange-400 transition-colors" />
              <span className="text-xs font-semibold text-gray-500 dark:text-zinc-400 tabular-nums">
                {formatCount(post.shares)}
              </span>
            </motion.button>
          </div>
          <span className="text-xs text-gray-400 dark:text-zinc-600">{post.time}</span>
        </div>
      </motion.article>

      {/* Comment Sheet */}
      <CommentSheet
        isOpen={commentOpen}
        onClose={() => setCommentOpen(false)}
        postId={String(post.id)}
        initialComments={[]}
        onCommentAdded={() => onCommentAdded && onCommentAdded(post.id)}
      />

      {/* Share Modal */}
      <ShareModal
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        postId={String(post.id)}
        caption={post.caption}
      />
    </>
  );
}
