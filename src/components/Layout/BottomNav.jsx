import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Search, PlusSquare, PlaySquare, User } from 'lucide-react';

const navItems = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/discover', icon: Search, label: 'Search' },
  { to: '/create', icon: PlusSquare, label: 'Create', isCreate: true },
  { to: '/reels', icon: PlaySquare, label: 'Reels' },
  { to: '/profile/me', icon: User, label: 'Profile' },
];

export default function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-50 safe-bottom">
      <div className="mx-4 mb-3 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl rounded-2xl shadow-sm border border-gray-200 dark:border-zinc-800">
        <div className="flex items-center justify-around px-3 py-2">
          {navItems.map(({ to, icon: Icon, label, isCreate }) => {
            const isActive = location.pathname === to;

            if (isCreate) {
              return (
                <NavLink key={to} to={to} className="flex flex-col items-center">
                  <motion.div
                    whileTap={{ scale: 0.88 }}
                    whileHover={{ scale: 1.05 }}
                    className="flex flex-col items-center gap-0.5"
                  >
                    <Icon className="w-6 h-6 text-gray-900 dark:text-white" strokeWidth={1.8} />
                    <span className="text-[10px] font-medium text-gray-900 dark:text-white">Create</span>
                  </motion.div>
                </NavLink>
              );
            }

            return (
              <NavLink
                key={to}
                to={to}
                className="flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl relative"
              >
                <motion.div whileTap={{ scale: 0.85 }} className="flex flex-col items-center gap-0.5">
                  <div className="relative">
                    <Icon
                      className={`w-6 h-6 transition-colors duration-200 ${
                        isActive
                          ? 'text-gray-900 dark:text-white'
                          : 'text-gray-400 dark:text-zinc-500'
                      }`}
                      strokeWidth={isActive ? 2.5 : 1.8}
                    />
                    {isActive && (
                      <motion.div
                        layoutId="nav-indicator"
                        className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-gray-900 dark:bg-white rounded-full"
                      />
                    )}
                  </div>
                  <span
                    className={`text-[10px] font-medium transition-colors duration-200 ${
                      isActive ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-zinc-500'
                    }`}
                  >
                    {label}
                  </span>
                </motion.div>
              </NavLink>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
