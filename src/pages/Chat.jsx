import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { Phone, Video, Smile, Send, ArrowLeft, Loader, Users } from 'lucide-react';
import { io } from 'socket.io-client';
import { chatUser, initialMessages } from '../data/mockData';
import { useAuth } from '../context/AuthContext';
import ChatBubble from '../components/Chat/ChatBubble';
import VideoCallModal from '../components/Chat/VideoCallModal';
import Avatar from '../components/UI/Avatar';
import api from '../lib/api';

const EMOJIS = ['😊', '❤️', '🔥', '✨', '😂', '🎉', '🙌', '💫', '🌸', '🌊'];

function formatTime() {
  const d = new Date();
  let h = d.getHours(), m = d.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m.toString().padStart(2, '0')} ${ampm}`;
}

export default function Chat() {
  const { user } = useAuth();
  const location = useLocation();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [input, setInput] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const bottomRef = useRef(null);

  const [showList, setShowList] = useState(!location.state?.receiverId);
  const [connections, setConnections] = useState([]);
  const [socket, setSocket] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const [isCalling, setIsCalling] = useState(false);
  const [activeChat, setActiveChat] = useState({
    receiverId: location.state?.receiverId || 'mock-luna',
    receiverName: location.state?.receiverName || chatUser.name,
    receiverAvatar: location.state?.receiverAvatar || chatUser.avatarUrl,
    receiverIsOnline: location.state?.isOnline ?? chatUser.isOnline,
  });

  // Socket Connection
  useEffect(() => {
    if (!user) return;
    const backendUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:5000';
    const newSocket = io(backendUrl);
    setSocket(newSocket);

    newSocket.emit('join', user._id);

    newSocket.on('receiveMessage', (message) => {
      setMessages(prev => [...prev, message]);
    });

    newSocket.on('callUser', (data) => {
      setIncomingCall(data);
    });

    return () => newSocket.close();
  }, [user]);

  useEffect(() => {
    if (showList) {
      api.get('/users/network').then(res => setConnections(res.data.connections || []));
    }
  }, [showList]);

  // Load messages from backend on mount
  useEffect(() => {
    if (!showList) {
      fetchMessages();
    }
  }, [activeChat.receiverId, showList]);

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/messages/${activeChat.receiverId}`);
      if (res.data.messages.length === 0) {
        setMessages(initialMessages);
      } else {
        setMessages(res.data.messages);
      }
    } catch {
      setMessages(initialMessages);
      console.warn('Chat: Using local fallback data. Start the backend server.');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || sending) return;

    // Optimistic update
    const optimistic = {
      id: `temp-${Date.now()}`,
      text,
      isSender: true,
      time: formatTime(),
    };
    setMessages(prev => [...prev, optimistic]);
    setInput('');
    setShowEmoji(false);
    setSending(true);

    try {
      // Save to backend
      const res = await api.post('/messages', {
        receiverId: activeChat.receiverId,
        receiverName: activeChat.receiverName,
        receiverAvatar: activeChat.receiverAvatar,
        text,
      });

      // Emit real-time message via socket
      if (socket) {
        socket.emit('sendMessage', {
          receiverId: activeChat.receiverId,
          message: {
            ...res.data.message,
            isSender: false // For the receiver, this is false
          }
        });
      }
    } catch (err) {
      console.warn('Message not saved to DB (backend may be offline).');
    } finally {
      setSending(false);
    }
  };

  if (showList) {
    return (
      <div className="flex flex-col h-full bg-[#FFF8F3] dark:bg-zinc-950">
        <header className="sticky top-0 z-30 bg-[#FFF8F3]/90 dark:bg-zinc-950/90 backdrop-blur-xl px-5 pt-5 pb-4 border-b border-orange-100/50 dark:border-zinc-800">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Messages</h1>
        </header>
        <main className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {connections.length === 0 ? (
            <div className="text-center py-16">
              <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">No connections yet to chat with.</p>
            </div>
          ) : (
            connections.map(c => (
              <motion.div key={c.id} whileTap={{ scale: 0.98 }} onClick={() => {
                setActiveChat({ receiverId: c.id, receiverName: c.name, receiverAvatar: c.avatar, receiverIsOnline: true });
                setShowList(false);
              }} className="flex items-center gap-3 p-3 bg-white dark:bg-zinc-900 rounded-2xl border border-orange-50 dark:border-zinc-800 cursor-pointer shadow-sm">
                <Avatar src={c.avatar} name={c.name} size="sm" />
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">{c.name}</p>
                  <p className="text-xs text-gray-400">Tap to start chatting</p>
                </div>
              </motion.div>
            ))
          )}
          {/* Mock fallback user */}
          <motion.div whileTap={{ scale: 0.98 }} onClick={() => {
            setActiveChat({ receiverId: 'mock-luna', receiverName: 'Luna Spark', receiverAvatar: '', receiverIsOnline: true });
            setShowList(false);
          }} className="flex items-center gap-3 p-3 bg-white dark:bg-zinc-900 rounded-2xl border border-orange-50 dark:border-zinc-800 cursor-pointer shadow-sm mt-4 opacity-70">
            <Avatar src="" name="Luna Spark" size="sm" />
            <div>
              <p className="font-semibold text-gray-900 dark:text-white text-sm">Luna Spark (Mock)</p>
              <p className="text-xs text-gray-400">AI Demo Conversation</p>
            </div>
          </motion.div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#FFF8F3] dark:bg-zinc-950">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border-b border-gray-100 dark:border-zinc-800 px-4 py-3">
        <div className="flex items-center gap-3">
          <motion.button onClick={() => setShowList(true)} whileTap={{ scale: 0.88 }} className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800">
            <ArrowLeft className="w-5 h-5" />
          </motion.button>
          <Avatar src={activeChat.receiverAvatar} name={activeChat.receiverName} size="sm" online={activeChat.receiverIsOnline} />
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-900 dark:text-white text-sm leading-tight">{activeChat.receiverName}</p>
            <p className="text-xs text-green-500 font-medium">{activeChat.receiverIsOnline ? 'Active now' : 'Offline'}</p>
          </div>
          <div className="flex items-center gap-1">
            <motion.button onClick={() => setIsCalling(true)} whileTap={{ scale: 0.88 }} className="w-9 h-9 rounded-xl bg-orange-50 dark:bg-zinc-800 flex items-center justify-center border border-orange-100 dark:border-zinc-700">
              <Phone className="w-4 h-4 text-orange-500" />
            </motion.button>
            <motion.button onClick={() => setIsCalling(true)} whileTap={{ scale: 0.88 }} className="w-9 h-9 rounded-xl bg-orange-50 dark:bg-zinc-800 flex items-center justify-center border border-orange-100 dark:border-zinc-700">
              <Video className="w-4 h-4 text-orange-500" />
            </motion.button>
          </div>
        </div>
      </header>

      {/* WebRTC Video Call Modal */}
      {(isCalling || incomingCall) && socket && (
        <VideoCallModal 
          isOpen={isCalling} 
          incomingCall={incomingCall}
          socket={socket} 
          user={user} 
          receiverId={activeChat.receiverId} 
          receiverName={activeChat.receiverName}
          onEndCall={() => { setIsCalling(false); setIncomingCall(null); }}
        />
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto scrollbar-hide px-4 py-4">
        {/* Date separator */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-gray-100 dark:bg-zinc-800" />
          <span className="text-xs text-gray-400 dark:text-zinc-600 font-medium px-2">Today</span>
          <div className="flex-1 h-px bg-gray-100 dark:bg-zinc-800" />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader className="w-6 h-6 text-orange-400 animate-spin" />
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map(msg => (
              <ChatBubble key={msg.id} message={msg} />
            ))}
          </AnimatePresence>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Emoji picker */}
      <AnimatePresence>
        {showEmoji && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden bg-white dark:bg-zinc-900 border-t border-gray-100 dark:border-zinc-800"
          >
            <div className="flex gap-3 px-5 py-3 flex-wrap">
              {EMOJIS.map(e => (
                <motion.button key={e} whileTap={{ scale: 0.8 }}
                  onClick={() => setInput(prev => prev + e)}
                  className="text-2xl hover:scale-110 transition-transform"
                >{e}</motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input bar */}
      <div className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border-t border-gray-100 dark:border-zinc-800 px-4 py-3">
        <div className="flex items-center gap-2">
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={() => setShowEmoji(s => !s)}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${showEmoji ? 'gradient-orange shadow-md shadow-orange-400/25' : 'bg-gray-100 dark:bg-zinc-800'}`}
          >
            <Smile className={`w-5 h-5 ${showEmoji ? 'text-white' : 'text-gray-500 dark:text-zinc-400'}`} />
          </motion.button>

          <div className="flex-1 flex items-center bg-gray-50 dark:bg-zinc-800 rounded-2xl px-4 py-2.5 border border-gray-100 dark:border-zinc-700">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder="Type a message..."
              className="flex-1 bg-transparent text-sm text-gray-700 dark:text-zinc-300 placeholder-gray-300 dark:placeholder-zinc-600 outline-none"
            />
          </div>

          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={sendMessage}
            disabled={!input.trim() || sending}
            className="w-10 h-10 gradient-orange rounded-xl flex items-center justify-center shadow-md shadow-orange-400/25 disabled:opacity-40 transition-all"
          >
            {sending
              ? <Loader className="w-4 h-4 text-white animate-spin" />
              : <Send className="w-4 h-4 text-white" />
            }
          </motion.button>
        </div>
      </div>
    </div>
  );
}
