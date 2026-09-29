// Centralized API configuration supporting both Vite proxy and direct backend URL
const isDev = import.meta.env.DEV;
export const API_BASE = isDev ? '/api/v1' : '/api/v1';
export const DIRECT_API_FALLBACK = 'http://localhost:8080/api/v1';

export async function fetchApi(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
  try {
    const res = await fetch(url, options);
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`HTTP ${res.status}: ${errText || res.statusText}`);
    }
    return await res.json();
  } catch (err) {
    // If proxy failed, attempt direct fallback in dev mode
    if (isDev && !endpoint.startsWith('http')) {
      try {
        const directUrl = `${DIRECT_API_FALLBACK}${endpoint}`;
        const fallbackRes = await fetch(directUrl, options);
        if (!fallbackRes.ok) {
          const errText = await fallbackRes.text();
          throw new Error(`HTTP ${fallbackRes.status}: ${errText || fallbackRes.statusText}`);
        }
        return await fallbackRes.json();
      } catch (fallbackErr) {
        throw new Error(`Backend Connection Failed: ${fallbackErr.message}. Ensure backend is running via 'python server.py' on port 8080.`);
      }
    }
    throw new Error(`API Error (${endpoint}): ${err.message}`);
  }
}
