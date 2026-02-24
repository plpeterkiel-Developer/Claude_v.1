import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import StarRating from '../StarRating/StarRating';

export default function ToolCard({ tool }) {
  const { t } = useTranslation();

  const conditionKey = `tools.condition_${tool.condition}`;
  const statusKey = tool.status === 'available' ? 'tools.available' : 'tools.on_loan';

  return (
    <article className="tool-card" aria-label={tool.name}>
      <Link to={`/tools/${tool.id}`} className="tool-card__image-link" tabIndex={-1} aria-hidden="true">
        {tool.photoUrl ? (
          <img
            src={tool.photoUrl}
            alt={tool.name}
            className="tool-card__image"
            loading="lazy"
          />
        ) : (
          <div className="tool-card__image tool-card__image--placeholder" aria-hidden="true">
            🌱
          </div>
        )}
      </Link>

      <div className="tool-card__body">
        <div className="tool-card__header">
          <h3 className="tool-card__title">
            <Link to={`/tools/${tool.id}`}>{tool.name}</Link>
          </h3>
          <span
            className={`badge badge--${tool.status}`}
            aria-label={t(statusKey)}
          >
            {t(statusKey)}
          </span>
        </div>

        <p className="tool-card__condition">{t(conditionKey)}</p>
        <p className="tool-card__area">
          <span className="tool-card__label">{t('tools.pickup_area')}: </span>
          {tool.pickupPointAddress}
        </p>

        {tool.owner && (
          <div className="tool-card__owner">
            <Link to={`/profile/${tool.owner.id}`}>{tool.owner.name}</Link>
            {tool.owner.averageRating != null && (
              <StarRating value={Math.round(tool.owner.averageRating)} />
            )}
          </div>
        )}

        <Link to={`/tools/${tool.id}`} className="btn btn--primary tool-card__cta">
          {t('tools.request_to_borrow')}
        </Link>
      </div>
    </article>
  );
}
