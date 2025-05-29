"use client";

import { useEffect, useRef, useState, forwardRef, useMemo } from "react";
import { wordCount, readingTimeMinutes } from "@/lib/text-utils";

type Props = {
  text: string;
  pairedRef?: React.RefObject<HTMLDivElement | null>;
  enableHighlight?: boolean;
  id: string;
  onHighlight?: (text: string) => void;
};

function highlightText(text: string, highlight: string) {
  if (!highlight) return text;
  const escaped = highlight.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escaped})`, "gi");
  return text.split(regex).map((part, i) =>
    regex.test(part) ? (
      <mark key={i} className="bg-yellow-200 dark:bg-yellow-700">
        {part}
      </mark>
    ) : (
      part
    )
  );
}

export const TextPane = forwardRef<HTMLDivElement, Props>(
  ({ text, pairedRef, enableHighlight = false, id, onHighlight }, ref) => {
    const localRef = useRef<HTMLDivElement>(null);
    // merge forwarded ref
    useEffect(() => {
      if (typeof ref === "function") {
        ref(localRef.current);
      } else if (ref) {
        (ref as React.MutableRefObject<HTMLDivElement | null>).current =
          localRef.current;
      }
    }, [ref]);
  const [expanded, setExpanded] = useState(false);
  const [highlight, setHighlight] = useState("");

  // Memoize expensive text calculations to prevent re-computation on every render
  const wc = useMemo(() => wordCount(text), [text]);
  const rt = useMemo(() => readingTimeMinutes(text), [text]);

  useEffect(() => {
    let isSyncing = false;
    const handleScroll = () => {
      if (!pairedRef?.current || !localRef.current) return;
      if (isSyncing) return;
      const ratio =
        localRef.current.scrollTop /
        (localRef.current.scrollHeight - localRef.current.clientHeight);
      isSyncing = true;
      pairedRef.current.scrollTop =
        ratio * (pairedRef.current.scrollHeight - pairedRef.current.clientHeight);
      isSyncing = false;
    };
    const src = localRef.current;
    if (src) {
      src.addEventListener("scroll", handleScroll);
      return () => src.removeEventListener("scroll", handleScroll);
    }
  }, [pairedRef]);

  const handleMouseUp = () => {
    if (!enableHighlight) return;
    const selection = window.getSelection()?.toString().trim();
    if (selection) {
      setHighlight(selection);
      onHighlight?.(selection);
    }
  };

  return (
    <div className="flex flex-col gap-2" aria-labelledby={`${id}-info`}>
      <div id={`${id}-info`} className="text-xs text-gray-500">
        {wc} words, ~{rt} min read
      </div>
      <div
        ref={localRef}
        onMouseUp={handleMouseUp}
        className={`whitespace-pre-wrap text-sm leading-relaxed overflow-y-auto border p-2 rounded-md ${
          expanded ? "max-h-none" : "max-h-48"
        }`}
        role="region"
        tabIndex={0}
      >
        {highlightText(text, highlight)}
      </div>
      {wc > 200 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(!expanded);
          }}
          className="self-start text-xs text-blue-600 hover:underline focus:outline-none"
        >
          {expanded ? "Show Less" : "Show More"}
        </button>
      )}
    </div>
  );
});

TextPane.displayName = "TextPane";

