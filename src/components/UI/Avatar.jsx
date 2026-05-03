import { motion } from 'framer-motion';

export default function Avatar({ src, name, size = 'md', online = false, className = '' }) {
  const sizes = {
    xs: 'w-7 h-7 text-xs',
    sm: 'w-9 h-9 text-sm',
    md: 'w-12 h-12 text-base',
    lg: 'w-16 h-16 text-xl',
    xl: 'w-20 h-20 text-2xl',
  };

  const dotSizes = {
    xs: 'w-2 h-2',
    sm: 'w-2.5 h-2.5',
    md: 'w-3 h-3',
    lg: 'w-3.5 h-3.5',
    xl: 'w-4 h-4',
  };

  const initials = name
    ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  return (
    <div className={`relative shrink-0 ${className}`}>
      <motion.div
        whileHover={{ scale: 1.05 }}
        className={`${sizes[size]} rounded-full overflow-hidden border-2 border-orange-200 dark:border-orange-900`}
      >
        {src ? (
          <img
            src={src}
            alt={name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full gradient-orange flex items-center justify-center text-white font-semibold">
            {initials}
          </div>
        )}
      </motion.div>
      {online && (
        <div
          className={`absolute bottom-0 right-0 ${dotSizes[size]} bg-green-400 rounded-full border-2 border-white dark:border-zinc-900`}
        />
      )}
    </div>
  );
}
