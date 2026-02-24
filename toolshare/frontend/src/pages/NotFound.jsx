import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function NotFound() {
  const { t } = useTranslation();
  return (
    <div className="page page--not-found">
      <div className="container">
        <h1>{t('errors.not_found')}</h1>
        <Link to="/" className="btn btn--primary">{t('errors.go_home')}</Link>
      </div>
    </div>
  );
}
