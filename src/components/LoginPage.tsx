'use client';

import { useState } from 'react';

interface LoginPageProps {
  onLogin: () => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (res.ok) {
        onLogin();
      } else {
        setError('Invalid credentials');
      }
    } catch {
      setError('Connection failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#58a6ff] to-[#bc8cff] mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[#f0f6fc]">Cloud360</h1>
          <p className="text-[#8b949e] mt-1">Admin Dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-[#161b22] border border-[#30363d] rounded-xl p-8">
          <div className="mb-5">
            <label className="block text-sm text-[#8b949e] mb-2">Username</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-4 py-3 text-[#f0f6fc] placeholder-[#484f58] focus:outline-none focus:border-[#58a6ff] transition-colors"
              placeholder="Enter username"
              autoFocus
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm text-[#8b949e] mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-4 py-3 text-[#f0f6fc] placeholder-[#484f58] focus:outline-none focus:border-[#58a6ff] transition-colors"
              placeholder="Enter password"
            />
          </div>

          {error && (
            <div className="mb-4 p-3 bg-[#f8514915] border border-[#f8514944] rounded-lg text-[#f85149] text-sm text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !username || !password}
            className="w-full bg-[#238636] hover:bg-[#2ea043] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full spin-slow" />
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <p className="text-center text-[#484f58] text-xs mt-6">
          Cloud360 Infrastructure Management
        </p>
      </div>
    </div>
  );
}
