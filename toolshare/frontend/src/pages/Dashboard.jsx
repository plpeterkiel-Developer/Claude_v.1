import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import client from '../api/client';

function RequestBadge({ status }) {
  const { t } = useTranslation();
  return (
    <span className={`badge badge--status-${status}`}>
      {t(`requests.status_${status}`)}
    </span>
  );
}

function RequestRow({ request, onAction, isOwner }) {
  const { t } = useTranslation();
  const [actioning, setActioning] = useState(false);

  const doAction = async (action) => {
    setActioning(true);
    try {
      await client.patch(`/requests/${request.id}`, { action });
      onAction();
    } catch {
      // Error shown by parent
    } finally {
      setActioning(false);
    }
  };

  const fmt = (d) => new Date(d).toLocaleDateString();

  return (
    <li className="request-row">
      <div className="request-row__tool">
        <Link to={`/tools/${request.tool.id}`}>{request.tool.name}</Link>
      </div>
      <div className="request-row__meta">
        <span>{fmt(request.startDate)} – {fmt(request.endDate)}</span>
        <RequestBadge status={request.status} />
      </div>
      <div className="request-row__party">
        {isOwner ? (
          <span>{t('requests.my_requests')}: <Link to={`/profile/${request.borrower.id}`}>{request.borrower.name}</Link></span>
        ) : (
          <span>{t('tools.owner')}: <Link to={`/profile/${request.tool.owner?.id}`}>{request.tool.owner?.name}</Link></span>
        )}
      </div>
      <div className="request-row__actions">
        {isOwner && request.status === 'pending' && (
          <>
            <button type="button" className="btn btn--primary btn--sm" disabled={actioning} onClick={() => doAction('accept')}>
              {t('requests.accept')}
            </button>
            <button type="button" className="btn btn--outline btn--sm" disabled={actioning} onClick={() => doAction('decline')}>
              {t('requests.decline')}
            </button>
          </>
        )}
        {!isOwner && request.status === 'pending' && (
          <button type="button" className="btn btn--ghost btn--sm" disabled={actioning} onClick={() => doAction('cancel')}>
            {t('requests.cancel_request')}
          </button>
        )}
        {(isOwner || !isOwner) && ['accepted', 'overdue'].includes(request.status) && (
          <button type="button" className="btn btn--outline btn--sm" disabled={actioning} onClick={() => doAction('return')}>
            {t('requests.mark_returned')}
          </button>
        )}
        {request.status === 'returned' && (
          <Link to={`/reviews/new/${request.id}`} className="btn btn--ghost btn--sm">
            {t('reviews.leave_review')}
          </Link>
        )}
      </div>
    </li>
  );
}

export default function Dashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('borrowing'); // 'borrowing' | 'lending'

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const { data } = await client.get('/requests');
      setRequests(data);
    } catch {
      // handled silently
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequests(); }, []);

  const borrowing = requests.filter((r) => r.borrowerId === user?.id);
  const lending = requests.filter((r) => r.tool?.ownerId === user?.id);
  const current = tab === 'borrowing' ? borrowing : lending;
  const isOwnerTab = tab === 'lending';

  return (
    <div className="page page--dashboard">
      <div className="container">
        <h1>{t('nav.dashboard')}</h1>

        <div className="tabs" role="tablist">
          <button
            role="tab"
            type="button"
            aria-selected={tab === 'borrowing'}
            className={`tab ${tab === 'borrowing' ? 'tab--active' : ''}`}
            onClick={() => setTab('borrowing')}
          >
            {t('requests.my_requests')}
          </button>
          <button
            role="tab"
            type="button"
            aria-selected={tab === 'lending'}
            className={`tab ${tab === 'lending' ? 'tab--active' : ''}`}
            onClick={() => setTab('lending')}
          >
            {t('requests.incoming_requests')}
          </button>
        </div>

        {loading ? (
          <div role="status" aria-live="polite">{t('accessibility.loading')}</div>
        ) : current.length === 0 ? (
          <p>{t('tools.no_tools')}</p>
        ) : (
          <ul className="request-list" role="list">
            {current.map((r) => (
              <RequestRow key={r.id} request={r} onAction={fetchRequests} isOwner={isOwnerTab} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
