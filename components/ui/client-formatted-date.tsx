"use client";

import { useEffect, useState } from "react";

interface ClientFormattedDateProps {
  date: string | Date | number;
  locale?: string;
  options?: Intl.DateTimeFormatOptions;
}

export function ClientFormattedDate({ 
  date, 
  locale = "es-VE", 
  options = {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  } 
}: ClientFormattedDateProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Consistent fallback during Server Side Rendering
    return <span className="opacity-40 animate-pulse">...</span>;
  }

  try {
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return <span>-</span>;
    }
    return <span>{parsedDate.toLocaleString(locale, options)}</span>;
  } catch (e) {
    return <span>-</span>;
  }
}
