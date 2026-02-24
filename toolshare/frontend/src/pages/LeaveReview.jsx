import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import client from '../api/client';
import StarRating from '../components/StarRating/StarRating';

export default function LeaveReview() {
  const { requestId } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating) {
      setError(t('reviews.rating_label'));
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await client.post('/reviews', { requestId, rating, comment });
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || t('errors.generic'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page page--review">
      <div className="container">
        <h1>{t('reviews.leave_review')}</h1>

        <form onSubmit={handleSubmit} noValidate>
          {error && <p role="alert" className="form-error">{error}</p>}

          <div className="form-group">
            <fieldset>
              <legend>{t('reviews.rating_label')}</legend>
              <StarRating value={rating} onChange={setRating} interactive />
            </fieldset>
          </div>

          <div className="form-group">
            <label htmlFor="review-comment">{t('reviews.comment_label')}</label>
            <textarea
              id="review-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              maxLength={1000}
            />
          </div>

          <button type="submit" className="btn btn--primary" disabled={submitting || !rating}>
            {submitting ? t('accessibility.loading') : t('reviews.submit_review')}
          </button>
        </form>
      </div>
    </div>
  );
}
