import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from './Modal';

const shortcuts = [
  { keys: ['/', 'Ctrl+K'], action: 'Open search' },
  { keys: ['H'], action: 'Go to Home' },
  { keys: ['S'], action: 'Go to Schedule' },
  { keys: ['B'], action: 'Go to Browse' },
  { keys: ['D'], action: 'Go to Discover' },
  { keys: ['T'], action: 'Go to Stats' },
  { keys: ['?'], action: 'Show shortcuts' },
  { keys: ['Esc'], action: 'Close overlay' },
];

export default function KeyboardShortcuts({ onOpenSearch }) {
  const [showHelp, setShowHelp] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return;
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); onOpenSearch?.(); return; }
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      switch (e.key) {
        case '/': e.preventDefault(); onOpenSearch?.(); break;
        case 'h': navigate('/'); break;
        case 's': navigate('/schedule'); break;
        case 'b': navigate('/browse'); break;
        case 'd': navigate('/discover'); break;
        case 't': navigate('/stats'); break;
        case '?': setShowHelp(true); break;
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate, onOpenSearch]);

  return (
    <Modal isOpen={showHelp} onClose={() => setShowHelp(false)} size="sm">
      <div className="p-6">
        <h2 className="text-xl font-bold text-white mb-4">Keyboard Shortcuts</h2>
        <div className="space-y-3">
          {shortcuts.map((s, i) => (
            <div key={i} className="flex items-center justify-between">
              <span className="text-sm text-text-secondary">{s.action}</span>
              <div className="flex gap-1">
                {s.keys.map((key) => (
                  <kbd key={key} className="px-2 py-1 rounded-md bg-bg-primary border border-white/10 text-xs font-mono text-white min-w-[28px] text-center">{key}</kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-text-muted mt-4 text-center">Press ? anytime to show this</p>
      </div>
    </Modal>
  );
}
