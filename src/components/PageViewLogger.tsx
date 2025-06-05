"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useUser } from "@/contexts/UserContext";

export function PageViewLogger() {
  const pathname = usePathname();
  const { user } = useUser();

  useEffect(() => {
    const logPageView = async (url: string) => {
      try {
        await fetch("/api/log-page-view", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ path: url, user_id: user?.id }),
        });
      } catch (err) {
        console.error("Failed to log page view", err);
      }
    };

    // Log page view when pathname changes
    logPageView(pathname);
  }, [pathname, user]);

  return null;
}
