import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

interface ProgressData {
  completion_percentage: number;
  assessment_trends: Record<string, number[]>;
}

const Progress: React.FC = () => {
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const session = await supabase.auth.getSession();
        if (!session.data.session) {
          throw new Error('Not authenticated');
        }

        const response = await fetch('/api/progress', {
          headers: {
            'Authorization': `Bearer ${session.data.session.access_token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch progress');
        }

        const data = await response.json();
        setProgress(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProgress();
  }, []);

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Your Progress</h1>
      {progress && (
        <div className="space-y-4">
          <div className="p-4 border rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold">Completion</h2>
            <p className="text-3xl font-bold">{progress.completion_percentage}%</p>
          </div>
          <div className="p-4 border rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold">Assessment Trends</h2>
            {Object.entries(progress.assessment_trends).map(([name, scores]) => (
              <div key={name} className="mt-2">
                <h3 className="font-medium">{name}</h3>
                <p>{scores.join(', ')}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Progress;
