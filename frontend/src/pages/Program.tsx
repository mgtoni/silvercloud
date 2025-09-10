import React, { useState, useEffect } from 'react';
import { apiClient } from '../supabaseClient'; // Import apiClient

interface Exercise {
  id: number;
  title: string;
  type: string;
}

interface Lesson {
  id: number;
  title: string;
  exercises: Exercise[];
}

interface Module {
  id: number;
  title: string;
  lessons: Lesson[];
}

interface ProgramData {
  modules: Module[];
}

const Program: React.FC = () => {
  const [program, setProgram] = useState<ProgramData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProgram = async () => {
      try {
        // Use apiClient to fetch data from your backend
        const data = await apiClient.get('/program');
        setProgram(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProgram();
  }, []);

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Your Program</h1>
      {program?.modules.map(module => (
        <div key={module.id} className="mb-6">
          <h2 className="text-xl font-semibold mb-2">{module.title}</h2>
          {module.lessons.map(lesson => (
            <div key={lesson.id} className="ml-4 mb-4">
              <h3 className="text-lg font-medium mb-2">{lesson.title}</h3>
              <ul className="list-disc ml-6">
                {lesson.exercises.map(exercise => (
                  <li key={exercise.id}>{exercise.title} ({exercise.type})</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default Program;
