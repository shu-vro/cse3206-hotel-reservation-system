const TOKEN_KEY = 'hrs.token';
const USER_KEY = 'hrs.user';

export function session() {
  const stored = localStorage.getItem(USER_KEY);
  return {
    token: localStorage.getItem(TOKEN_KEY),
    user: stored ? JSON.parse(stored) : null
  };
}

export function saveSession(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export async function api(path, { method = 'GET', body } = {}) {
  const { token } = session();
  const headers = {};
  if (body) headers['content-type'] = 'application/json';
  if (token) headers.authorization = `Bearer ${token}`;

  const res = await fetch(`/api${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  if (res.status === 204) return null;

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed with ${res.status}`);
  return data;
}
