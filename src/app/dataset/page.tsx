'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { postJsonWithRetry } from '@/lib/api';
import { logEvent } from '@/lib/eventLogger';

export default function DatasetPage() {
  const [email, setEmail] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const datasetInfo = {
    description:
      'Dataset of AI vs human story comparisons in Parquet format. Size ~100MB.',
  };

  const handleDownload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email !== confirmEmail) return;
    setLoading(true);
    setError(null);
    try {
      const res = await postJsonWithRetry('/api/request-dataset', { email });
      if (res.ok) {
        const { url } = await res.json();
        void logEvent('dataset_download');
        window.location.href = url;
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Failed to get download link');
      }
    } catch {
      setError('Failed to get download link');
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
      <form onSubmit={handleDownload} className="flex flex-col gap-4">
        <Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <Input
          type="email"
          placeholder="Confirm Email"
          value={confirmEmail}
          onChange={e => setConfirmEmail(e.target.value)}
          required
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <Button type="submit" disabled={loading || email !== confirmEmail} className="w-fit">
          {loading ? 'Preparing...' : 'Get Download Link'}
        </Button>
      </form>
    </div>
  );
}
