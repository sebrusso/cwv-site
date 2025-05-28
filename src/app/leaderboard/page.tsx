"use client";
import { useEffect, useState } from "react";
import { LeaderboardTable, TableColumn } from "@/components/LeaderboardTable";
import { Tabs } from "@/components/Tabs";

interface QualityEntry {
  model: string;
  winRate: number;
}

interface DeceptionEntry {
  model: string;
  deceptionRate: number;
  total: number;
}

export default function LeaderboardPage() {
  const [quality, setQuality] = useState<QualityEntry[]>([]);
  const [deception, setDeception] = useState<DeceptionEntry[]>([]);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [qRes, dRes] = await Promise.all([
          fetch("/api/model-leaderboard"),
          fetch("/api/human-deception-leaderboard"),
        ]);
        if (qRes.ok) setQuality(await qRes.json());
        if (dRes.ok) setDeception(await dRes.json());
      } catch {
        // ignore errors
      }
    };
    fetchAll();
  }, []);

  const qualityCols: TableColumn<QualityEntry>[] = [
    {
      key: "model",
      label: "Model",
      sortable: true,
    },
    {
      key: "winRate",
      label: "Win Rate",
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-2 w-40">
          <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded">
            <div
              className="h-full bg-primary rounded"
              style={{ width: `${Math.round(row.winRate * 100)}%` }}
            />
          </div>
          <span>{(row.winRate * 100).toFixed(1)}%</span>
        </div>
      ),
    },
  ];

  const deceptionCols: TableColumn<DeceptionEntry>[] = [
    { key: "model", label: "Model", sortable: true },
    {
      key: "deceptionRate",
      label: "Fool Rate",
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-2 w-40">
          <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded">
            <div
              className="h-full bg-primary rounded"
              style={{ width: `${Math.round(row.deceptionRate * 100)}%` }}
            />
          </div>
          <span>{(row.deceptionRate * 100).toFixed(1)}%</span>
        </div>
      ),
    },
  ];

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6 p-4">
      <h1 className="text-2xl font-semibold">Leaderboards</h1>
      <Tabs
        tabs={[
          {
            key: "quality",
            title: "Model Quality",
            content: (
              <LeaderboardTable
                entries={quality}
                columns={qualityCols}
                exportName="model-quality.csv"
              />
            ),
          },
          {
            key: "deception",
            title: "Human Deception",
            content: (
              <LeaderboardTable
                entries={deception}
                columns={deceptionCols}
                exportName="human-deception.csv"
              />
            ),
          },
        ]}
      />
    </div>
  );
}
