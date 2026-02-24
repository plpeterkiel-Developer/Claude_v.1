import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import client from '../api/client';
import ToolCard from '../components/ToolCard/ToolCard';

export default function Browse() {
  const { t } = useTranslation();
  const [tools, setTools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [query, setQuery] = useState('');
  const [street, setStreet] = useState('');
  const [availableOnly, setAvailableOnly] = useState(false);

  const fetchTools = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (query) params.q = query;
      if (street) params.street = street;
      if (availableOnly) params.status = 'available';

      const { data } = await client.get('/tools', { params });
      setTools(data);
    } catch {
      setError(t('errors.generic'));
    } finally {
      setLoading(false);
    }
  }, [query, street, availableOnly, t]);

  useEffect(() => {
    const timer = setTimeout(fetchTools, 300);
    return () => clearTimeout(timer);
  }, [fetchTools]);

  return (
    <div className="page page--browse">
      <div className="container">
        <h1>{t('nav.browse')}</h1>

        {/* Filters */}
        <section aria-label="Filters" className="filters">
          <div className="form-group">
            <label htmlFor="search-query">{t('tools.search_placeholder')}</label>
            <input
              id="search-query"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('tools.search_placeholder')}
            />
          </div>

          <div className="form-group">
            <label htmlFor="search-street">{t('tools.filter_street')}</label>
            <input
              id="search-street"
              type="text"
              value={street}
              onChange={(e) => setStreet(e.target.value)}
            />
          </div>

          <div className="form-group form-group--checkbox">
            <label>
              <input
                type="checkbox"
                checked={availableOnly}
                onChange={(e) => setAvailableOnly(e.target.checked)}
              />
              {t('tools.filter_available')}
            </label>
          </div>
        </section>

        {/* Results */}
        {loading && (
          <div role="status" aria-live="polite">
            {t('accessibility.loading')}
          </div>
        )}

        {error && (
          <p role="alert" className="page-error">
            {error}
          </p>
        )}

        {!loading && !error && tools.length === 0 && (
          <p>{t('tools.no_tools')}</p>
        )}

        {!loading && !error && tools.length > 0 && (
          <ul className="tool-grid" role="list">
            {tools.map((tool) => (
              <li key={tool.id}>
                <ToolCard tool={tool} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
