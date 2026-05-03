import { useEffect, useRef, useState } from 'react';
import Peer from 'simple-peer';
import { PhoneOff, Phone, Video } from 'lucide-react';
import { motion } from 'framer-motion';

export default function VideoCallModal({ isOpen, socket, user, receiverId, receiverName, incomingCall, onEndCall }) {
  const [stream, setStream] = useState(null);
  const [callAccepted, setCallAccepted] = useState(false);
  const [callEnded, setCallEnded] = useState(false);
  const [receivingCall, setReceivingCall] = useState(false);
  const [caller, setCaller] = useState('');
  const [callerName, setCallerName] = useState('');
  const [callerSignal, setCallerSignal] = useState(null);

  const myVideo = useRef(null);
  const userVideo = useRef(null);
  const connectionRef = useRef(null);

  useEffect(() => {
    if (isOpen || incomingCall) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then((currentStream) => {
          setStream(currentStream);
          if (myVideo.current) myVideo.current.srcObject = currentStream;
        })
        .catch(err => console.log('Media error:', err));
    } else {
      // Cleanup stream when closed
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
    }
  }, [isOpen, incomingCall]);

  useEffect(() => {
    if (incomingCall) {
      setReceivingCall(true);
      setCaller(incomingCall.from);
      setCallerName(incomingCall.name);
      setCallerSignal(incomingCall.signal);
    }
  }, [incomingCall]);

  const callUser = () => {
    const peer = new Peer({ initiator: true, trickle: false, stream });

    peer.on('signal', (data) => {
      socket.emit('callUser', { userToCall: receiverId, signalData: data, from: user._id, name: user.name });
    });

    peer.on('stream', (currentStream) => {
      if (userVideo.current) userVideo.current.srcObject = currentStream;
    });

    socket.on('callAccepted', (signal) => {
      setCallAccepted(true);
      peer.signal(signal);
    });

    connectionRef.current = peer;
  };

  const answerCall = () => {
    setCallAccepted(true);
    const peer = new Peer({ initiator: false, trickle: false, stream });

    peer.on('signal', (data) => {
      socket.emit('answerCall', { signal: data, to: caller });
    });

    peer.on('stream', (currentStream) => {
      if (userVideo.current) userVideo.current.srcObject = currentStream;
    });

    peer.signal(callerSignal);
    connectionRef.current = peer;
  };

  const leaveCall = () => {
    setCallEnded(true);
    if (connectionRef.current) connectionRef.current.destroy();
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    onEndCall();
  };

  if (!isOpen && !incomingCall) return null;

  return (
    <div className="fixed inset-0 bg-black/90 z-[100] flex flex-col items-center justify-center p-5">
      <div className="relative w-full max-w-md aspect-[3/4] bg-zinc-900 rounded-3xl overflow-hidden shadow-2xl">
        {/* Remote Video */}
        {callAccepted && !callEnded ? (
          <video playsInline ref={userVideo} autoPlay className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-white">
            <Video className="w-16 h-16 mb-4 opacity-50" />
            <p className="text-xl font-bold">{receivingCall && !callAccepted ? `${callerName} is calling...` : `Calling ${receiverName}...`}</p>
          </div>
        )}

        {/* Local Video */}
        {stream && (
          <div className="absolute top-4 right-4 w-28 h-40 bg-black rounded-xl overflow-hidden border-2 border-white/20 shadow-lg">
            <video playsInline muted ref={myVideo} autoPlay className="w-full h-full object-cover" />
          </div>
        )}

        {/* Controls */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-6">
          {receivingCall && !callAccepted ? (
            <motion.button whileTap={{ scale: 0.9 }} onClick={answerCall} className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/30">
              <Phone className="w-7 h-7 text-white" />
            </motion.button>
          ) : !callAccepted && (
            <motion.button whileTap={{ scale: 0.9 }} onClick={callUser} className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/30">
              <Phone className="w-7 h-7 text-white" />
            </motion.button>
          )}

          <motion.button whileTap={{ scale: 0.9 }} onClick={leaveCall} className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center shadow-lg shadow-red-500/30">
            <PhoneOff className="w-7 h-7 text-white" />
          </motion.button>
        </div>
      </div>
    </div>
  );
}
