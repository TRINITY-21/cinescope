import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { formatDistanceToNowStrict } from 'date-fns';

export default function ChatSidebar({ messages, onSend, role, isOpen, onClose, isMobile }) {
  const [draft, setDraft] = useState('');
  const listRef = useRef(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  function handleSubmit(e) {
    e.preventDefault();
    if (!draft.trim()) return;
    onSend(draft);
    setDraft('');
  }

  const chatContent = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <h3 className="text-sm font-semibold text-white">Live Chat</h3>
        {isMobile && (
          <button onClick={onClose} className="text-text-secondary hover:text-white transition-colors">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Messages */}
      <div ref={listRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-2 scrollbar-thin">
        {messages.length === 0 && (
          <p className="text-center text-text-muted text-xs mt-8">No messages yet. Say hi!</p>
        )}
        {messages.map((msg) => {
          if (msg.type === 'system') {
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-1"
              >
                <span className="text-[11px] text-text-muted italic">{msg.text}</span>
              </motion.div>
            );
          }

          const isMyMessage = role === msg.senderRole;

          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15 }}
              className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] px-3 py-2 rounded-xl text-sm ${
                  isMyMessage
                    ? 'bg-accent-violet/15 border border-accent-violet/20 text-white'
                    : 'bg-bg-elevated border border-white/5 text-text-primary'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-[11px] font-semibold text-text-secondary">{msg.sender}</span>
                  {msg.senderRole === 'host' && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-accent-gold/20 text-accent-gold font-bold uppercase tracking-wide">
                      Host
                    </span>
                  )}
                </div>
                <p className="break-words">{msg.text}</p>
                <span className="text-[10px] text-text-muted mt-1 block">
                  {formatDistanceToNowStrict(msg.timestamp, { addSuffix: true })}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex gap-2 p-3 border-t border-white/5">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Type a message..."
          maxLength={500}
          className="flex-1 bg-bg-elevated border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-text-muted focus:outline-none focus:border-accent-violet/50 transition-colors"
        />
        <button
          type="submit"
          disabled={!draft.trim()}
          className="px-3 py-2 rounded-lg bg-accent-violet/20 border border-accent-violet/30 text-accent-violet hover:bg-accent-violet/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
          </svg>
        </button>
      </form>
    </div>
  );

  // Mobile: bottom sheet overlay
  if (isMobile) {
    return (
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
              onClick={onClose}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-x-0 bottom-0 z-50 h-[65vh] bg-bg-secondary/95 backdrop-blur-2xl border-t border-white/10 rounded-t-2xl"
            >
              {/* Drag handle */}
              <div className="flex justify-center pt-2 pb-1">
                <div className="w-10 h-1 rounded-full bg-white/20" />
              </div>
              {chatContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  }

  // Desktop: static sidebar
  return (
    <div className="h-full bg-bg-secondary/50 backdrop-blur-xl border-l border-white/5 rounded-r-xl overflow-hidden">
      {chatContent}
    </div>
  );
}
