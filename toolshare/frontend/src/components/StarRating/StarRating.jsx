import { useTranslation } from 'react-i18next';

/**
 * StarRating — displays a read-only star rating.
 * `interactive` prop enables click-to-set behaviour for review forms.
 */
export default function StarRating({ value, onChange, interactive = false, max = 5 }) {
  const { t } = useTranslation();

  return (
    <div
      className="star-rating"
      role={interactive ? 'group' : 'img'}
      aria-label={t('accessibility.star_rating', { count: value })}
    >
      {Array.from({ length: max }, (_, i) => {
        const starValue = i + 1;
        const filled = starValue <= (value || 0);

        if (interactive) {
          return (
            <button
              key={starValue}
              type="button"
              className={`star ${filled ? 'star--filled' : ''}`}
              aria-label={`${starValue} star${starValue !== 1 ? 's' : ''}`}
              aria-pressed={filled}
              onClick={() => onChange && onChange(starValue)}
            >
              ★
            </button>
          );
        }

        return (
          <span key={starValue} className={`star ${filled ? 'star--filled' : ''}`} aria-hidden="true">
            ★
          </span>
        );
      })}
    </div>
  );
}
