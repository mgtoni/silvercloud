import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL and anon key are required.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Function to get the auth token from local storage
const getAuthToken = () => {
  const session = localStorage.getItem('supabase.auth.token');
  if (session) {
    try {
      const parsedSession = JSON.parse(session);
      return parsedSession.access_token;
    } catch (e) {
      console.error('Error parsing auth token from local storage', e);
      return null;
    }
  }
  return null;
};

// API client for interacting with your backend
export const apiClient = {
  get: async (path: string) => {
    const token = getAuthToken();
    const response = await fetch(`/api${path}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
    });
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    return response.json();
  },
  post: async (path: string, data: any) => {
    const token = getAuthToken();
    const response = await fetch(`/api${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    return response.json();
  },
  // Add other methods like PUT, DELETE as needed
};
