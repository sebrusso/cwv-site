"use client";

import { useEffect } from "react";
import { useRouter } from "next/router";
import { useUser } from "@/contexts/UserContext";

export function PageViewLogger() {
  const router = useRouter();
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

    router.events.on("routeChangeComplete", logPageView);
    // log initial page load
    logPageView(router.asPath);

    return () => {
      router.events.off("routeChangeComplete", logPageView);
    };
  }, [router, user]);

  return null;
}
