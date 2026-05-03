import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, children }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />
          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: 'spring', damping: 28, stiffness: 340 }}
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl max-h-[85vh] flex flex-col max-w-md mx-auto"
          >
            {title && (
              <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100 dark:border-zinc-800">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h2>
                <motion.button
                  whileTap={{ scale: 0.88 }}
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center"
                >
                  <X className="w-4 h-4 text-gray-500 dark:text-zinc-400" />
                </motion.button>
              </div>
            )}
            <div className="overflow-y-auto scrollbar-hide">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
