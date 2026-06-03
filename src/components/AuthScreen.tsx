import { useState } from 'react';
import { useAuth } from '../auth';
import './auth.css';

export function AuthScreen() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const switchMode = (m: 'login' | 'register') => {
    setMode(m);
    setError('');
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    const res =
      mode === 'login'
        ? await login(email, password)
        : await register(name, email, password);
    setBusy(false);
    if (!res.ok) setError(res.error);
    // On success the store flips currentUserId and App swaps to the workspace.
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-logo">N</div>
          <div className="auth-brand-text">
            <div className="auth-brand-name">My Workspace</div>
            <div className="auth-brand-sub">Your notes, organized.</div>
          </div>
        </div>

        <div className="auth-tabs">
          <button
            className={`auth-tab ${mode === 'login' ? 'auth-tab--active' : ''}`}
            onClick={() => switchMode('login')}
            type="button"
          >
            Sign in
          </button>
          <button
            className={`auth-tab ${mode === 'register' ? 'auth-tab--active' : ''}`}
            onClick={() => switchMode('register')}
            type="button"
          >
            Create account
          </button>
        </div>

        <form className="auth-form" onSubmit={submit}>
          {mode === 'register' && (
            <label className="auth-field">
              <span className="auth-label">Name</span>
              <input
                className="auth-input"
                type="text"
                placeholder="Jane Doe"
                value={name}
                autoComplete="name"
                onChange={(e) => setName(e.target.value)}
              />
            </label>
          )}

          <label className="auth-field">
            <span className="auth-label">Email</span>
            <input
              className="auth-input"
              type="email"
              placeholder="you@example.com"
              value={email}
              autoComplete="email"
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>

          <label className="auth-field">
            <span className="auth-label">Password</span>
            <input
              className="auth-input"
              type="password"
              placeholder={mode === 'register' ? 'At least 6 characters' : '••••••••'}
              value={password}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>

          {error && <div className="auth-error">{error}</div>}

          <button className="auth-submit" type="submit" disabled={busy}>
            {busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <div className="auth-foot">
          {mode === 'login' ? (
            <>
              New here?{' '}
              <button className="auth-link" type="button" onClick={() => switchMode('register')}>
                Create an account
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button className="auth-link" type="button" onClick={() => switchMode('login')}>
                Sign in
              </button>
            </>
          )}
        </div>
      </div>

      <p className="auth-note">
        Demo app — accounts are stored locally in your browser.
      </p>
    </div>
  );
}
