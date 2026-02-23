import React, { useState, useEffect } from 'react';
import { Link }  from 'react-router-dom';
import { api }   from '../api';

export default function MyTools() {
  const [tools,   setTools]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  async function load() {
    try {
      const data = await api.getMyTools();
      setTools(data);
    } catch {
      setError('Could not load your tools.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleDelete(id) {
    if (!window.confirm('Delete this tool?')) return;
    try {
      await api.deleteTool(id);
      setTools((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      alert(err.message);
    }
  }

  async function toggleAvailable(tool) {
    try {
      await api.updateTool(tool.id, { available: !tool.available });
      load();
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <>
      <div className="page-top">
        <h1>My tools</h1>
        <Link to="/add-tool">
          <button className="btn btn-primary">+ Add tool</button>
        </Link>
      </div>

      {loading && <p className="text-muted">Loading…</p>}
      {error   && <p className="alert alert-error">{error}</p>}

      {!loading && tools.length === 0 && (
        <div className="empty">
          <p>You haven't listed any tools yet.</p>
          <Link to="/add-tool" className="btn btn-primary" style={{ marginTop: '1rem', display: 'inline-block' }}>
            Share your first tool
          </Link>
        </div>
      )}

      <div className="card-grid">
        {tools.map((tool) => (
          <div key={tool.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <strong>{tool.name}</strong>

            {tool.description && <p className="text-sm text-muted">{tool.description}</p>}

            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              <span className="badge badge-grey">{tool.category}</span>
              <span className="badge badge-grey">{tool.condition}</span>
              {tool.available
                ? <span className="badge badge-green">Available</span>
                : <span className="badge badge-orange">Borrowed</span>}
            </div>

            <div className="request-actions mt-1">
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => toggleAvailable(tool)}
              >
                Mark as {tool.available ? 'unavailable' : 'available'}
              </button>
              <button
                className="btn btn-danger btn-sm"
                onClick={() => handleDelete(tool.id)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
