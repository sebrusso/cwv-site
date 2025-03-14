"use client";

import { useRouter, usePathname } from "next/navigation";
import { User, Bot } from "lucide-react";

export function WritingTypeToggle() {
  const router = useRouter();
  const pathname = usePathname();

  const isModelPath = pathname === "/model-evaluation";

  const handleToggleHuman = () => {
    router.push("/");
  };

  const handleToggleModel = () => {
    router.push("/model-evaluation");
  };

  return (
    <div className="inline-flex items-center bg-gray-100 dark:bg-gray-800 p-0.5 rounded-full text-sm w-auto">
      <button
        onClick={handleToggleModel}
        className={`flex items-center px-2.5 py-1 rounded-full transition-all ${
          isModelPath
            ? "bg-white dark:bg-gray-700 shadow-sm font-medium"
            : "hover:bg-gray-200 dark:hover:bg-gray-700"
        }`}
      >
        <Bot className="h-3 w-3 mr-1.5" />
        <span>Model</span>
      </button>

      <button
        onClick={handleToggleHuman}
        className={`flex items-center px-2.5 py-1 rounded-full transition-all ${
          !isModelPath
            ? "bg-white dark:bg-gray-700 shadow-sm font-medium"
            : "hover:bg-gray-200 dark:hover:bg-gray-700"
        }`}
      >
        <User className="h-3 w-3 mr-1.5" />
        <span>Human</span>
      </button>
    </div>
  );
}
