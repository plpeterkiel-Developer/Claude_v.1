import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import client from '../api/client';

export default function AccountSettings() {
  const { t } = useTranslation();
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name || '');
  const [lang, setLang] = useState(user?.preferredLanguage || 'da');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [downloadMsg, setDownloadMsg] = useState('');
  const [deleting, setDeleting] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveMsg('');
    try {
      const { data } = await client.patch('/users/me', { name, preferredLanguage: lang });
      updateUser(data);
      setSaveMsg('✓');
    } catch {
      setSaveMsg(t('errors.generic'));
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = async () => {
    try {
      await client.post('/users/me/download-data');
      setDownloadMsg(t('gdpr.data_download_sent'));
    } catch {
      setDownloadMsg(t('errors.generic'));
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(t('profile.delete_account_confirm'))) return;
    setDeleting(true);
    try {
      await client.delete('/users/me');
      await logout();
      navigate('/');
    } catch {
      setDeleting(false);
    }
  };

  return (
    <div className="page page--account">
      <div className="container">
        <h1>{t('profile.edit_profile')}</h1>

        <form onSubmit={handleSave} noValidate>
          <div className="form-group">
            <label htmlFor="account-name">{t('auth.name')}</label>
            <input id="account-name" type="text" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>

          <div className="form-group">
            <label htmlFor="account-lang">{t('profile.language')}</label>
            <select id="account-lang" value={lang} onChange={(e) => setLang(e.target.value)}>
              <option value="da">Dansk</option>
              <option value="en">English</option>
            </select>
          </div>

          <button type="submit" className="btn btn--primary" disabled={saving}>
            {saving ? t('accessibility.loading') : 'Gem'} {saveMsg}
          </button>
        </form>

        <hr />

        {/* GDPR — data download */}
        <section aria-labelledby="download-heading">
          <h2 id="download-heading">{t('profile.download_data')}</h2>
          <button type="button" className="btn btn--outline" onClick={handleDownload}>
            {t('profile.download_data')}
          </button>
          {downloadMsg && <p role="status">{downloadMsg}</p>}
        </section>

        <hr />

        {/* GDPR — account deletion */}
        <section aria-labelledby="delete-heading">
          <h2 id="delete-heading">{t('profile.delete_account')}</h2>
          <button
            type="button"
            className="btn btn--danger"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? t('accessibility.loading') : t('profile.delete_account')}
          </button>
        </section>
      </div>
    </div>
  );
}
