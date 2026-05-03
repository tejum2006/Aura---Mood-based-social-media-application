import { motion } from 'framer-motion';
import { PenLine } from 'lucide-react';

export default function FloatingActionButton({ onClick }) {
  return (
    <motion.button
      whileTap={{ scale: 0.88 }}
      whileHover={{ scale: 1.08, rotate: 5 }}
      onClick={onClick}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', delay: 0.4, damping: 18 }}
      className="fixed bottom-24 right-6 w-14 h-14 gradient-orange rounded-2xl flex items-center justify-center shadow-xl shadow-orange-500/40 z-40"
      aria-label="Create post"
    >
      <PenLine className="w-6 h-6 text-white" strokeWidth={2} />
    </motion.button>
  );
}
