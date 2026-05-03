import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

export default function ChatBubble({ message }) {
  const { text, isSender, time } = message;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', damping: 24, stiffness: 340 }}
      className={cn('flex items-end gap-2 mb-1', isSender ? 'flex-row-reverse' : 'flex-row')}
    >
      <div
        className={cn(
          'max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm',
          isSender
            ? 'gradient-orange text-white rounded-br-md shadow-orange-300/30'
            : 'bg-white dark:bg-zinc-800 text-gray-700 dark:text-zinc-200 rounded-bl-md border border-gray-100 dark:border-zinc-700'
        )}
      >
        <p>{text}</p>
        <p className={cn('text-[10px] mt-1 text-right', isSender ? 'text-orange-100' : 'text-gray-400 dark:text-zinc-500')}>
          {time}
        </p>
      </div>
    </motion.div>
  );
}
