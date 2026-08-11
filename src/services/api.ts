export const getApiUrl = () => {
  const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  const deployedApiUrl = 'https://pharma-erp-pharma-backend.rrh5yv.easypanel.host/api';
  return isLocal ? 'http://localhost:5000/api' : deployedApiUrl;
};

export const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const baseUrl = getApiUrl();
  const token = localStorage.getItem('authToken');

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(`${baseUrl}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }

  return response.json();
};
