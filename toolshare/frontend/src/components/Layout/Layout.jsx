import { useTranslation } from 'react-i18next';
import Navbar from './Navbar';

export default function Layout({ children }) {
  const { t } = useTranslation();

  return (
    <>
      {/* Skip-to-content link for keyboard/screen reader users */}
      <a href="#main-content" className="skip-link">
        {t('accessibility.skip_to_content')}
      </a>

      <Navbar />

      <main id="main-content" tabIndex={-1}>
        {children}
      </main>

      <footer className="site-footer">
        <div className="container">
          <p>© {new Date().getFullYear()} ToolShare</p>
        </div>
      </footer>
    </>
  );
}
