"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
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
        <ScrollArea className="h-64">
          <SelectItem value="all">All Hours</SelectItem>
          <SelectItem value="morning">Morning</SelectItem>
          <SelectItem value="afternoon">Afternoon</SelectItem>
          <SelectItem value="5">5:00 AM</SelectItem>
          <SelectItem value="6">6:00 AM</SelectItem>
          <SelectItem value="7">7:00 AM</SelectItem>
          <SelectItem value="8">8:00 AM</SelectItem>
          <SelectItem value="9">9:00 AM</SelectItem>
          <SelectItem value="10">10:00 AM</SelectItem>
          <SelectItem value="11">11:00 AM</SelectItem>
          <SelectItem value="12">12:00 PM</SelectItem>
          <SelectItem value="13">1:00 PM</SelectItem>
          <SelectItem value="14">2:00 PM</SelectItem>
          <SelectItem value="15">3:00 PM</SelectItem>
          <SelectItem value="16">4:00 PM</SelectItem>
          <SelectItem value="17">5:00 PM</SelectItem>
          <SelectItem value="18">6:00 PM</SelectItem>
          <SelectItem value="19">7:00 PM</SelectItem>
          <SelectItem value="20">8:00 PM</SelectItem>
          <SelectItem value="21">9:00 PM</SelectItem>
          <SelectItem value="22">10:00 PM</SelectItem>
        </ScrollArea>
      </SelectContent>
    </Select>
  );
}
