import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import client from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';

export default function BorrowModal({ tool, onClose, onSuccess }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();

  const today = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!user) {
    return (
      <div role="dialog" aria-modal="true" className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="modal">
          <p>{t('errors.unauthorised')}</p>
          <button type="button" className="btn btn--primary" onClick={() => navigate('/login')}>
            {t('nav.login')}
          </button>
        </div>
      </div>
    );
  }

  if (!user.emailVerified) {
    return (
      <div role="dialog" aria-modal="true" className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="modal">
          <p>{t('errors.email_not_verified')}</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await client.post('/requests', { toolId: tool.id, startDate, endDate, message });
      onSuccess && onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || t('errors.generic'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t('requests.send_request')}
      className="modal-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal">
        <button type="button" className="modal__close" aria-label={t('accessibility.close')} onClick={onClose}>×</button>

        <h2>{t('requests.send_request')}: {tool.name}</h2>

        <form onSubmit={handleSubmit} noValidate>
          {error && <p role="alert" className="form-error">{error}</p>}

          <div className="form-group">
            <label htmlFor="start-date">{t('requests.start_date')}</label>
            <input
              id="start-date"
              type="date"
              value={startDate}
              min={today}
              required
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="end-date">{t('requests.end_date')}</label>
            <input
              id="end-date"
              type="date"
              value={endDate}
              min={startDate || today}
              required
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="borrow-message">{t('requests.message_label')}</label>
            <textarea
              id="borrow-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              maxLength={500}
            />
          </div>

          <button type="submit" className="btn btn--primary" disabled={submitting || !endDate}>
            {submitting ? t('accessibility.loading') : t('requests.send_request')}
          </button>
        </form>
      </div>
    </div>
  );
}
