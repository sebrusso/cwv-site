'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useUser } from '@/contexts/UserContext';
import { fetchWithRetry } from '@/lib/api';

export default function DatasetPage() {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const datasetInfo = {
    description:
      'Dataset of AI vs human story comparisons in Parquet format. Size ~100MB.',
  };

  const handleDownload = async () => {
    setLoading(true);
    try {
      const res = await fetchWithRetry('/api/download-dataset');
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
      <p className="text-sm text-gray-600 dark:text-gray-400">
        {datasetInfo.description}
      </p>
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
