import RoomDatabase from './roomDatabase';

export const API_URL = (process.env.EXPO_PUBLIC_API_URL || 'https://happylokam.com/api/v1').replace(/\/$/, '');

async function fetchWithAuth(endpoint: string, options: RequestInit = {}): Promise<any> {
  const session = await RoomDatabase.getUserSession();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (session?.token) {
    headers.Authorization = `Bearer ${session.token}`;
  }

  const res = await fetch(`${API_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`, {
    ...options,
    headers,
  });

  return res.json();
}

export const apiClient = {
  get: (endpoint: string) => fetchWithAuth(endpoint, { method: 'GET' }),
  post: (endpoint: string, body: any) => fetchWithAuth(endpoint, { method: 'POST', body: JSON.stringify(body) }),
  put: (endpoint: string, body: any) => fetchWithAuth(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (endpoint: string) => fetchWithAuth(endpoint, { method: 'DELETE' }),
};

export const getEvents = async () => {
  try {
    const data = await apiClient.get('/events');
    return data;
  } catch (error) {
    console.error('Error fetching events:', error);
    return { success: false, events: [] };
  }
};

export const getLoksafari = async () => {
  try {
    const data = await apiClient.get('/loksafari');
    return data;
  } catch (error) {
    console.error('Error fetching loksafari:', error);
    return { success: false, loksafaris: [] };
  }
};
