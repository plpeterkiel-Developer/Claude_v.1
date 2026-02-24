import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import client from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import StarRating from '../components/StarRating/StarRating';
import BorrowModal from '../components/BorrowModal/BorrowModal';
import ReportModal from '../components/ReportModal/ReportModal';

export default function ToolDetail() {
  const { id } = useParams();
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [tool, setTool] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showBorrow, setShowBorrow] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [requestSent, setRequestSent] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [toolRes, reviewsRes] = await Promise.all([
          client.get(`/tools/${id}`),
          tool?.owner?.id ? client.get(`/reviews/user/${tool.owner.id}`) : Promise.resolve({ data: [] }),
        ]);
        setTool(toolRes.data);
        setReviews(reviewsRes.data);
      } catch {
        setError(t('errors.generic'));
      } finally {
        setLoading(false);
      }
    })();
  }, [id, t]);

  // Re-fetch reviews once we have the owner id
  useEffect(() => {
    if (!tool?.owner?.id) return;
    client.get(`/reviews/user/${tool.owner.id}`).then(({ data }) => setReviews(data)).catch(() => {});
  }, [tool?.owner?.id]);

  if (loading) return <div role="status" aria-live="polite" className="container">{t('accessibility.loading')}</div>;
  if (error) return <div role="alert" className="container page-error">{error}</div>;
  if (!tool) return null;

  const isOwner = user?.id === tool.owner?.id;
  const canBorrow = user && !isOwner && tool.status === 'available';

  return (
    <div className="page page--tool-detail">
      <div className="container">
        <div className="tool-detail">
          {/* Image */}
          {tool.photoUrl && (
            <img src={tool.photoUrl} alt={tool.name} className="tool-detail__image" />
          )}

          {/* Info */}
          <div className="tool-detail__info">
            <h1>{tool.name}</h1>

            <span className={`badge badge--${tool.status}`}>
              {t(tool.status === 'available' ? 'tools.available' : 'tools.on_loan')}
            </span>

            <p className="tool-detail__description">{tool.description}</p>

            <dl className="tool-detail__meta">
              <dt>{t('tools.condition_label')}</dt>
              <dd>{t(`tools.condition_${tool.condition}`)}</dd>

              <dt>{t('tools.pickup_area')}</dt>
              <dd>
                {tool.pickupPointAddress}
                {!tool.pickupPointNote && tool.status === 'available' && (
                  <em className="address-hint"> — {t('tools.pickup_address_hidden')}</em>
                )}
              </dd>

              {tool.pickupPointNote && (
                <>
                  <dt>Note</dt>
                  <dd>{tool.pickupPointNote}</dd>
                </>
              )}
            </dl>

            {/* Owner */}
            {tool.owner && (
              <div className="tool-detail__owner">
                <p>
                  {t('tools.owner')}:{' '}
                  <Link to={`/profile/${tool.owner.id}`}>{tool.owner.name}</Link>
                </p>
                {tool.owner.averageRating != null && (
                  <StarRating value={Math.round(tool.owner.averageRating)} />
                )}
              </div>
            )}

            {/* Actions */}
            <div className="tool-detail__actions">
              {canBorrow && !requestSent && (
                <button
                  type="button"
                  className="btn btn--primary"
                  onClick={() => setShowBorrow(true)}
                >
                  {t('tools.request_to_borrow')}
                </button>
              )}

              {requestSent && (
                <p className="success-message" role="status">
                  {t('requests.send_request')} ✓
                </p>
              )}

              {isOwner && (
                <>
                  <Link to={`/tools/${tool.id}/edit`} className="btn btn--outline">
                    {t('tools.edit_tool')}
                  </Link>
                  <button
                    type="button"
                    className="btn btn--danger"
                    onClick={async () => {
                      if (window.confirm(t('tools.delete_tool') + '?')) {
                        await client.delete(`/tools/${tool.id}`);
                        navigate('/browse');
                      }
                    }}
                  >
                    {t('tools.delete_tool')}
                  </button>
                </>
              )}

              {user && !isOwner && (
                <button type="button" className="btn btn--ghost" onClick={() => setShowReport(true)}>
                  {t('reports.report')}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Owner reviews */}
        {reviews.length > 0 && (
          <section aria-labelledby="reviews-heading" className="tool-detail__reviews">
            <h2 id="reviews-heading">
              {t('reviews.reviews_count', { count: reviews.length })}
            </h2>
            <ul role="list">
              {reviews.map((review) => (
                <li key={review.id} className="review-item">
                  <div className="review-item__header">
                    <span>
                      {review.reviewerDeleted
                        ? t('reviews.account_deleted')
                        : review.reviewer?.name}
                    </span>
                    <StarRating value={review.rating} />
                  </div>
                  {review.comment && <p>{review.comment}</p>}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      {showBorrow && (
        <BorrowModal
          tool={tool}
          onClose={() => setShowBorrow(false)}
          onSuccess={() => setRequestSent(true)}
        />
      )}

      {showReport && (
        <ReportModal
          targetType="listing"
          targetId={tool.id}
          onClose={() => setShowReport(false)}
        />
      )}
    </div>
  );
}
