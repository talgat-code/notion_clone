import { useState } from 'react';
import { useAuth, useCurrentUser, AVATAR_COLORS } from '../auth';
import './auth.css';

const EMOJIS = ['🙂', '😎', '🦊', '🐱', '🐼', '🦉', '🚀', '🌟', '🔥', '🎨', '🌈', '🍀'];

function initial(name: string) {
  return (name.trim()[0] || '?').toUpperCase();
}

export function ProfileModal({ onClose }: { onClose: () => void }) {
  const user = useCurrentUser();
  const { updateProfile, changePassword, logout } = useAuth();

  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [avatar, setAvatar] = useState(user?.avatar ?? '');
  const [color, setColor] = useState(user?.color ?? AVATAR_COLORS[0]);

  const [pwOpen, setPwOpen] = useState(false);
  const [curPw, setCurPw] = useState('');
  const [newPw, setNewPw] = useState('');

  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  if (!user) return null;

  function saveProfile() {
    const res = updateProfile({ name, email, avatar, color });
    setMsg(res.ok ? { kind: 'ok', text: 'Profile saved.' } : { kind: 'err', text: res.error });
  }

  async function savePassword() {
    const res = await changePassword(curPw, newPw);
    if (res.ok) {
      setMsg({ kind: 'ok', text: 'Password updated.' });
      setCurPw('');
      setNewPw('');
      setPwOpen(false);
    } else {
      setMsg({ kind: 'err', text: res.error });
    }
  }

  return (
    <div className="search-overlay" onClick={onClose}>
      <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
        <div className="profile-header">
          <div className="profile-avatar-lg" style={{ background: color }}>
            {avatar || initial(name)}
          </div>
          <div className="profile-header-text">
            <div className="profile-header-name">{name || 'Your name'}</div>
            <div className="profile-header-email">{email}</div>
          </div>
          <button className="profile-close" onClick={onClose} title="Close">✕</button>
        </div>

        <div className="profile-body">
          <div className="profile-section-title">Avatar</div>
          <div className="profile-avatar-picker">
            <button
              className={`profile-emoji ${avatar === '' ? 'profile-emoji--active' : ''}`}
              onClick={() => setAvatar('')}
              title="Use initial"
            >
              {initial(name)}
            </button>
            {EMOJIS.map((e) => (
              <button
                key={e}
                className={`profile-emoji ${avatar === e ? 'profile-emoji--active' : ''}`}
                onClick={() => setAvatar(e)}
              >
                {e}
              </button>
            ))}
          </div>

          <div className="profile-section-title">Color</div>
          <div className="profile-color-picker">
            {AVATAR_COLORS.map((c) => (
              <button
                key={c}
                className={`profile-color ${color === c ? 'profile-color--active' : ''}`}
                style={{ background: c }}
                onClick={() => setColor(c)}
                title="Pick color"
              />
            ))}
          </div>

          <label className="auth-field">
            <span className="auth-label">Name</span>
            <input className="auth-input" value={name} onChange={(e) => setName(e.target.value)} />
          </label>

          <label className="auth-field">
            <span className="auth-label">Email</span>
            <input
              className="auth-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>

          {!pwOpen ? (
            <button className="profile-secondary" onClick={() => { setPwOpen(true); setMsg(null); }}>
              🔒 Change password
            </button>
          ) : (
            <div className="profile-pw">
              <label className="auth-field">
                <span className="auth-label">Current password</span>
                <input
                  className="auth-input"
                  type="password"
                  value={curPw}
                  onChange={(e) => setCurPw(e.target.value)}
                />
              </label>
              <label className="auth-field">
                <span className="auth-label">New password</span>
                <input
                  className="auth-input"
                  type="password"
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                />
              </label>
              <div className="profile-pw-actions">
                <button className="profile-secondary" onClick={() => { setPwOpen(false); setCurPw(''); setNewPw(''); }}>
                  Cancel
                </button>
                <button className="profile-primary" onClick={savePassword}>
                  Update password
                </button>
              </div>
            </div>
          )}

          {msg && <div className={`profile-msg profile-msg--${msg.kind}`}>{msg.text}</div>}
        </div>

        <div className="profile-foot">
          <button className="profile-logout" onClick={() => { logout(); onClose(); }}>
            Sign out
          </button>
          <div className="profile-foot-right">
            <button className="profile-secondary" onClick={onClose}>Cancel</button>
            <button className="profile-primary" onClick={saveProfile}>Save changes</button>
          </div>
        </div>
      </div>
    </div>
  );
}
