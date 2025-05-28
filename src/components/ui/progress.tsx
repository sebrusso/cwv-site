import React from "react";
import { cn } from "@/lib/utils";

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
}

export function Progress({ value, className, ...props }: ProgressProps) {
  return (
    <div className={cn("h-2 w-full rounded bg-muted", className)} {...props}>
      <div
        className="h-full rounded bg-primary transition-all"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

