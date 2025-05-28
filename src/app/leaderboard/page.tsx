'use client';
import { useEffect, useState } from 'react';

interface Entry {
  model: string;
  total: number;
  successRate: number;
}

function sortByRate(a: Entry, b: Entry) {
  return b.successRate - a.successRate;
}

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      const params = new URLSearchParams();
      if (start) params.set('start', start);
      if (end) params.set('end', end);
      try {
        const res = await fetch(`/api/human-deception-leaderboard?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setEntries(data);
        }
      } catch {
        // ignore errors for now
      }
    };
    fetchData();
  }, [start, end]);

  const sorted = [...entries].sort(sortByRate);

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Model Leaderboard</h1>
      <div className="flex gap-2 items-center">
        <label className="text-sm">
          Start:
          <input
            type="date"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="border rounded p-1 ml-1"
          />
        </label>
        <label className="text-sm">
          End:
          <input
            type="date"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            className="border rounded p-1 ml-1"
          />
        </label>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                #
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Model
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Evaluations
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Success Rate
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {sorted.map((e, i) => (
              <tr key={e.model}>
                <td className="px-4 py-2 text-sm">{i + 1}</td>
                <td className="px-4 py-2 text-sm">{e.model}</td>
                <td className="px-4 py-2 text-sm">{e.total}</td>
                <td className="px-4 py-2 text-sm">{(e.successRate * 100).toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
