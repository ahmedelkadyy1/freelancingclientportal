import React, { useState } from 'react';
import { AlertCircle, KeyRound, ChevronRight } from 'lucide-react';
import { User } from '../types';

interface AuthPanelProps {
  onLoginSuccess: (token: string, user: User) => void;
}

export default function AuthPanel({ onLoginSuccess }: AuthPanelProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (res.ok) {
        const data = await res.json();
        onLoginSuccess(data.token, data.user);
      } else {
        const err = await res.json();
        setError(err.error || 'Authentication rejected. Verify credentials.');
      }
    } catch {
      setError('Could not establish contact with Authentication server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="auth-panel-container" className="max-w-md mx-auto my-12 px-6 py-10 bg-white border border-slate-100 rounded-3xl shadow-xl transition-all">
      <div className="text-center mb-8">
        <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
          <KeyRound className="w-5 h-5" />
        </div>
        <h2 className="text-2xl font-display font-semibold tracking-tight text-slate-800">
          Client Workspace Gateway
        </h2>
        <p className="text-xs text-slate-400 mt-2 font-light">
          Authenticate session credentials to enter secure private project spaces, share file attachments, or coordinate revisions.
        </p>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-100 text-rose-800 p-4 rounded-xl text-xs mb-6 flex items-start gap-2.5 animate-shake">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-[10px] font-mono tracking-widest text-slate-400 uppercase mb-1.5">
            Registered Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@company.com"
            required
            className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:outline-brand-200 outline-none rounded-xl px-4 py-3 text-xs transition-colors"
          />
        </div>

        <div>
          <label className="block text-[10px] font-mono tracking-widest text-slate-400 uppercase mb-1.5">
            Security Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:outline-brand-200 outline-none rounded-xl px-4 py-3 text-xs transition-colors"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-slate-900 hover:bg-slate-800 text-white font-mono text-xs uppercase py-3.5 px-4 rounded-xl transition-all tracking-wider flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {loading ? 'Entering Workspace...' : 'Authenticate Credentials'}
          <ChevronRight className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
