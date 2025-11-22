import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { StaticImageData } from "next/image";
import { Button } from "@/components/ui/button";
import { Check, X, Clock } from "lucide-react";

export type AttendanceStatus = "present" | "absent" | "late" | null;

export interface AttendanceStudent {
  id: string;
  name: string;
  studentId: string;
  avatar?: string | StaticImageData | null;
  status: AttendanceStatus;
  classId?: string;
}

interface AttendanceCardProps {
  student: AttendanceStudent;
  onStatusChange: (studentId: string, status: AttendanceStatus) => void;
}

export function AttendanceCard({
  student,
  onStatusChange,
}: AttendanceCardProps) {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card data-testid={`attendance-card-${student.id}`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="h-12 w-12">
            <AvatarImage
              src={
                typeof student.avatar === "string" ? student.avatar : undefined
              }
              alt={student.name}
            />
            <AvatarFallback>{getInitials(student.name)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p
              className="font-medium truncate"
              data-testid={`student-name-${student.id}`}
            >
              {student.name}
            </p>
            <p className="text-sm text-muted-foreground font-mono">
              {student.studentId}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Button
            size="sm"
            variant={student.status === "present" ? "default" : "outline"}
            className={
              student.status === "present"
                ? "bg-attendance-present hover:bg-attendance-present border-attendance-present"
                : ""
            }
            onClick={() => {
              console.log(`Mark ${student.name} as present`);
              onStatusChange(student.id, "present");
            }}
            data-testid={`button-present-${student.id}`}
          >
            <Check className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={student.status === "absent" ? "default" : "outline"}
            className={
              student.status === "absent"
                ? "bg-attendance-absent hover:bg-attendance-absent border-attendance-absent"
                : ""
            }
            onClick={() => {
              console.log(`Mark ${student.name} as absent`);
              onStatusChange(student.id, "absent");
            }}
            data-testid={`button-absent-${student.id}`}
          >
            <X className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={student.status === "late" ? "default" : "outline"}
            className={
              student.status === "late"
                ? "bg-attendance-late hover:bg-attendance-late border-attendance-late"
                : ""
            }
            onClick={() => {
              console.log(`Mark ${student.name} as late`);
              onStatusChange(student.id, "late");
            }}
            data-testid={`button-late-${student.id}`}
          >
            <Clock className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
