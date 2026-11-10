"use client";

import { useState } from "react";

export function CopyButton({
  text,
  label = "Copy link",
  className = "rounded-lg border border-black/15 px-3 py-1.5 text-sm",
}: {
  text: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          window.prompt("Copy:", text);
        }
      }}
      className={className}
    >
      {copied ? "Copied ✓" : label}
    </button>
  );
}
