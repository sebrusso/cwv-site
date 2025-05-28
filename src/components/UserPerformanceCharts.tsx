"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Get the current session to include the access token
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          setError('No session found. Please log in again.');
          return;
        }

        const res = await fetch("/api/user-dashboard", {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        });
        
        if (res.ok) {
          const json = await res.json();
          setData(json);
        } else {
          const errorText = await res.text();
          setError(`Failed to fetch dashboard data: ${res.status} ${errorText}`);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('An unexpected error occurred while loading your dashboard.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
        </div>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
        </div>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
          <div className="h-6 bg-gray-200 rounded w-24"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-4 p-6 border border-red-200 rounded-lg bg-red-50">
        <h3 className="text-lg font-semibold text-red-800">Error Loading Dashboard</h3>
        <p className="text-red-600">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 w-fit"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data) {
    return <p>No data available.</p>;
  }

  // Handle case where user has no evaluation data yet
  if (data.daily.length === 0) {
    return (
      <div className="flex flex-col gap-4 p-6 border border-gray-200 rounded-lg bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-800">Welcome to Your Dashboard!</h3>
        <p className="text-gray-600">
          You haven't completed any evaluations yet. Start evaluating to see your performance metrics here.
        </p>
        <a 
          href="/human-machine" 
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 w-fit"
        >
          Start Evaluating
        </a>
      </div>
    );
  }

  const accuracy = data.daily.map((d) => (d.total ? d.correct / d.total : 0));
  const counts = data.daily.map((d) => d.total);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold mb-2">Accuracy Over Time</h2>
        <div className="p-4 border rounded-lg">
          <LineChart values={accuracy} />
          <p className="text-sm text-gray-600 mt-2">
            Overall accuracy: {data.total.total > 0 ? Math.round((data.total.correct / data.total.total) * 100) : 0}% 
            ({data.total.correct}/{data.total.total})
          </p>
        </div>
      </div>
      <div>
        <h2 className="text-lg font-semibold mb-2">Evaluations Per Day</h2>
        <div className="p-4 border rounded-lg">
          <BarChart values={counts} />
          <p className="text-sm text-gray-600 mt-2">
            Total evaluations: {data.total.total}
          </p>
        </div>
      </div>
      <div>
        <h2 className="text-lg font-semibold mb-2">Ranking</h2>
        <div className="p-4 border rounded-lg">
          <p className="text-lg">
            Position {data.ranking.position} of {data.ranking.totalUsers}
          </p>
          <p className="text-sm text-gray-600">
            {data.ranking.totalUsers > 1 
              ? `You're in the top ${Math.round((data.ranking.position / data.ranking.totalUsers) * 100)}%`
              : "You're the only user so far!"
            }
          </p>
        </div>
      </div>
    </div>
  );
}
