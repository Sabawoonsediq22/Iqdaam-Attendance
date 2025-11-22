import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Users, BookOpen, GraduationCap, TrendingUp, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface ClassInfo {
  id: string;
  name: string;
  subject: string;
  studentCount: number;
  attendanceRate?: number;
}

interface ClassCardProps {
  classInfo: ClassInfo;
  onEdit: (classId: string) => void;
  onDelete: (classId: string) => void;
}

export function ClassCard({ classInfo, onEdit, onDelete }: ClassCardProps) {
  const getClassIcon = () => {
    // You can customize this based on class name or add more logic
    return <GraduationCap className="h-5 w-5" />;
  };

  const getAttendanceColor = (rate?: number) => {
    if (!rate) return "text-muted-foreground";
    if (rate >= 90) return "text-green-600 dark:text-green-400";
    if (rate >= 75) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  return (
    <Card
      data-testid={`class-card-${classInfo.id}`}
      className="relative overflow-hidden border-0 shadow-lg bg-linear-to-br from-card via-card/95 to-card/90 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] group"
    >
      {/* Subtle background gradient */}
      <div className="absolute inset-0 bg-linear-to-br from-primary/5 via-transparent to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3 relative z-10">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-primary/20 to-primary/10 border border-primary/20 shadow-sm">
            {getClassIcon()}
          </div>
          <div>
            <CardTitle className="text-lg font-bold bg-linear-to-r from-foreground to-foreground/80 bg-clip-text text-transparent group-hover:from-primary group-hover:to-primary/80 transition-all duration-300">
              {classInfo.name}
            </CardTitle>
          </div>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 hover:bg-primary/10 hover:text-primary transition-colors"
            onClick={() => {
              console.log("Edit class:", classInfo.id);
              onEdit(classInfo.id);
            }}
            data-testid={`button-edit-class-${classInfo.id}`}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive transition-colors"
            onClick={() => {
              console.log("Delete class:", classInfo.id);
              onDelete(classInfo.id);
            }}
            data-testid={`button-delete-class-${classInfo.id}`}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 relative z-10">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-secondary/50">
            <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground/90">{classInfo.subject}</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-secondary/50">
            <Users className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
          <span className="text-sm font-medium text-foreground/80" data-testid={`student-count-${classInfo.id}`}>
            {classInfo.studentCount} students
          </span>
        </div>

        {classInfo.attendanceRate !== undefined && (
          <div className="mt-3 pt-3 border-t border-border/50 bg-muted/20 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="flex h-5 w-5 items-center justify-center rounded-md bg-primary/10">
                  <TrendingUp className="h-3 w-3 text-primary" />
                </div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Recent Attendance</p>
              </div>
              <Badge variant="secondary" className="text-xs px-2 py-0.5 bg-primary/10 text-primary border-primary/20">
                <Calendar className="h-3 w-3 mr-1" />
                Live
              </Badge>
            </div>
            <p className={`text-2xl font-bold ${getAttendanceColor(classInfo.attendanceRate)}`} data-testid={`attendance-rate-${classInfo.id}`}>
              {classInfo.attendanceRate}%
            </p>
            <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  classInfo.attendanceRate >= 90 ? 'bg-green-500' :
                  classInfo.attendanceRate >= 75 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${classInfo.attendanceRate}%` }}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
