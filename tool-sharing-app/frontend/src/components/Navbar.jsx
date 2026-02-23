import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';

export default function Navbar({ user, setUser }) {
  const navigate = useNavigate();

  async function handleLogout() {
    await api.logout().catch(() => {});
    setUser(null);
    navigate('/');
  }

  return (
    <nav className="navbar">
      <div className="container">
        <Link to="/" className="brand">Garden Tool Share</Link>

        <div className="nav-links">
          <Link to="/tools">Browse Tools</Link>

          {user ? (
            <>
              <Link to="/my-tools">My Tools</Link>
              <Link to="/requests">Requests</Link>
              <Link to="/add-tool">+ Add Tool</Link>
              <button
                onClick={handleLogout}
                className="btn btn-secondary btn-sm"
                style={{ marginLeft: '0.5rem' }}
              >
                Log out ({user.name})
              </button>
            </>
          ) : (
            <>
              <Link to="/login">Log in</Link>
              <Link to="/register">
                <button className="btn btn-secondary btn-sm">Join free</button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
