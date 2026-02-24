import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import client from '../api/client';

export default function Register() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [registered, setRegistered] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setSubmitting(true);
    try {
      await client.post('/auth/register', { name, email, password });
      setRegistered(true);
    } catch (err) {
      const data = err.response?.data;
      if (data?.fields) {
        const fieldErrors = {};
        data.fields.forEach(({ field, message }) => {
          fieldErrors[field] = message;
        });
        setErrors(fieldErrors);
      } else {
        setErrors({ general: data?.message || t('errors.generic') });
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (registered) {
    return (
      <div className="page page--auth">
        <div className="auth-card">
          <h1>{t('auth.verification_sent')}</h1>
          <p>{t('auth.verify_email_prompt')}</p>
          <Link to="/login" className="btn btn--primary">{t('auth.login')}</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page page--auth">
      <div className="auth-card">
        <h1>{t('auth.register')}</h1>

        <form onSubmit={handleSubmit} noValidate>
          {errors.general && (
            <p role="alert" className="form-error">{errors.general}</p>
          )}

          <div className="form-group">
            <label htmlFor="name">{t('auth.name')}</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              required
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? 'name-error' : undefined}
            />
            {errors.name && (
              <span id="name-error" className="field-error" role="alert">{errors.name}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="reg-email">{t('auth.email')}</label>
            <input
              id="reg-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'email-error' : undefined}
            />
            {errors.email && (
              <span id="email-error" className="field-error" role="alert">{errors.email}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="reg-password">{t('auth.password')}</label>
            <input
              id="reg-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
              aria-describedby="password-hint"
              aria-invalid={!!errors.password}
            />
            <span id="password-hint" className="form-hint">{t('auth.password_requirements')}</span>
            {errors.password && (
              <span className="field-error" role="alert">{errors.password}</span>
            )}
          </div>

          <button type="submit" className="btn btn--primary btn--full" disabled={submitting}>
            {submitting ? t('accessibility.loading') : t('auth.register')}
          </button>
        </form>

        <div className="auth-divider">or</div>

        <a href="/auth/google" className="btn btn--oauth">{t('auth.google')}</a>
        <a href="/auth/facebook" className="btn btn--oauth">{t('auth.facebook')}</a>

        <p className="auth-footer">
          {t('auth.already_account')}{' '}
          <Link to="/login">{t('auth.login')}</Link>
        </p>
      </div>
    </div>
  );
}
