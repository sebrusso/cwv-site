'use client';
import { useEffect, useState } from 'react';

interface Entry {
  model: string;
  mode: string;
  wins: number;
  losses: number;
}

function winRate(entry: Entry) {
  const total = entry.wins + entry.losses;
  return total === 0 ? 0 : entry.wins / total;
}

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [mode, setMode] = useState('all');
  const [quality, setQuality] = useState<{ evaluationTime: number; promptSimilarity: number; confidenceScore: number } | null>(null);
  const [qualityError, setQualityError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/model-leaderboard');
        if (res.ok) {
          const data = await res.json();
          setEntries(data);
        }
      } catch {
        // ignore errors for now
      }
      try {
        const qRes = await fetch('/api/evaluation-quality');
        if (qRes.ok) {
          const qData = await qRes.json();
          setQuality(qData);
        } else {
          setQualityError('Failed to load metrics');
        }
      } catch {
        setQualityError('Failed to load metrics');
      }
    };
    fetchData();
  }, []);

  const modes = Array.from(new Set(entries.map((e) => e.mode)));
  const filtered = mode === 'all' ? entries : entries.filter((e) => e.mode === mode);

  const sorted = [...filtered].sort((a, b) => winRate(b) - winRate(a));

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Model Leaderboard</h1>
      {modes.length > 1 && (
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value)}
          className="w-fit border rounded p-2"
        >
          <option value="all">All Modes</option>
          {modes.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      )}
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
                Win Rate
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {sorted.map((e, i) => (
              <tr key={`${e.model}-${e.mode}`}>
                <td className="px-4 py-2 text-sm">{i + 1}</td>
                <td className="px-4 py-2 text-sm">{e.model}</td>
                <td className="px-4 py-2 text-sm">{(winRate(e) * 100).toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {quality && (
        <div className="mt-4 text-sm">
          <p>Average evaluation time: {quality.evaluationTime.toFixed(0)} ms</p>
          <p>Average prompt similarity: {(quality.promptSimilarity * 100).toFixed(1)}%</p>
          <p>Average confidence score: {quality.confidenceScore.toFixed(2)}</p>
        </div>
      )}
      {qualityError && (
        <div className="text-red-500 text-sm">{qualityError}</div>
      )}
    </div>
  );
}
