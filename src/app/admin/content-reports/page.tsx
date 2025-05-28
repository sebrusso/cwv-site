"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

interface Report {
  id: string;
  user_id: string;
  content_type: string;
  content_id: string;
  reason: string | null;
  resolved: boolean;
  created_at: string;
}

export default function ContentReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);

  const loadReports = async () => {
    const res = await fetch("/api/content-report");
    if (res.ok) {
      const data = await res.json();
      setReports(data as Report[]);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const markResolved = async (id: string) => {
    await fetch("/api/content-report", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, resolved: true }),
    });
    setReports((prev) => prev.map((r) => (r.id === id ? { ...r, resolved: true } : r)));
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-semibold mb-4">Content Reports</h1>
      <table className="w-full text-sm border">
        <thead>
          <tr className="bg-gray-100 dark:bg-gray-800">
            <th className="p-2 border">Type</th>
            <th className="p-2 border">Content ID</th>
            <th className="p-2 border">Reason</th>
            <th className="p-2 border">Resolved</th>
            <th className="p-2 border">Action</th>
          </tr>
        </thead>
        <tbody>
          {reports.map((r) => (
            <tr key={r.id} className="border-t">
              <td className="p-2 border">{r.content_type}</td>
              <td className="p-2 border font-mono text-xs">{r.content_id}</td>
              <td className="p-2 border">{r.reason}</td>
              <td className="p-2 border">{r.resolved ? "Yes" : "No"}</td>
              <td className="p-2 border">
                {!r.resolved && (
                  <Button size="sm" onClick={() => markResolved(r.id)}>
                    Resolve
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
