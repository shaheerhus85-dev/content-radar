import { useState, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { Lock, Mail, Radio, User, X } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

interface AuthModalProps {
  mode: 'signin' | 'signup';
  onClose: () => void;
  onModeChange: (mode: 'signin' | 'signup') => void;
  onSuccess: () => void;
}

const getReadableAuthError = (error: unknown) => {
  const message = error instanceof Error ? error.message : 'Something went wrong. Please try again.';
  return message
    .replace('Firebase: ', '')
    .replace(/\(auth\/.*\)\.?/, '')
    .trim();
};

export default function AuthModal({
  mode,
  onClose,
  onModeChange,
  onSuccess,
}: AuthModalProps) {
  const { firebaseReady, signIn, signUp } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isSignUp = mode === 'signup';

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      if (isSignUp) {
        await signUp(email.trim(), password, displayName.trim());
      } else {
        await signIn(email.trim(), password);
      }
      onSuccess();
    } catch (submitError) {
      setError(getReadableAuthError(submitError));
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div
      id="auth-modal-overlay"
      className="fixed inset-0 z-[9999] grid place-items-center bg-black/60 backdrop-blur-sm px-4 py-6 animate-fade-in-quick"
      onClick={onClose}
    >
      <div
        id="auth-modal-card"
        className="w-full max-w-[430px] bg-theme-surface border border-theme-border rounded-2xl shadow-2xl p-6 text-left"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-theme-border pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-theme-accent text-theme-accent-fg flex items-center justify-center shrink-0">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-theme-text-primary">
                {isSignUp ? 'Create workspace' : 'Sign in'}
              </h2>
              <p className="text-xs text-theme-text-secondary mt-0.5">
                {isSignUp
                  ? 'Start with a private, empty Content Radar workspace.'
                  : 'Open your private Content Radar workspace.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg border border-theme-border text-theme-text-secondary hover:text-theme-text-primary hover:bg-theme-surface-soft transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {!firebaseReady && (
          <div className="mb-4 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-[11px] font-semibold text-amber-700 dark:text-amber-300">
            Firebase env values are not configured yet. Add the `VITE_FIREBASE_*` values locally to enable authentication.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {isSignUp && (
            <label className="block">
              <span className="text-[11px] font-bold uppercase text-theme-text-secondary">Display name</span>
              <div className="relative mt-1">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-text-secondary" />
                <input
                  id="auth-display-name"
                  type="text"
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  placeholder="Shaheer Hussain"
                  className="w-full h-10 bg-theme-surface-soft border border-theme-border rounded-xl pl-9 pr-3 text-sm text-theme-text-primary outline-none focus:border-theme-text-primary/30 placeholder-theme-text-secondary"
                />
              </div>
            </label>
          )}

          <label className="block">
            <span className="text-[11px] font-bold uppercase text-theme-text-secondary">Email</span>
            <div className="relative mt-1">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-text-secondary" />
              <input
                id="auth-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                required
                className="w-full h-10 bg-theme-surface-soft border border-theme-border rounded-xl pl-9 pr-3 text-sm text-theme-text-primary outline-none focus:border-theme-text-primary/30 placeholder-theme-text-secondary"
              />
            </div>
          </label>

          <label className="block">
            <span className="text-[11px] font-bold uppercase text-theme-text-secondary">Password</span>
            <div className="relative mt-1">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-text-secondary" />
              <input
                id="auth-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="At least 6 characters"
                required
                minLength={6}
                className="w-full h-10 bg-theme-surface-soft border border-theme-border rounded-xl pl-9 pr-3 text-sm text-theme-text-primary outline-none focus:border-theme-text-primary/30 placeholder-theme-text-secondary"
              />
            </div>
          </label>

          {error && (
            <p className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-500">
              {error}
            </p>
          )}

          <button
            id="auth-submit-btn"
            type="submit"
            disabled={submitting || !firebaseReady}
            className="w-full h-10 rounded-xl bg-theme-accent text-theme-accent-fg font-bold text-sm hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          >
            {submitting ? 'Working...' : isSignUp ? 'Create private workspace' : 'Sign in'}
          </button>
        </form>

        <div className="mt-4 flex items-center justify-center gap-1 text-xs text-theme-text-secondary">
          <span>{isSignUp ? 'Already have a workspace?' : 'New to Content Radar?'}</span>
          <button
            type="button"
            onClick={() => onModeChange(isSignUp ? 'signin' : 'signup')}
            className="font-bold text-theme-text-primary hover:underline"
          >
            {isSignUp ? 'Sign in' : 'Get started'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

