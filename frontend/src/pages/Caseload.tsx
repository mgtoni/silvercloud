import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

interface CaseloadParticipant {
  id: string;
  name: string;
  last_activity: string;
  risk_flags: string[];
}

const Caseload: React.FC = () => {
  const [caseload, setCaseload] = useState<CaseloadParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCaseload = async () => {
      try {
        const session = await supabase.auth.getSession();
        if (!session.data.session) {
          throw new Error('Not authenticated');
        }

        const response = await fetch('http://localhost:8000/supporter/caseload', {
          headers: {
            'Authorization': `Bearer ${session.data.session.access_token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch caseload');
        }

        const data = await response.json();
        setCaseload(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCaseload();
  }, []);

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Your Caseload</h1>
      <div className="space-y-4">
        {caseload.map(participant => (
          <div key={participant.id} className="p-4 border rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold">{participant.name}</h2>
            <p>Last active: {new Date(participant.last_activity).toLocaleDateString()}</p>
            {participant.risk_flags.length > 0 && (
              <div className="mt-2">
                <h3 className="font-medium text-red-500">Risk Flags</h3>
                <ul className="list-disc ml-6">
                  {participant.risk_flags.map(flag => <li key={flag}>{flag}</li>)}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Caseload;
