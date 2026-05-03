import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  onClick,
  disabled = false,
  ...props
}) {
  const base = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 select-none';
  
  const variants = {
    primary: 'gradient-orange text-white shadow-lg shadow-orange-400/30 hover:shadow-orange-400/50',
    secondary: 'bg-orange-50 dark:bg-orange-950/40 text-orange-500 border border-orange-200 dark:border-orange-800',
    ghost: 'bg-transparent text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800',
    danger: 'bg-red-50 dark:bg-red-950/40 text-red-500 border border-red-200 dark:border-red-800',
    outline: 'bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-zinc-300',
  };

  const sizes = {
    xs: 'text-xs px-3 py-1.5 gap-1',
    sm: 'text-sm px-4 py-2 gap-1.5',
    md: 'text-sm px-5 py-2.5 gap-2',
    lg: 'text-base px-6 py-3 gap-2',
  };

  return (
    <motion.button
      whileTap={{ scale: 0.94 }}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      onClick={onClick}
      disabled={disabled}
      className={cn(base, variants[variant], sizes[size], disabled && 'opacity-50 cursor-not-allowed', className)}
      {...props}
    >
      {children}
    </motion.button>
  );
}
