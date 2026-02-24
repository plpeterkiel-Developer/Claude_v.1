import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const from = location.state?.from?.pathname || '/dashboard';

  // Show OAuth error if redirected back with ?error=oauth
  const oauthError = new URLSearchParams(location.search).get('error');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || t('auth.invalid_credentials'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page page--auth">
      <div className="auth-card">
        <h1>{t('auth.login')}</h1>

        {oauthError && (
          <p role="alert" className="form-error">{t('errors.generic')}</p>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {error && (
            <p id="login-error" role="alert" className="form-error">
              {error}
            </p>
          )}

          <div className="form-group">
            <label htmlFor="email">{t('auth.email')}</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              aria-describedby={error ? 'login-error' : undefined}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">{t('auth.password')}</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          <button type="submit" className="btn btn--primary btn--full" disabled={submitting}>
            {submitting ? t('accessibility.loading') : t('auth.login')}
          </button>
        </form>

        <div className="auth-divider">or</div>

        <a href="/auth/google" className="btn btn--oauth">
          {t('auth.google')}
        </a>
        <a href="/auth/facebook" className="btn btn--oauth">
          {t('auth.facebook')}
        </a>

        <p className="auth-footer">
          {t('auth.no_account')}{' '}
          <Link to="/register">{t('auth.register')}</Link>
        </p>
      </div>
    </div>
  );
}
