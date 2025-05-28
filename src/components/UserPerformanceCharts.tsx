"use client";
import { useEffect, useState } from "react";

interface DailyStats {
  date: string;
  correct: number;
  total: number;
}

interface DashboardData {
  daily: DailyStats[];
  total: { correct: number; total: number };
  ranking: { position: number; totalUsers: number };
}

function LineChart({ values }: { values: number[] }) {
  if (values.length === 0) return null;
  const width = 300;
  const height = 100;
  const step = values.length > 1 ? width / (values.length - 1) : 0;
  const points = values
    .map((v, i) => `${i * step},${(1 - v) * height}`)
    .join(" ");
  return (
    <svg width={width} height={height} className="stroke-blue-500 fill-none">
      <polyline points={points} />
    </svg>
  );
}

function BarChart({ values }: { values: number[] }) {
  if (values.length === 0) return null;
  const width = 300;
  const height = 100;
  const max = Math.max(...values, 1);
  const barWidth = width / values.length;
  return (
    <svg width={width} height={height} className="fill-indigo-500">
      {values.map((v, i) => {
        const h = (v / max) * height;
        return <rect key={i} x={i * barWidth} y={height - h} width={barWidth - 2} height={h} />;
      })}
    </svg>
  );
}

export default function UserPerformanceCharts() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/user-dashboard");
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch {
        // ignore errors
      }
    };
    fetchData();
  }, []);

  if (!data) {
    return <p>Loading...</p>;
  }

  const accuracy = data.daily.map((d) => (d.total ? d.correct / d.total : 0));
  const counts = data.daily.map((d) => d.total);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold mb-2">Accuracy Over Time</h2>
        <LineChart values={accuracy} />
      </div>
      <div>
        <h2 className="text-lg font-semibold mb-2">Evaluations Per Day</h2>
        <BarChart values={counts} />
      </div>
      <div>
        <h2 className="text-lg font-semibold mb-2">Ranking</h2>
        <p>
          Position {data.ranking.position} of {data.ranking.totalUsers}
        </p>
      </div>
    </div>
  );
}
