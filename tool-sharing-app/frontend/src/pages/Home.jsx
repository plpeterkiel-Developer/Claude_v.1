import React from 'react';
import { Link } from 'react-router-dom';

export default function Home({ user }) {
  return (
    <div style={{ maxWidth: 680, margin: '3rem auto', textAlign: 'center' }}>
      <h1 style={{ fontSize: '2.2rem', marginBottom: '1rem' }}>
        Share the tools, grow the community
      </h1>
      <p className="text-muted" style={{ fontSize: '1.1rem', marginBottom: '2rem' }}>
        Garden Tool Share lets neighbours lend and borrow gardening equipment for free.
        No more buying a spade you'll use once.
      </p>

      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link to="/tools">
          <button className="btn btn-primary">Browse available tools</button>
        </Link>
        {!user && (
          <Link to="/register">
            <button className="btn btn-secondary">Join for free</button>
          </Link>
        )}
        {user && (
          <Link to="/add-tool">
            <button className="btn btn-secondary">Share one of your tools</button>
          </Link>
        )}
      </div>

      <div className="card-grid" style={{ marginTop: '3rem', textAlign: 'left' }}>
        {[
          { icon: '🌱', title: 'Free to use',      body: 'No fees, no subscriptions. Just neighbours helping neighbours.' },
          { icon: '🔒', title: 'Your account',      body: 'Sign up with email or use your Google account.' },
          { icon: '🤝', title: 'Simple requests',   body: 'Request a tool, the owner approves, and you arrange collection.' },
        ].map(({ icon, title, body }) => (
          <div key={title} className="card">
            <div style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>{icon}</div>
            <strong>{title}</strong>
            <p className="text-sm text-muted mt-1">{body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
