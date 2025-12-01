"use client";

import React, { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  text?: string;
}

const loadingMessages = [
  "Crunching numbers...",
  "Fetching your data...",
  "Almost there...",
  "Loading your finances...",
  "Preparing reports...",
  "Calculating totals...",
  "Organizing records...",
  "Syncing data...",
  "Processing transactions...",
  "Updating dashboard...",
  "Gathering insights...",
  "Loading categories...",
  "Preparing invoices...",
  "Analyzing expenses...",
  "Reviewing revenue...",
  "Checking budgets...",
  "Loading notifications...",
  "Fetching payment methods...",
  "Compiling reports...",
  "Just a moment...",
];

export function Loading({ className, size = "md", text }: LoadingProps) {
  const [currentMessage, setCurrentMessage] = useState(
    text || loadingMessages[Math.floor(Math.random() * loadingMessages.length)]
  );

  useEffect(() => {
    if (!text) {
      const interval = setInterval(() => {
        const randomIndex = Math.floor(Math.random() * loadingMessages.length);
        setCurrentMessage(loadingMessages[randomIndex]);
      }, 2000); // Change message every 2 seconds

      return () => clearInterval(interval);
    }
  }, [text]);

  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  };

  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 py-8", className)}>
      <Loader2 className={cn("animate-spin text-primary", sizeClasses[size])} />
      <p className="text-sm text-muted-foreground animate-pulse">{currentMessage}</p>
    </div>
  );
}

