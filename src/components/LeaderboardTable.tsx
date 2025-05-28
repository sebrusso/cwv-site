"use client";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toCSV, CSVColumn } from "@/lib/csv";

export interface TableColumn<T> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  render?: (row: T) => React.ReactNode;
}

interface LeaderboardTableProps<T extends { model: string }> {
  entries: T[];
  columns: TableColumn<T>[];
  exportName: string;
}

export function LeaderboardTable<T extends { model: string }>({
  entries,
  columns,
  exportName,
}: LeaderboardTableProps<T>) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<keyof T | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  function toggleSort(key: keyof T) {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  const filtered = entries.filter((e) =>
    e.model.toLowerCase().includes(search.toLowerCase())
  );
  const sorted = [...filtered];
  if (sortKey) {
    sorted.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (av === bv) return 0;
      return av > bv ? (sortDir === "asc" ? 1 : -1) : sortDir === "asc" ? -1 : 1;
    });
  }

  function handleExport() {
    const csv = toCSV(sorted, columns as CSVColumn<T>[]);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = exportName;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search model"
          className="sm:w-64"
        />
        <Button variant="outline" onClick={handleExport} className="w-fit">
          Export CSV
        </Button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr>
              <th className="px-4 py-2 text-left">#</th>
              {columns.map((c) => (
                <th
                  key={String(c.key)}
                  className={`px-4 py-2 text-left ${c.sortable ? "cursor-pointer select-none" : ""}`}
                  onClick={() => c.sortable && toggleSort(c.key)}
                >
                  {c.label}
                  {sortKey === c.key ? (sortDir === "asc" ? " ▲" : " ▼") : null}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row, i) => (
              <tr key={row.model} className="odd:bg-gray-50 dark:odd:bg-gray-800">
                <td className="px-4 py-2">
                  <Badge variant="secondary">{i + 1}</Badge>
                </td>
                {columns.map((c) => (
                  <td key={String(c.key)} className="px-4 py-2 whitespace-nowrap">
                    {c.render ? c.render(row) : String(row[c.key])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
