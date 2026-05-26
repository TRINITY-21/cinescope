import { motion } from 'framer-motion';
import { useRef, useState } from 'react';
import Container from '../components/ui/Container';
import { useToast } from '../context/ToastContext';
import PageLayout from '../layouts/PageLayout';
import {
  clearUserData,
  downloadUserData,
  importUserData,
  summarizeUserData,
} from '../utils/userData';

export default function SettingsPage() {
  const { toast } = useToast();
  const fileInputRef = useRef(null);
  const [summary, setSummary] = useState(() => summarizeUserData());
  const [importing, setImporting] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  function handleExport() {
    try {
      downloadUserData();
      toast({ message: 'Backup downloaded', variant: 'success' });
    } catch {
      toast({ message: 'Could not generate backup', variant: 'error' });
    }
  }

  function handleImportClick(mode) {
    fileInputRef.current.dataset.mode = mode;
    fileInputRef.current.value = '';
    fileInputRef.current.click();
  }

  async function handleFileChosen(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const mode = e.target.dataset.mode || 'merge';
    setImporting(true);
    try {
      const text = await file.text();
      const payload = JSON.parse(text);
      const result = importUserData(payload, { mode });
      if (result.ok) {
        toast({
          message: `Restored ${result.restoredKeys.length} data sets · Reloading…`,
          variant: 'success',
        });
        // Brief delay so the user sees the toast before reload.
        setTimeout(() => window.location.reload(), 800);
      } else {
        toast({ message: result.error || 'Import failed', variant: 'error' });
      }
    } catch (err) {
      toast({ message: 'That file isn\'t valid JSON', variant: 'error' });
    } finally {
      setImporting(false);
    }
  }

  function handleClear() {
    if (!confirmClear) {
      setConfirmClear(true);
      setTimeout(() => setConfirmClear(false), 4000);
      return;
    }
    clearUserData();
    toast({ message: 'All data cleared · Reloading…', variant: 'info' });
    setTimeout(() => window.location.reload(), 800);
  }

  const summaryItems = [
    { key: 'shows', label: 'Shows', value: summary.shows },
    { key: 'movies', label: 'Movies', value: summary.movies },
    { key: 'episodes', label: 'Episodes', value: summary.episodes },
    { key: 'collections', label: 'Collections', value: summary.collections },
    { key: 'ratings', label: 'Ratings', value: summary.ratings },
    { key: 'history', label: 'History entries', value: summary.historyEntries },
  ];

  return (
    <PageLayout as={motion.div} initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}>
      <Container>
        <div className="max-w-3xl mx-auto">
          <header className="mb-section">
            <h1 className="text-h1 sm:text-display-sm font-extrabold text-white tracking-tight">Settings</h1>
            <p className="text-body-sm text-text-secondary mt-2">
              Back up your library, restore from a previous backup, or wipe everything.
            </p>
          </header>

          {/* Library summary */}
          <section className="mb-section">
            <h2 className="text-meta uppercase text-text-muted mb-3 font-semibold">Your library</h2>
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-card">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-card">
                {summaryItems.map((item) => (
                  <div key={item.key}>
                    <p className="text-meta text-text-muted">{item.label}</p>
                    <p
                      className="text-h2 font-semibold text-white mt-1"
                      data-testid={`summary-${item.key}`}
                    >
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setSummary(summarizeUserData())}
                className="text-caption text-text-muted hover:text-accent-peach transition-colors mt-card"
              >
                Refresh counts
              </button>
            </div>
          </section>

          {/* Backup */}
          <section className="mb-section">
            <h2 className="text-meta uppercase text-text-muted mb-3 font-semibold">Backup</h2>
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-card space-y-4">
              <div>
                <h3 className="text-body font-semibold text-white">Export your data</h3>
                <p className="text-body-sm text-text-secondary mt-1">
                  Download a JSON file containing your watchlist, ratings, episode progress, collections, and stats.
                  Keep it somewhere safe — this is your only backup.
                </p>
              </div>
              <button
                type="button"
                onClick={handleExport}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-accent-peach text-white text-body-sm font-semibold hover:bg-accent-peach/90 transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Download backup
              </button>
            </div>
          </section>

          {/* Restore */}
          <section className="mb-section">
            <h2 className="text-meta uppercase text-text-muted mb-3 font-semibold">Restore</h2>
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-card space-y-4">
              <div>
                <h3 className="text-body font-semibold text-white">Import from a backup file</h3>
                <p className="text-body-sm text-text-secondary mt-1">
                  Choose how you want to bring data back. <span className="text-text-primary">Merge</span> keeps your current items and adds missing ones from the backup.
                  <span className="text-text-primary"> Replace</span> wipes your current data and uses only what's in the backup.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => handleImportClick('merge')}
                  disabled={importing}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white/[0.06] border border-white/[0.10] text-white text-body-sm font-medium hover:bg-white/[0.10] transition-colors disabled:opacity-50"
                >
                  Merge from file
                </button>
                <button
                  type="button"
                  onClick={() => handleImportClick('replace')}
                  disabled={importing}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-accent-red/15 border border-accent-red/30 text-accent-red text-body-sm font-medium hover:bg-accent-red/25 transition-colors disabled:opacity-50"
                >
                  Replace with file
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json,.json"
                onChange={handleFileChosen}
                className="hidden"
                aria-hidden="true"
              />
            </div>
          </section>

          {/* Danger zone */}
          <section>
            <h2 className="text-meta uppercase text-accent-red/80 mb-3 font-semibold">Danger zone</h2>
            <div className="rounded-2xl border border-accent-red/20 bg-accent-red/[0.04] p-card">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex-1 min-w-[200px]">
                  <h3 className="text-body font-semibold text-white">Clear all data</h3>
                  <p className="text-body-sm text-text-secondary mt-1">
                    Wipes your entire library on this device. Export a backup first if you want to keep it.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleClear}
                  className={`px-5 py-2.5 rounded-lg text-body-sm font-semibold transition-colors ${
                    confirmClear
                      ? 'bg-accent-red text-white hover:bg-accent-red/90'
                      : 'bg-accent-red/15 border border-accent-red/30 text-accent-red hover:bg-accent-red/25'
                  }`}
                >
                  {confirmClear ? 'Click again to confirm' : 'Clear data'}
                </button>
              </div>
            </div>
          </section>
        </div>
      </Container>
    </PageLayout>
  );
}
