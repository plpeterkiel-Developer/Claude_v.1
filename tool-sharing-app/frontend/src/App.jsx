/**
 * App.jsx — root component
 *
 * Manages the global auth state (current user).
 * Passes user + setUser down as props so every page can read/update it.
 */

import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate }    from 'react-router-dom';
import { api }    from './api';
import Navbar     from './components/Navbar';
import Home       from './pages/Home';
import Login      from './pages/Login';
import Register   from './pages/Register';
import Tools      from './pages/Tools';
import MyTools    from './pages/MyTools';
import AddTool    from './pages/AddTool';
import Requests   from './pages/Requests';

export default function App() {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if there's already an active session on first load
  useEffect(() => {
    api.me()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return null; // avoid flash of unauthenticated content

  return (
    <>
      <Navbar user={user} setUser={setUser} />
      <main className="container" style={{ padding: '1rem' }}>
        <Routes>
          <Route path="/"         element={<Home   user={user} />} />
          <Route path="/tools"    element={<Tools  user={user} />} />
          <Route path="/login"    element={user ? <Navigate to="/" /> : <Login    setUser={setUser} />} />
          <Route path="/register" element={user ? <Navigate to="/" /> : <Register setUser={setUser} />} />

          {/* Protected routes redirect to /login if not authenticated */}
          <Route path="/my-tools"  element={user ? <MyTools  user={user} />           : <Navigate to="/login" />} />
          <Route path="/add-tool"  element={user ? <AddTool  user={user} />           : <Navigate to="/login" />} />
          <Route path="/requests"  element={user ? <Requests user={user} />           : <Navigate to="/login" />} />
        </Routes>
      </main>
    </>
  );
}
