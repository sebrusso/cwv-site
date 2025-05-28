'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useUser } from '@/contexts/UserContext';
import { supabase } from '@/lib/supabase';
import { fetchWithRetry } from '@/lib/api';

export default function ResourcesPage() {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [downloadCount, setDownloadCount] = useState<number | null>(null);

  useEffect(() => {
    const fetchCount = async () => {
      const { count } = await supabase
        .from('dataset_downloads')
        .select('id', { count: 'exact', head: true });
      if (count !== null) setDownloadCount(count);
    };
    fetchCount();
  }, []);
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
    <div className="max-w-3xl mx-auto flex flex-col gap-8">
      <h1 className="text-2xl font-semibold">Resources</h1>
      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-medium">Dataset</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {datasetInfo.description}
        </p>
        {downloadCount !== null && (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Downloads: {downloadCount}
          </p>
        )}
        {user ? (
          <Button onClick={handleDownload} disabled={loading} className="w-fit">
            {loading ? 'Preparing...' : 'Download Dataset'}
          </Button>
        ) : (
          <p>You must be logged in to download the dataset.</p>
        )}
      </section>
      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-medium">Research Paper</h2>
        <a href="/paper.pdf">
          <Image
            src="/paper-placeholder.svg"
            alt="Paper preview"
            width={600}
            height={800}
            className="border rounded-lg"
          />
        </a>
        <a href="/paper.pdf" className="underline w-fit">
          Download PDF
        </a>
      </section>
    </div>
  );
}
