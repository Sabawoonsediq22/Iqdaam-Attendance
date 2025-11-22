"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface MonthFilterProps {
  value: string;
  onChange: (value: string) => void;
}

export function MonthFilter({ value, onChange }: MonthFilterProps) {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-32">
        <SelectValue placeholder="Month" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Months</SelectItem>
        <SelectItem value="this-month">This Month</SelectItem>
        {months.map((month, index) => (
          <SelectItem key={month} value={(index + 1).toString()}>
            {month}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}