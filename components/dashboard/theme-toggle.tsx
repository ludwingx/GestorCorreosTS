"use client";

import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="h-9 w-9 rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 bg-zinc-100/50 dark:bg-zinc-900/50 animate-pulse" />
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-9 w-9 rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 bg-white dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-all shadow-sm hover:scale-105"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      {resolvedTheme === "dark" ? (
        <Sun className="h-4 w-4 transition-transform duration-300 rotate-0" />
      ) : (
        <Moon className="h-4 w-4 transition-transform duration-300 rotate-0" />
      )}
      <span className="sr-only">Cambiar Tema</span>
    </Button>
  );
}
