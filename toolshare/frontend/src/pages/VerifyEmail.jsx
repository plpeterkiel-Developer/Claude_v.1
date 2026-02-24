import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import client from '../api/client';

export default function VerifyEmail() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState('loading'); // loading | success | error

  useEffect(() => {
    if (!token) {
      setStatus('error');
      return;
    }
    client
      .post('/auth/verify-email', { token })
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'));
  }, [token]);

  if (status === 'loading') {
    return (
      <div className="page container" role="status" aria-live="polite">
        {t('accessibility.loading')}
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="page container">
        <h1>{t('auth.email_verified')}</h1>
        <Link to="/login" className="btn btn--primary">{t('auth.login')}</Link>
      </div>
    );
  }

  return (
    <div className="page container">
      <h1>{t('errors.generic')}</h1>
      <p>{t('auth.verify_email_prompt')}</p>
      <Link to="/" className="btn btn--outline">{t('errors.go_home')}</Link>
    </div>
  );
}
