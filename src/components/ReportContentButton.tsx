"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface Props {
  contentId: string;
  contentType: string;
}

export function ReportContentButton({ contentId, contentType }: Props) {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    const reason = prompt("Describe the issue (optional)") || "";
    try {
      const res = await fetch("/api/content-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentType, contentId, reason }),
      });
      if (res.ok) {
        setSubmitted(true);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to submit report");
      }
    } catch {
      setError("Failed to submit report");
    }
  };

  if (submitted) {
    return <span className="text-sm text-muted-foreground">Reported</span>;
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <Button variant="outline" size="sm" onClick={handleClick}>
        Report
      </Button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
