import { motion } from 'framer-motion';

const moods = [
  { id: 'all', label: 'All', emoji: '✦' },
  { id: 'happy', label: 'Happy', emoji: '😊' },
  { id: 'sad', label: 'Sad', emoji: '😢' },
  { id: 'angry', label: 'Angry', emoji: '😡' },
  { id: 'relaxed', label: 'Relaxed', emoji: '😌' },
];

export default function MoodSelector({ active, onChange }) {
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide py-1">
      {moods.map(mood => {
        const isActive = active === mood.id;
        return (
          <motion.button
            key={mood.id}
            whileTap={{ scale: 0.92 }}
            onClick={() => onChange(mood.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
              isActive
                ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-sm'
                : 'bg-white dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 border border-gray-100 dark:border-zinc-700'
            }`}
          >
            <span>{mood.emoji}</span>
            <span>{mood.label}</span>
            {isActive && (
              <motion.div
                layoutId="mood-pill"
                className="absolute inset-0 rounded-2xl"
                transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              />
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
