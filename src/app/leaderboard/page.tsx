'use client';
import { useEffect, useState } from 'react';
import { Tabs } from '@/components/Tabs';
import { LeaderboardTable, TableColumn } from '@/components/LeaderboardTable';
import { config } from '@/config';
import {
  sortBySuccessRate,
  sortByWinRate,
  HumanDeceptionEntry,
  QualityEntry,
} from '@/lib/leaderboard';

function HumanDeceptionLeaderboard() {
  const [entries, setEntries] = useState<HumanDeceptionEntry[]>([]);
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      const params = new URLSearchParams();
      if (start) params.set('start', start);
      if (end) params.set('end', end);
      try {
        const res = await fetch(
          `/api/human-deception-leaderboard?${params.toString()}`,
        );
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

  const columns: TableColumn<HumanDeceptionEntry>[] = [
    { key: 'model', label: 'Model', sortable: true },
    { key: 'total', label: 'Evaluations', sortable: true },
    {
      key: 'successRate',
      label: 'Success Rate',
      sortable: true,
      render: (r) => `${(r.successRate * 100).toFixed(1)}%`,
    },
  ];

  return (
    <div className="space-y-2">
      {config.showLeaderboardDateFilters && (
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
      )}
      <LeaderboardTable
        entries={sortBySuccessRate(entries)}
        columns={columns}
        exportName="human-deception.csv"
      />
    </div>
  );
}

function ModelComparisonLeaderboard() {
  const [entries, setEntries] = useState<QualityEntry[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/model-quality-leaderboard');
        if (res.ok) {
          const data = await res.json();
          setEntries(data.leaderboard);
        }
      } catch {
        // ignore errors for now
      }
    };
    fetchData();
  }, []);

  const columns: TableColumn<QualityEntry & { winRate: number }>[] = [
    { key: 'model', label: 'Model', sortable: true },
    { key: 'wins', label: 'Wins', sortable: true },
    { key: 'losses', label: 'Losses', sortable: true },
    {
      key: 'winRate',
      label: 'Win Rate',
      sortable: true,
      render: (r) => `${(r.winRate * 100).toFixed(1)}%`,
    },
  ];

  const withRate = entries.map((e) => ({
    ...e,
    winRate: e.wins + e.losses ? e.wins / (e.wins + e.losses) : 0,
  }));

  return (
    <LeaderboardTable
      entries={sortByWinRate(withRate)}
      columns={columns}
      exportName="model-vs-model.csv"
    />
  );
}

export default function LeaderboardPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <h1 className="text-2xl font-semibold">Leaderboards</h1>
      <Tabs
        tabs={[
          { key: 'deception', title: 'Human Deception', content: <HumanDeceptionLeaderboard /> },
          { key: 'quality', title: 'Model vs Model', content: <ModelComparisonLeaderboard /> },
        ]}
      />
    </div>
  );
}
