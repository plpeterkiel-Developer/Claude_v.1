import React, { useState, useEffect } from 'react';
import { api }      from '../api';
import ToolCard     from '../components/ToolCard';

export default function Tools({ user }) {
  const [tools,   setTools]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [search,  setSearch]  = useState('');

  async function load() {
    try {
      const data = await api.getTools();
      setTools(data);
    } catch {
      setError('Could not load tools. Is the backend running?');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const filtered = tools.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div className="page-top">
        <h1>Available tools</h1>
        <input
          type="search"
          placeholder="Search by name or category…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 260 }}
        />
      </div>

      {loading && <p className="text-muted">Loading…</p>}
      {error   && <p className="alert alert-error">{error}</p>}

      {!loading && !error && filtered.length === 0 && (
        <div className="empty">
          <p>No tools found. {user ? 'Why not add one?' : 'Log in to add yours!'}</p>
        </div>
      )}

      <div className="card-grid">
        {filtered.map((tool) => (
          <ToolCard key={tool.id} tool={tool} currentUser={user} onBorrow={load} />
        ))}
      </div>
    </>
  );
}
