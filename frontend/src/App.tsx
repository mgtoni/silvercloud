import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import Home from './pages/Home';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Program from './pages/Program';
import Assessments from './pages/Assessments';
import Progress from './pages/Progress';
import Caseload from './pages/Caseload';
import Messages from './pages/Messages';
import Assets from './pages/Assets';
import type { Session } from '@supabase/supabase-js';

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const navigate = useNavigate(); // Use useNavigate hook

  useEffect(() => {
    const loadSession = async () => {
      const accessToken = localStorage.getItem('supabase_access_token');
      const refreshToken = localStorage.getItem('supabase_refresh_token');

      if (accessToken && refreshToken) {
        try {
          const { data: { session: newSession }, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) throw error;
          setSession(newSession);
        } catch (error) {
          console.error("Error setting session from localStorage:", error);
          // Clear invalid tokens
          localStorage.removeItem('supabase_access_token');
          localStorage.removeItem('supabase_refresh_token');
          setSession(null);
        }
      } else {
        setSession(null);
      }
    };

    loadSession();

    // We no longer rely on onAuthStateChange for initial session load
    // but it can still be useful for other auth events if needed.
    // For now, we'll remove it to simplify.
    // const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    //   setSession(session);
    // });
    // return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.removeItem('supabase_access_token');
      localStorage.removeItem('supabase_refresh_token');
      setSession(null);
      navigate('/login'); // Redirect to login page after logout
    } catch (error) {
      console.error("Error during logout:", error);
      alert("Logout failed.");
    }
  };

  return (
    return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-100">
