import { AnimatePresence, motion } from 'framer-motion';

const EMOJI_OPTIONS = ['😂', '🔥', '❤️', '😮', '👏', '😢', '🎉', '💀'];

export default function FloatingReactions({ reactions, onReact }) {
  return (
    <>
      {/* Floating emojis overlay */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
        <AnimatePresence>
          {reactions.map((r) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 1, y: 0, scale: 0.5 }}
              animate={{ opacity: 0, y: -300, scale: 1.4 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2.8, ease: 'easeOut' }}
              className="absolute bottom-16 text-4xl select-none"
              style={{ left: `${r.x}%` }}
            >
              {r.emoji}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Reaction bar */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20">
        <div className="flex items-center gap-1 px-2 py-1.5 rounded-full bg-black/50 backdrop-blur-md border border-white/10">
          {EMOJI_OPTIONS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => onReact(emoji)}
              className="w-9 h-9 rounded-full flex items-center justify-center text-xl hover:bg-white/15 hover:scale-125 active:scale-95 transition-all"
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
