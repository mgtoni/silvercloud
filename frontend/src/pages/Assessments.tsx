import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

interface Assessment {
  id: number;
  name: string;
  questions: string[];
}

const Assessments: React.FC = () => {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAssessments = async () => {
      try {
        const session = await supabase.auth.getSession();
        if (!session.data.session) {
          throw new Error('Not authenticated');
        }

        const response = await fetch('/api/assessments', {
          headers: {
            'Authorization': `Bearer ${session.data.session.access_token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch assessments');
        }

        const data = await response.json();
        setAssessments(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAssessments();
  }, []);

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Assessments</h1>
      <div className="space-y-4">
        {assessments.map(assessment => (
          <div key={assessment.id} className="p-4 border rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold">{assessment.name}</h2>
            <button className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
              Start Assessment
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Assessments;
