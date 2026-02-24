import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import client from '../api/client';
import { useAuth } from '../contexts/AuthContext';

export default function AddTool({ editMode = false }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [condition, setCondition] = useState('good');
  const [address, setAddress] = useState('');
  const [note, setNote] = useState('');
  const [photo, setPhoto] = useState(null);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Show email-not-verified gate
  if (user && !user.emailVerified) {
    return (
      <div className="page container">
        <p role="alert" className="form-error">{t('errors.email_not_verified')}</p>
      </div>
    );
  }

  useEffect(() => {
    if (!editMode || !id) return;
    client.get(`/tools/${id}`).then(({ data }) => {
      setName(data.name);
      setDescription(data.description);
      setCondition(data.condition);
      setAddress(data.pickupPointAddress);
      setNote(data.pickupPointNote || '');
    });
  }, [editMode, id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setSubmitting(true);

    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', description);
    formData.append('condition', condition);
    formData.append('pickupPointAddress', address);
    formData.append('pickupPointNote', note);
    if (photo) formData.append('photo', photo);

    try {
      if (editMode) {
        await client.patch(`/tools/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        const { data } = await client.post('/tools', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        navigate(`/tools/${data.id}`);
        return;
      }
      navigate(`/tools/${id}`);
    } catch (err) {
      const data = err.response?.data;
      if (data?.fields) {
        const fe = {};
        data.fields.forEach(({ field, message }) => { fe[field] = message; });
        setErrors(fe);
      } else {
        setErrors({ general: data?.message || t('errors.generic') });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const conditions = ['good', 'fair', 'worn'];

  return (
    <div className="page page--add-tool">
      <div className="container">
        <h1>{editMode ? t('tools.edit_tool') : t('tools.add_tool')}</h1>

        <form onSubmit={handleSubmit} noValidate encType="multipart/form-data">
          {errors.general && <p role="alert" className="form-error">{errors.general}</p>}

          <div className="form-group">
            <label htmlFor="tool-name">{t('tools.name_label')}</label>
            <input id="tool-name" type="text" value={name} onChange={(e) => setName(e.target.value)} required aria-invalid={!!errors.name} />
            {errors.name && <span className="field-error" role="alert">{errors.name}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="tool-description">{t('tools.description_label')}</label>
            <textarea id="tool-description" value={description} onChange={(e) => setDescription(e.target.value)} required rows={4} maxLength={1000} aria-invalid={!!errors.description} />
            {errors.description && <span className="field-error" role="alert">{errors.description}</span>}
          </div>

          <fieldset className="form-group">
            <legend>{t('tools.condition_label')}</legend>
            {conditions.map((c) => (
              <label key={c} className="radio-label">
                <input type="radio" name="condition" value={c} checked={condition === c} onChange={() => setCondition(c)} />
                {t(`tools.condition_${c}`)}
              </label>
            ))}
          </fieldset>

          <div className="form-group">
            <label htmlFor="pickup-address">{t('tools.pickup_address_label')}</label>
            <input id="pickup-address" type="text" value={address} onChange={(e) => setAddress(e.target.value)} required aria-invalid={!!errors.pickupPointAddress} />
            {errors.pickupPointAddress && <span className="field-error" role="alert">{errors.pickupPointAddress}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="pickup-note">{t('tools.pickup_note_label')}</label>
            <input id="pickup-note" type="text" value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} />
          </div>

          <div className="form-group">
            <label htmlFor="tool-photo">{t('tools.photo_label')}</label>
            <input id="tool-photo" type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setPhoto(e.target.files[0] || null)} />
          </div>

          <button type="submit" className="btn btn--primary" disabled={submitting}>
            {submitting ? t('accessibility.loading') : (editMode ? t('tools.edit_tool') : t('tools.add_tool'))}
          </button>
        </form>
      </div>
    </div>
  );
}
