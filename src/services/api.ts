export const getBaseUrl = () => {
  return import.meta.env.VITE_API_URL || 'https://pharma-erp-pharma-backend.rrh5yv.easypanel.host/api';
};

export const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const baseUrl = getBaseUrl();
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
