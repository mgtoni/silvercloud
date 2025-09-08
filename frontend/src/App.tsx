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
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link to="/" className="text-xl font-bold">Silvercloud</Link>
              </div>
            </div>
            <div className="flex items-center">
              {!session ? (
                <Link to="/login" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-200">Login</Link>
              ) : (
                <>
                  <Link to="/dashboard" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-200">Dashboard</Link>
                  <Link to="/program" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-200">Program</Link>
                  <Link to="/assessments" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-200">Assessments</Link>
                  <Link to="/progress" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-200">Progress</Link>
                  <Link to="/messages" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-200">Messages</Link>
                  <Link to="/assets" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-200">Assets</Link>
                  <Link to="/caseload" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-200">Caseload</Link>
                  <button onClick={handleLogout} className="ml-4 px-3 py-2 rounded-md text-sm font-medium text-white bg-red-500 hover:bg-red-600">Logout</button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          {/* Protected Routes */}
          <Route path="/dashboard" element={session ? <Dashboard /> : <Login />} />
          <Route path="/program" element={session ? <Program /> : <Login />} />
          <Route path="/assessments" element={session ? <Assessments /> : <Login />} />
          <Route path="/progress" element={session ? <Progress /> : <Login />} />
          <Route path="/caseload" element={session ? <Caseload /> : <Login />} />
          <Route path="/messages" element={session ? <Messages /> : <Login />} />
          <Route path="/assets" element={session ? <Assets /> : <Login />} />
        </Routes>
      </main>
    </div>
  );
};

export default App;
