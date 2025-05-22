'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useUser } from '@/contexts/UserContext';

export default function DatasetPage() {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/download-dataset');
      if (res.ok) {
        const { url } = await res.json();
        window.location.href = url;
      } else if (res.status === 401) {
        alert('Please log in to download.');
      } else {
        alert('Failed to get download link');
      }
    } catch {
      alert('Failed to get download link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Dataset Download</h1>
      {user ? (
        <Button onClick={handleDownload} disabled={loading} className="w-fit">
          {loading ? 'Preparing...' : 'Download Dataset'}
        </Button>
      ) : (
        <p>You must be logged in to download the dataset.</p>
      )}
    </div>
  );
}
