import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import client from '../../api/client';

export default function ReportModal({ targetType, targetId, onClose }) {
  const { t } = useTranslation();
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await client.post('/reports', { targetType, targetId, reason });
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.message || t('errors.generic'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    /* Accessible modal overlay */
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t(`reports.report_${targetType}`)}
      className="modal-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal">
        <button
          type="button"
          className="modal__close"
          aria-label={t('accessibility.close')}
          onClick={onClose}
        >
          ×
        </button>

        <h2>{t(`reports.report_${targetType}`)}</h2>

        {submitted ? (
          <p>{t('reports.submitted')}</p>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            {error && (
              <p role="alert" className="form-error">
                {error}
              </p>
            )}
            <div className="form-group">
              <label htmlFor="report-reason">{t('reports.reason_label')}</label>
              <textarea
                id="report-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
                rows={4}
                maxLength={1000}
                aria-describedby="report-reason-hint"
              />
              <span id="report-reason-hint" className="form-hint">
                {reason.length}/1000
              </span>
            </div>
            <button type="submit" className="btn btn--primary" disabled={submitting || !reason.trim()}>
              {submitting ? t('accessibility.loading') : t('reports.submit_report')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
