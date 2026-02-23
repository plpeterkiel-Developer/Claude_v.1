/**
 * api.js — thin wrapper around fetch
 *
 * All requests use credentials: 'include' so the session cookie is sent.
 * Vite proxies /auth, /tools, /requests to http://localhost:3001 in dev,
 * so we can use relative paths everywhere — no hard-coded ports.
 */

async function request(method, path, body) {
  const options = {
    method,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  };
  if (body !== undefined) options.body = JSON.stringify(body);

  const res = await fetch(path, options);
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const message = data?.error ?? `Request failed (${res.status})`;
    throw Object.assign(new Error(message), { status: res.status });
  }
  return data;
}

export const api = {
  // Auth
  register:   (body) => request('POST', '/auth/register', body),
  login:      (body) => request('POST', '/auth/login',    body),
  logout:     ()     => request('POST', '/auth/logout'),
  me:         ()     => request('GET',  '/auth/me'),

  // Tools
  getTools:   ()         => request('GET',    '/tools'),
  getMyTools: ()         => request('GET',    '/tools/mine'),
  getTool:    (id)       => request('GET',    `/tools/${id}`),
  addTool:    (body)     => request('POST',   '/tools',     body),
  updateTool: (id, body) => request('PUT',    `/tools/${id}`, body),
  deleteTool: (id)       => request('DELETE', `/tools/${id}`),

  // Requests
  getMyRequests:       ()         => request('GET',  '/requests/mine'),
  getReceivedRequests: ()         => request('GET',  '/requests/received'),
  borrowTool:          (toolId, body) => request('POST', `/requests/tool/${toolId}`, body),
  updateRequest:       (id, status)   => request('PUT',  `/requests/${id}`, { status }),
};
