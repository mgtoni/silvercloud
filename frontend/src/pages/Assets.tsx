import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

interface Asset {
  name: string;
  url: string;
}

const Assets: React.FC = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAssets = async () => {
      try {
        const session = await supabase.auth.getSession();
        if (!session.data.session) {
          throw new Error('Not authenticated');
        }

        const response = await fetch('/api/assets', {
          headers: {
            'Authorization': `Bearer ${session.data.session.access_token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch assets');
        }

        const data = await response.json();
        setAssets(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAssets();
  }, []);

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Assets</h1>
      <div className="space-y-2">
        {assets.map(asset => (
          <a 
            key={asset.name} 
            href={asset.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="block p-2 border rounded-lg hover:bg-gray-100"
          >
            {asset.name}
          </a>
        ))}
      </div>
    </div>
  );
};

export default Assets;
