import { motion } from 'framer-motion';

export default function TabGroup({ tabs, activeTab, onChange }) {
  return (
    <div className="relative">
      <div
        aria-hidden
        className="pointer-events-none absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-bg-primary to-transparent z-10 md:hidden"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-bg-primary to-transparent z-10 md:hidden"
      />
      <div className="flex gap-1 border-b border-white/10 overflow-x-auto hide-scrollbar scroll-x-track">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`relative px-5 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.id ? 'text-white' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <motion.div
                layoutId="tab-underline"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-accent-peach to-accent-gold rounded-full"
                style={{ boxShadow: '0 2px 10px rgba(196,131,91,0.2)' }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
