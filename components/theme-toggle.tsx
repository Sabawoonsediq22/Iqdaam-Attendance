"use client";

import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/use-theme";
import { useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [changeIcon, setChangeIcon] = useState(true);
  const handleClick = () => {
    setChangeIcon(!changeIcon);
    setTheme(theme === "light" ? "dark" : "light");
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleClick}
      data-testid="button-theme-toggle"
      className="cursor-pointer border rounded-full border-gray-300 hover:border-gray-400 dark:hover:border-gray-600 transition-all"
    >
      {changeIcon ? <Sun className="h-5 w-5 transition-all" /> : <Moon className="h-6 w-6 transition-all dark:text-black" />}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
