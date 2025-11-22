import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface ClassOption {
  id: string;
  name: string;
  subject: string;
}

interface ClassSelectorProps {
  classes: ClassOption[];
  selectedClass: string;
  onClassChange: (classId: string) => void;
}

export function ClassSelector({ classes, selectedClass, onClassChange }: ClassSelectorProps) {
  return (
    <Select value={selectedClass} onValueChange={onClassChange}>
      <SelectTrigger className="w-[280px]" data-testid="select-class">
        <SelectValue placeholder="Select a class" />
      </SelectTrigger>
      <SelectContent>
        {classes.map((cls) => (
          <SelectItem key={cls.id} value={cls.id} data-testid={`class-option-${cls.id}`}>
            {cls.name} - {cls.subject}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
