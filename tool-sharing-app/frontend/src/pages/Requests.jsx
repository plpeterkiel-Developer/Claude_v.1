import React, { useState, useEffect } from 'react';
import { api } from '../api';

const STATUS_BADGE = {
  pending:  'badge-orange',
  approved: 'badge-green',
  rejected: 'badge-red',
  returned: 'badge-grey',
};

export default function Requests() {
  const [mine,     setMine]     = useState([]);
  const [received, setReceived] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');

  async function load() {
    try {
      const [m, r] = await Promise.all([api.getMyRequests(), api.getReceivedRequests()]);
      setMine(m);
      setReceived(r);
    } catch {
      setError('Could not load requests.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleStatus(requestId, status) {
    try {
      await api.updateRequest(requestId, status);
      load();
    } catch (err) {
      alert(err.message);
    }
  }

  if (loading) return <p className="text-muted">Loading…</p>;
  if (error)   return <p className="alert alert-error">{error}</p>;

  return (
    <>
      <h1 style={{ marginTop: '1rem' }}>Requests</h1>

      {/* ---- Incoming requests for my tools ---- */}
      <h2 style={{ marginTop: '1.5rem' }}>Requests for my tools</h2>
      {received.length === 0
        ? <p className="text-muted">No one has requested your tools yet.</p>
        : received.map((r) => (
          <div key={r.id} className="card mt-2">
            <div className="request-item">
              <div>
                <strong>{r.tool_name}</strong>
                <p className="text-sm text-muted">
                  Requested by <strong>{r.requester_name}</strong>
                  {r.message && ` — "${r.message}"`}
                </p>
                <span className={`badge ${STATUS_BADGE[r.status] ?? 'badge-grey'} mt-1`}>{r.status}</span>
              </div>

              {r.status === 'pending' && (
                <div className="request-actions">
                  <button className="btn btn-primary btn-sm"  onClick={() => handleStatus(r.id, 'approved')}>Approve</button>
                  <button className="btn btn-danger btn-sm"   onClick={() => handleStatus(r.id, 'rejected')}>Reject</button>
                </div>
              )}
            </div>
          </div>
        ))
      }

      {/* ---- My outgoing requests ---- */}
      <h2 style={{ marginTop: '2rem' }}>My borrowing requests</h2>
      {mine.length === 0
        ? <p className="text-muted">You haven't requested any tools yet.</p>
        : mine.map((r) => (
          <div key={r.id} className="card mt-2">
            <div className="request-item">
              <div>
                <strong>{r.tool_name}</strong>
                <p className="text-sm text-muted">Owned by <strong>{r.owner_name}</strong></p>
                <span className={`badge ${STATUS_BADGE[r.status] ?? 'badge-grey'} mt-1`}>{r.status}</span>
              </div>

              {r.status === 'approved' && (
                <button className="btn btn-secondary btn-sm" onClick={() => handleStatus(r.id, 'returned')}>
                  Mark returned
                </button>
              )}
            </div>
          </div>
        ))
      }
    </>
  );
}
