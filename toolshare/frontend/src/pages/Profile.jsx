import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import client from '../api/client';
import StarRating from '../components/StarRating/StarRating';
import ReportModal from '../components/ReportModal/ReportModal';
import { useAuth } from '../contexts/AuthContext';

export default function Profile() {
  const { id } = useParams();
  const { t } = useTranslation();
  const { user: currentUser } = useAuth();

  const [profile, setProfile] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reportReviewId, setReportReviewId] = useState(null);

  useEffect(() => {
    Promise.all([
      client.get(`/users/${id}`),
      client.get(`/reviews/user/${id}`),
    ]).then(([profileRes, reviewsRes]) => {
      setProfile(profileRes.data);
      setReviews(reviewsRes.data);
    }).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div role="status" aria-live="polite" className="container">{t('accessibility.loading')}</div>;
  if (!profile) return null;

  const memberSince = new Date(profile.createdAt).toLocaleDateString();

  return (
    <div className="page page--profile">
      <div className="container">
        <div className="profile-header">
          {profile.avatarUrl && (
            <img src={profile.avatarUrl} alt={profile.name} className="profile-header__avatar" />
          )}
          <div>
            <h1>{profile.name}</h1>
            {profile.averageRating != null && (
              <StarRating value={Math.round(profile.averageRating)} />
            )}
            <p className="profile-header__since">
              {t('profile.member_since')}: {memberSince}
            </p>
          </div>
        </div>

        {/* Their tools */}
        {profile.tools?.length > 0 && (
          <section aria-labelledby="tools-heading">
            <h2 id="tools-heading">{t('profile.my_tools')}</h2>
            <ul className="tool-list" role="list">
              {profile.tools.map((tool) => (
                <li key={tool.id}>
                  <a href={`/tools/${tool.id}`}>{tool.name}</a>
                  {' — '}{t(`tools.condition_${tool.condition}`)}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Reviews */}
        <section aria-labelledby="reviews-heading">
          <h2 id="reviews-heading">
            {t(reviews.length === 1 ? 'reviews.reviews_count' : 'reviews.reviews_count_plural', {
              count: reviews.length,
            })}
          </h2>

          {reviews.length === 0 ? (
            <p>{t('reviews.no_reviews')}</p>
          ) : (
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
                  {currentUser && currentUser.id !== id && (
                    <button
                      type="button"
                      className="btn btn--ghost btn--sm"
                      onClick={() => setReportReviewId(review.id)}
                    >
                      {t('reports.report')}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {reportReviewId && (
        <ReportModal
          targetType="review"
          targetId={reportReviewId}
          onClose={() => setReportReviewId(null)}
        />
      )}
    </div>
  );
}
