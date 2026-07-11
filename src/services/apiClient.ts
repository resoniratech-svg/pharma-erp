let BASE_URL = import.meta.env.VITE_API_URL || 'https://pharma-erp-pharma-backend.rrh5yv.easypanel.host/api';

if (typeof window !== 'undefined') {
  const storedOverride = localStorage.getItem('VITE_API_URL');
  if (storedOverride) {
    BASE_URL = storedOverride;
  } else if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    if (BASE_URL.includes('localhost') || BASE_URL.includes('127.0.0.1')) {
      const apiHost = window.location.hostname.replace('-web', '-backend');
      BASE_URL = `${window.location.protocol}//${apiHost}/api`;
    }
  }
}

interface RequestOptions extends RequestInit {
  bodyData?: any;
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const token = localStorage.getItem('authToken');
  
  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const fetchOptions: RequestInit = {
    ...options,
    headers,
  };

  if (options.bodyData) {
    fetchOptions.body = JSON.stringify(options.bodyData);
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, fetchOptions);

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    
    if (
      response.status === 401 &&
      (errorBody.code === 'SESSION_TERMINATED' ||
        errorBody.message?.includes('Session terminated') ||
        errorBody.message?.includes('another device'))
    ) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser');
      localStorage.removeItem('activeRole');
      localStorage.removeItem('workspaceRole');
      localStorage.removeItem('userId');
      localStorage.removeItem('mrId');
      localStorage.removeItem('mrCode');
      localStorage.removeItem('mrTerritory');
      
      alert("Your session has been terminated because you logged in from another device.");
      window.location.href = '/workspace';
    }

    throw new Error(errorBody.message || errorBody.error || `Request failed with status ${response.status}`);
  }

  return response.json();
}
