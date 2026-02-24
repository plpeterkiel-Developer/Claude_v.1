import { Link, NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import client from '../../api/client';
import i18n from '../../i18n';

export default function Navbar() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();

  const toggleLanguage = async () => {
    const next = i18n.language === 'da' ? 'en' : 'da';
    i18n.changeLanguage(next);
    localStorage.setItem('toolshare_lang', next);

    // Persist to profile if logged in
    if (user) {
      try {
        await client.patch('/users/me', { preferredLanguage: next });
      } catch {
        // Non-critical — language still switched locally
      }
    }
  };

  return (
    <header>
      <nav className="navbar" aria-label="Main navigation">
        <Link to="/" className="navbar__brand" aria-label={t('app.name')}>
          {t('app.name')}
        </Link>

        <ul className="navbar__links" role="list">
          <li>
            <NavLink to="/browse">{t('nav.browse')}</NavLink>
          </li>
          {user && (
            <>
              <li>
                <NavLink to="/tools/new">{t('nav.addTool')}</NavLink>
              </li>
              <li>
                <NavLink to="/dashboard">{t('nav.dashboard')}</NavLink>
              </li>
            </>
          )}
        </ul>

        <div className="navbar__actions">
          {/* Language toggle */}
          <button
            type="button"
            onClick={toggleLanguage}
            aria-label={t('nav.language')}
            className="lang-toggle"
          >
            {i18n.language === 'da' ? 'EN' : 'DA'}
          </button>

          {user ? (
            <>
              <NavLink to={`/profile/${user.id}`} className="navbar__user">
                {user.name}
              </NavLink>
              <button type="button" onClick={logout} className="btn btn--outline">
                {t('nav.logout')}
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className="btn btn--outline">
                {t('nav.login')}
              </NavLink>
              <NavLink to="/register" className="btn btn--primary">
                {t('nav.register')}
              </NavLink>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
