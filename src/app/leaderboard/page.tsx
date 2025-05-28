'use client';
import { useEffect, useState } from 'react';

interface Entry {
  model: string;
  wins: number;
  losses: number;
}

type Matrix = Record<string, Record<string, number>>;

function winRate(entry: Entry) {
  const total = entry.wins + entry.losses;
  return total === 0 ? 0 : entry.wins / total;
}

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [matrix, setMatrix] = useState<Matrix>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/model-quality-leaderboard');
        if (res.ok) {
          const json = await res.json();
          setEntries(json.leaderboard);
          setMatrix(json.matrix);
        }
      } catch {
        // ignore errors for now
      }
    };
    fetchData();
  }, []);

  const sorted = [...entries].sort((a, b) => winRate(b) - winRate(a));

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Model Leaderboard</h1>
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
              <tr key={e.model}>
                <td className="px-4 py-2 text-sm">{i + 1}</td>
                <td className="px-4 py-2 text-sm">{e.model}</td>
                <td className="px-4 py-2 text-sm">{(winRate(e) * 100).toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {Object.keys(matrix).length > 0 && (
        <div className="overflow-x-auto">
          <h2 className="text-xl font-semibold mt-6">Head to Head Wins</h2>
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 mt-2">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Model
                </th>
                {Object.keys(matrix).map((m) => (
                  <th key={m} className="px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-300">
                    {m}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {Object.keys(matrix).map((row) => (
                <tr key={row}>
                  <th className="px-4 py-2 text-sm text-left">{row}</th>
                  {Object.keys(matrix).map((col) => (
                    <td key={col} className="px-4 py-2 text-sm text-center">
                      {row === col ? '-' : matrix[row]?.[col] ?? 0}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
