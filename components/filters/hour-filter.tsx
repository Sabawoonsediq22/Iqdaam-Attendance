"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Class } from "@/lib/schema";

interface HourFilterProps {
  value: string;
  onChange: (value: string) => void;
  classes: Class[] | undefined;
}

export function HourFilter({ value, onChange }: HourFilterProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-32">
        <SelectValue placeholder="Hour" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Hours</SelectItem>
        <SelectItem value="morning">Morning</SelectItem>
        <SelectItem value="afternoon">Afternoon</SelectItem>
      </SelectContent>
    </Select>
  );
}