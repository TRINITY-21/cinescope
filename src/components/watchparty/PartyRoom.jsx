import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import ChatSidebar from './ChatSidebar';
import FloatingReactions from './FloatingReactions';
import QueuePanel from './QueuePanel';

const SIDEBAR_TABS = [
  { id: 'chat', label: 'Chat' },
  { id: 'queue', label: 'Queue' },
];

export default function PartyRoom({ party }) {
  const {
    role, roomCode, localStream, remoteStream, participants,
    messages, sendMessage, leaveParty,
    reactions, sendReaction,
    queue, addToQueue, voteOnQueue, removeFromQueue,
  } = party;

  const videoRef = useRef(null);
  const [copied, setCopied] = useState(false);
  const [mobilePanel, setMobilePanel] = useState(null); // null | 'chat' | 'queue'
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarTab, setSidebarTab] = useState('chat');

  useEffect(() => {
    function check() { setIsMobile(window.innerWidth < 768); }
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const stream = role === 'host' ? localStream : remoteStream;
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  function copyCode() {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const viewerCount = 1 + participants.length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 bg-bg-primary flex flex-col"
    >
      <div className="flex-1 flex flex-col md:flex-row min-h-0">
        {/* Video area */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 flex items-center justify-center bg-black p-2 sm:p-4 min-h-0">
            <div className="relative w-full h-full max-h-full flex items-center justify-center">
              {stream ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted={role === 'host'}
                  className="max-w-full max-h-full rounded-lg object-contain"
                />
              ) : (
                <div className="flex flex-col items-center gap-4 text-text-secondary">
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                    <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" className="animate-pulse">
                      <path d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                  </div>
                  <p className="text-sm">Waiting for host to share screen...</p>
                </div>
              )}

              {/* Host badge */}
              {role === 'host' && stream && (
                <div className="absolute top-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-sm border border-white/10">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-xs text-white font-medium">Sharing your screen</span>
                </div>
              )}

              {/* Floating reactions overlay + emoji bar */}
              <FloatingReactions reactions={reactions} onReact={sendReaction} />
            </div>
          </div>

          {/* Info bar */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/5 bg-bg-secondary/50">
            <div className="flex items-center gap-4">
              <button
                onClick={copyCode}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-bg-elevated border border-white/10 hover:border-accent-violet/30 transition-all group"
              >
                <span className="text-xs text-text-secondary">Room</span>
                <span className="font-mono font-bold text-sm text-white tracking-widest">{roomCode}</span>
                {copied ? (
                  <svg width="14" height="14" fill="none" stroke="#4ade80" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                ) : (
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="text-text-muted group-hover:text-text-secondary transition-colors">
                    <rect x="9" y="9" width="13" height="13" rx="2" />
                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                  </svg>
                )}
              </button>

              <div className="flex items-center gap-1.5 text-text-secondary">
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </svg>
                <span className="text-xs font-medium">{viewerCount} watching</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Mobile panel toggles */}
              {isMobile && (
                <>
                  <button
                    onClick={() => setMobilePanel('chat')}
                    className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-bg-elevated border border-white/10 hover:border-accent-violet/30 text-text-secondary hover:text-white transition-all"
                  >
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                    </svg>
                    <span className="text-xs">Chat</span>
                  </button>
                  <button
                    onClick={() => setMobilePanel('queue')}
                    className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-bg-elevated border border-white/10 hover:border-accent-gold/30 text-text-secondary hover:text-white transition-all"
                  >
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
                    </svg>
                    <span className="text-xs">Queue</span>
                    {queue.length > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-accent-gold text-bg-primary text-[9px] font-bold flex items-center justify-center">
                        {queue.length}
                      </span>
                    )}
                  </button>
                </>
              )}

              <button
                onClick={leaveParty}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent-red/10 border border-accent-red/20 text-accent-red hover:bg-accent-red/20 transition-all text-sm font-medium"
              >
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                </svg>
                Leave
              </button>
            </div>
          </div>
        </div>

        {/* Desktop sidebar with tabs */}
        {!isMobile && (
          <div className="w-[360px] flex-shrink-0 flex flex-col h-full bg-bg-secondary/50 backdrop-blur-xl border-l border-white/5">
            {/* Tab header */}
            <div className="flex border-b border-white/5">
              {SIDEBAR_TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSidebarTab(tab.id)}
                  className={`flex-1 relative py-3 text-xs font-semibold transition-colors ${
                    sidebarTab === tab.id ? 'text-white' : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <span className="flex items-center justify-center gap-1.5">
                    {tab.label}
                    {tab.id === 'queue' && queue.length > 0 && (
                      <span className="w-4 h-4 rounded-full bg-accent-gold/20 text-accent-gold text-[9px] font-bold flex items-center justify-center">
                        {queue.length}
                      </span>
                    )}
                  </span>
                  {sidebarTab === tab.id && (
                    <motion.span
                      layoutId="sidebar-tab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-accent-violet to-accent-gold"
                    />
                  )}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="flex-1 min-h-0">
              {sidebarTab === 'chat' && (
                <ChatSidebar
                  messages={messages}
                  onSend={sendMessage}
                  role={role}
                  isOpen={true}
                  onClose={() => {}}
                  isMobile={false}
                />
              )}
              {sidebarTab === 'queue' && (
                <QueuePanel
                  queue={queue}
                  onAdd={addToQueue}
                  onVote={voteOnQueue}
                  onRemove={removeFromQueue}
                  role={role}
                />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Mobile chat overlay */}
      {isMobile && (
        <ChatSidebar
          messages={messages}
          onSend={sendMessage}
          role={role}
          isOpen={mobilePanel === 'chat'}
          onClose={() => setMobilePanel(null)}
          isMobile={true}
        />
      )}

      {/* Mobile queue overlay */}
      {isMobile && mobilePanel === 'queue' && (
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed inset-x-0 bottom-0 z-50 h-[65vh] bg-bg-secondary/95 backdrop-blur-2xl border-t border-white/10 rounded-t-2xl"
        >
          <div className="flex justify-center pt-2 pb-1">
            <div className="w-10 h-1 rounded-full bg-white/20" />
          </div>
          <div className="flex items-center justify-between px-4 py-2 border-b border-white/5">
            <h3 className="text-sm font-semibold text-white">Up Next</h3>
            <button onClick={() => setMobilePanel(null)} className="text-text-secondary hover:text-white transition-colors">
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="h-[calc(65vh-4rem)] overflow-hidden">
            <QueuePanel
              queue={queue}
              onAdd={addToQueue}
              onVote={voteOnQueue}
              onRemove={removeFromQueue}
              role={role}
            />
          </div>
        </motion.div>
      )}

      {/* Mobile queue backdrop */}
      {isMobile && mobilePanel === 'queue' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setMobilePanel(null)}
        />
      )}
    </motion.div>
  );
}
