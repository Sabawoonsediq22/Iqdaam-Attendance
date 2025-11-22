"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown, Clock, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Class } from "@/lib/schema";

interface AttendanceClassSelectorProps {
  classes: Class[];
  selectedClass: string;
  onClassChange: (classId: string) => void;
}

export default function AttendanceClassSelector({
  classes,
  selectedClass,
  onClassChange
}: AttendanceClassSelectorProps) {
  const [open, setOpen] = useState(false);

  const selectedClassData = classes.find((cls) => cls.id === selectedClass);

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium block">Select Class</label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-64 justify-between"
          >
            {selectedClassData ? (
              <div className="flex flex-col items-start">
                <span className="font-medium">{selectedClassData.name}</span>
                <span className="text-xs text-muted-foreground">
                  by {selectedClassData.teacher}
                </span>
              </div>
            ) : (
              "Choose a class"
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0 shadow-lg border-0" align="start">
          <Command className="rounded-lg">
            <CommandInput
              placeholder="Search classes..."
              className="h-11 border-0 shadow-none focus:ring-0"
            />
            <CommandList className="max-h-64">
              <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
                No class found.
              </CommandEmpty>
              <CommandGroup className="p-2">
                {classes.map((classItem) => (
                  <CommandItem
                    key={classItem.id}
                    value={`${classItem.name} ${classItem.teacher} ${classItem.time}`}
                    onSelect={() => {
                      onClassChange(classItem.id);
                      setOpen(false);
                    }}
                    className="flex items-start gap-3 p-3 rounded-md hover:bg-muted/50 transition-colors cursor-pointer"
                  >
                    <Check
                      className={cn(
                        "mt-0.5 h-4 w-4 shrink-0",
                        selectedClass === classItem.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex flex-col gap-2 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground truncate">
                          {classItem.name}
                        </span>
                        <span className="text-sm text-muted-foreground shrink-0">
                          by
                        </span>
                        <span className="font-medium text-foreground truncate">
                          {classItem.teacher}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5" />
                          <span>{classItem.time}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>
                            {new Date(classItem.startDate).toLocaleDateString()}
                            {classItem.endDate && ` - ${new Date(classItem.endDate).toLocaleDateString()}`}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}