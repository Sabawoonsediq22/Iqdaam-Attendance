import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { StaticImageData } from "next/image";
import { Pencil, Trash2 } from "lucide-react";

export interface Student {
  id: string;
  name: string;
  studentId: string;
  email: string;
  avatar?: string | StaticImageData | null;
  classId?: string;
}

interface StudentTableProps {
  students: Student[];
  onEdit: (student: Student) => void;
  onDelete: (studentId: string) => void;
}

export function StudentTable({
  students,
  onEdit,
  onDelete,
}: StudentTableProps) {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="rounded-md border border-card-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[80px]">Photo</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Student ID</TableHead>
            <TableHead>Email</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.map((student) => (
            <TableRow
              key={student.id}
              data-testid={`student-row-${student.id}`}
            >
              <TableCell>
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src={
                      typeof student.avatar === "string"
                        ? student.avatar
                        : undefined
                    }
                    alt={student.name}
                  />
                  <AvatarFallback>{getInitials(student.name)}</AvatarFallback>
                </Avatar>
              </TableCell>
              <TableCell
                className="font-medium"
                data-testid={`student-name-${student.id}`}
              >
                {student.name}
              </TableCell>
              <TableCell
                className="font-mono text-sm"
                data-testid={`student-id-${student.id}`}
              >
                {student.studentId}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {student.email}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      console.log("Edit student:", student.id);
                      onEdit(student);
                    }}
                    data-testid={`button-edit-${student.id}`}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      console.log("Delete student:", student.id);
                      onDelete(student.id);
                    }}
                    data-testid={`button-delete-${student.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
