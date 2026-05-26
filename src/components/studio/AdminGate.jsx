import { useEffect, useState } from 'react';
import Button from '../ui/Button';

export default function AdminGate({ children }) {
  const [status, setStatus] = useState('checking'); // 'checking' | 'gated' | 'authed'
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/admin-auth', { credentials: 'same-origin' });
        if (cancelled) return;
        if (res.status === 503) {
          // Auth not configured on the server — leave the studio open so dev
          // mode still works. Set ADMIN_PASSWORD + ADMIN_SESSION_SECRET in
          // your hosting env to enable protection.
          setStatus('authed');
          return;
        }
        const data = await res.json().catch(() => ({}));
        setStatus(data.authed ? 'authed' : 'gated');
      } catch {
        if (!cancelled) setStatus('gated');
      }
    })();
    return () => { cancelled = true; };
  }, []);

  async function submit(e) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/admin-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        setStatus('authed');
        setPassword('');
      } else if (res.status === 503) {
        setError('Admin auth not configured on server');
      } else {
        setError('Wrong password');
      }
    } catch {
      setError('Network error — try again');
    } finally {
      setSubmitting(false);
    }
  }

  if (status === 'checking') {
    return (
      <div className="min-h-[70vh] flex items-center justify-center text-text-secondary text-sm">
        Checking access…
      </div>
    );
  }

  if (status === 'authed') return children;

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <form
        onSubmit={submit}
        className="w-full max-w-md rounded-2xl border border-white/10 bg-bg-elevated p-8 shadow-elevation-3"
      >
        <div className="text-3xl mb-2">🎬</div>
        <h1 className="text-xl font-bold text-text-primary mb-1">Content Studio</h1>
        <p className="text-sm text-text-secondary mb-6">Enter the admin password to create shorts.</p>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full rounded-lg border border-white/10 bg-bg-primary px-4 py-3 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-peach mb-3"
          autoFocus
        />
        {error && <p className="text-sm text-accent-red mb-3">{error}</p>}
        <Button type="submit" className="w-full" disabled={!password.trim() || submitting}>
          {submitting ? 'Checking…' : 'Unlock Studio'}
        </Button>
      </form>
    </div>
  );
}
