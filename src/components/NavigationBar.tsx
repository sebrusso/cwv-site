"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { config } from "@/lib/config-client";

export function NavigationBar() {
  const pathname = usePathname();
  const linkClass = (path: string) =>
    `px-3 py-2 rounded-md text-sm font-medium ${pathname === path ? "bg-gray-200 dark:bg-gray-700" : "hover:bg-gray-100 dark:hover:bg-gray-800"}`;
  return (
    <nav className="mb-4 flex gap-2">
      <Link href="/" className={linkClass("/")}>Home</Link>
      <Link href="/human" className={linkClass("/human")}>Arena</Link>
      {config.enableResources && (
        <Link href="/resources" className={linkClass("/resources")}>Resources</Link>
      )}
      {config.enableLeaderboard && (
        <Link href="/leaderboard" className={linkClass("/leaderboard")}>Leaderboard</Link>
      )}
      {config.showDashboardLink && config.enableDashboard && (
        <Link href="/dashboard" className={linkClass("/dashboard")}>Dashboard</Link>
      )}
    </nav>
  );
}
