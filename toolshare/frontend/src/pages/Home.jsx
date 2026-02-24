import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';

export default function Home() {
  const { t } = useTranslation();
  const { user } = useAuth();

  return (
    <div className="page page--home">
      {/* Hero */}
      <section className="hero" aria-labelledby="hero-heading">
        <div className="container">
          <h1 id="hero-heading">{t('home.hero_title')}</h1>
          <p className="hero__subtitle">{t('home.hero_subtitle')}</p>
          <div className="hero__ctas">
            <Link to="/browse" className="btn btn--primary btn--lg">
              {t('home.cta_browse')}
            </Link>
            {!user && (
              <Link to="/register" className="btn btn--outline btn--lg">
                {t('home.cta_register')}
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="how-it-works" aria-labelledby="how-heading">
        <div className="container">
          <h2 id="how-heading">{t('home.how_it_works')}</h2>
          <ol className="steps" role="list">
            {[1, 2, 3].map((n) => (
              <li key={n} className="step">
                <div className="step__number" aria-hidden="true">{n}</div>
                <h3>{t(`home.step${n}_title`)}</h3>
                <p>{t(`home.step${n}_text`)}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </div>
  );
}
