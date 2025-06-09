'use client';
import { useEffect, useState } from 'react';
import { Tabs } from '@/components/Tabs';
import { LeaderboardTable, TableColumn } from '@/components/LeaderboardTable';
import { config } from '@/lib/config-client';
import {
  sortBySuccessRate,
  sortByWinRate,
  sortByAccuracy,
  HumanDeceptionEntry,
  QualityEntry,
  SpeedModeEntry,
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

function SpeedModeLeaderboard() {
  const [entries, setEntries] = useState<SpeedModeEntry[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/speed-mode-leaderboard');
        if (res.ok) {
          const data = await res.json();
          setEntries(data);
        }
      } catch {
        // ignore errors
      }
    };
    fetchData();
  }, []);

  const tableData = entries.map((e) => ({ ...e, model: e.username }));

  const columns: TableColumn<(typeof tableData)[number]>[] = [
    { key: 'model', label: 'Username', sortable: true },
    { key: 'total_correct', label: 'Correct', sortable: true },
    { key: 'attempts', label: 'Attempts', sortable: true },
    {
      key: 'accuracy',
      label: 'Accuracy',
      sortable: true,
      render: (r) => `${(r.accuracy * 100).toFixed(1)}%`,
    },
    { key: 'best_streak', label: 'Best Streak', sortable: true },
  ];

  return (
    <LeaderboardTable
      entries={sortByAccuracy(tableData)}
      columns={columns}
      exportName="speed-mode.csv"
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
          { key: 'speed', title: 'Speed Mode', content: <SpeedModeLeaderboard /> },
        ]}
      />
    </div>
  );
}
