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
      className="rounded-full border-border transition-colors hover:border-foreground/40"
    >
      {changeIcon ? (
        <Sun className="transition-all" />
      ) : (
        <Moon className="transition-all" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
