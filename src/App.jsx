import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import BottomNav from './components/Layout/BottomNav';
import Home from './pages/Home';
import Discover from './pages/Discover';
import Reels from './pages/Reels';
import Network from './pages/Network';
import Chat from './pages/Chat';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Signup from './pages/Signup';

const pageVariants = {
  initial: { opacity: 0, x: 12 },
  animate: { opacity: 1, x: 0, transition: { type: 'spring', damping: 24, stiffness: 280 } },
  exit: { opacity: 0, x: -12, transition: { duration: 0.15 } },
};

// ─── Protected Route ──────────────────────────────────────────────────────────
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    // Full-screen loader while verifying JWT
    return (
      <div className="flex items-center justify-center h-[100dvh] bg-[#FFF8F3] dark:bg-zinc-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 gradient-orange rounded-2xl flex items-center justify-center shadow-lg shadow-orange-400/30 animate-pulse">
            <span className="text-2xl">✦</span>
          </div>
          <p className="text-sm text-gray-400 dark:text-zinc-500 font-medium">Loading AURA...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  return children;
}

// ─── Guest Route (redirects logged-in users away from login/signup) ───────────
function GuestRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/" replace />;
  return children;
}

// ─── Animated App Shell ───────────────────────────────────────────────────────
function AnimatedRoutes() {
  const location = useLocation();
  const { user } = useAuth();
  const isAuthPage = ['/login', '/signup'].includes(location.pathname);

  return (
    <div className={`relative w-full ${isAuthPage ? '' : 'max-w-md mx-auto h-[100dvh] bg-[#FFF8F3] dark:bg-zinc-950 overflow-hidden flex flex-col'}`}>
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="flex-1 overflow-hidden flex flex-col"
        >
          <Routes location={location}>
            {/* Guest-only routes */}
            <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
            <Route path="/signup" element={<GuestRoute><Signup /></GuestRoute>} />

            {/* Protected routes */}
            <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
            <Route path="/discover" element={<ProtectedRoute><Discover /></ProtectedRoute>} />
            <Route path="/reels" element={<ProtectedRoute><Reels /></ProtectedRoute>} />
            <Route path="/network" element={<ProtectedRoute><Network /></ProtectedRoute>} />
            <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
            <Route path="/profile/:id" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to={user ? "/" : "/login"} replace />} />
          </Routes>
        </motion.div>
      </AnimatePresence>

      {/* Only show bottom nav when logged in and not on auth pages */}
      {user && !isAuthPage && <BottomNav />}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-rose-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 flex items-center justify-center">
            <AnimatedRoutes />
          </div>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
