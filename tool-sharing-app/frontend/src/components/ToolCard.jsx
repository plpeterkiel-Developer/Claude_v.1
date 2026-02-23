import React, { useState } from 'react';
import { api } from '../api';

/**
 * ToolCard — displays one tool.
 *
 * Props:
 *  tool       — the tool object from the API
 *  currentUser — the logged-in user (or null)
 *  onBorrow   — optional callback after a borrow request is submitted
 */
export default function ToolCard({ tool, currentUser, onBorrow }) {
  const [message, setMessage] = useState('');
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState(false);
  const [open,    setOpen]    = useState(false);

  const isOwner = currentUser && currentUser.id === tool.owner_id;

  async function handleBorrow(e) {
    e.preventDefault();
    setError('');
    try {
      await api.borrowTool(tool.id, { message });
      setSuccess(true);
      setOpen(false);
      onBorrow?.();
    } catch (err) {
      setError(err.message);
    }
  }

  const conditionColour = {
    excellent: 'badge-green',
    good:      'badge-green',
    fair:      'badge-orange',
    poor:      'badge-red',
  }[tool.condition] ?? 'badge-grey';

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <strong style={{ fontSize: '1.05rem' }}>{tool.name}</strong>

      {tool.description && (
        <p className="text-sm text-muted">{tool.description}</p>
      )}

      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
        <span className="badge badge-grey">{tool.category}</span>
        <span className={`badge ${conditionColour}`}>{tool.condition}</span>
        {tool.available
          ? <span className="badge badge-green">Available</span>
          : <span className="badge badge-orange">Borrowed</span>}
      </div>

      <p className="text-sm text-muted" style={{ marginTop: '0.25rem' }}>
        Owned by <strong>{tool.owner_name}</strong>
      </p>

      {success && (
        <p className="alert alert-success">Request sent!</p>
      )}

      {currentUser && !isOwner && tool.available && !success && (
        <>
          {open ? (
            <form onSubmit={handleBorrow} style={{ marginTop: '0.5rem' }}>
              {error && <p className="alert alert-error">{error}</p>}
              <div className="form-group">
                <label htmlFor={`msg-${tool.id}`}>Message (optional)</label>
                <textarea
                  id={`msg-${tool.id}`}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="When do you need it? How long for?"
                  style={{ minHeight: 60 }}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button type="submit" className="btn btn-primary btn-sm">Send request</button>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setOpen(false)}>Cancel</button>
              </div>
            </form>
          ) : (
            <button className="btn btn-primary btn-sm" style={{ marginTop: '0.25rem' }} onClick={() => setOpen(true)}>
              Request to borrow
            </button>
          )}
        </>
      )}
    </div>
  );
}
