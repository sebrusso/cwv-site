"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface Tab {
  key: string;
  title: string;
  content: React.ReactNode;
}

interface TabsProps {
  tabs: Tab[];
}

export function Tabs({ tabs }: TabsProps) {
  const [active, setActive] = useState(tabs[0]?.key);
  const activeTab = tabs.find((t) => t.key === active) ?? tabs[0];

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {tabs.map((t) => (
          <Button
            key={t.key}
            variant={active === t.key ? "default" : "outline"}
            size="sm"
            onClick={() => setActive(t.key)}
          >
            {t.title}
          </Button>
        ))}
      </div>
      <div>{activeTab.content}</div>
    </div>
  );
}
