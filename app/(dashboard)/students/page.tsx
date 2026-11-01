"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Users, Search, Plus } from "lucide-react";
import type { Student, Class, StudentClass } from "@/lib/schema";
import AddStudentModal from "@/components/AddStudentModal";
import StudentDetailsModal from "@/components/StudentDetailsModal";
import EditStudentModal from "@/components/EditStudentModal";
import { useQueryClient } from "@tanstack/react-query";
import OfflineIndicator from "@/components/OfflineIndicator";
import { Loader } from "@/components/loader";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { SearchInput } from "@/components/filters/search-input";
import { getStudentAvatarSrc } from "@/lib/utils";

export default function StudentsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: students = [], isLoading: studentsLoading } = useQuery<
    Student[]
  >({
    queryKey: ["/api/students"],
  });

  const { data: classes = [], isLoading: classesLoading } = useQuery<Class[]>({
    queryKey: ["/api/classes"],
  });

  const { data: studentClasses = [] } = useQuery<StudentClass[]>({
    queryKey: ["/api/student-classes"],
  });

  const handleStudentAdded = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/students"] });
    queryClient.invalidateQueries({ queryKey: ["/api/classes"] });
    queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    queryClient.invalidateQueries({ queryKey: ["/api/student-classes"] });
  };

  const handleStudentChange = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/students"] });
    queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    setSelectedStudent(null);
  };

  const handleStudentClick = (student: Student) => {
    setSelectedStudent(student);
    setIsDetailsModalOpen(true);
  };

  const handleEditStudent = () => {
    setIsEditModalOpen(true);
  };

  // Deduplicate students by ID to prevent duplicate keys
  const uniqueStudents = students.reduce((acc, student) => {
    if (!acc.has(student.id)) {
      acc.set(student.id, student);
    }
    return acc;
  }, new Map());

  const filteredStudents = Array.from(uniqueStudents.values()).filter(
    (student) =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student.studentId?.toLowerCase().includes(searchTerm.toLowerCase()) ??
        false) ||
      (student.email?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
  );

  const getClassName = (classId: string) => {
    const cls = classes.find((c) => c.id === classId);
    return cls
      ? `${cls.name} - ${(cls as { subject?: string }).subject || "No Subject"}`
      : "Unknown Class";
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const unusedVariable = getClassName;

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const studentsByClass = classes
    .map((cls) => {
      // Get unique student-class relationships to prevent duplicate keys
      const uniqueStudentClasses = studentClasses.reduce((acc, sc) => {
        const key = `${sc.studentId}-${sc.classId}`;
        if (!acc.has(key)) {
          acc.set(key, sc);
        }
        return acc;
      }, new Map());

      return {
        class: cls,
        students: filteredStudents.filter((student) =>
          Array.from(uniqueStudentClasses.values()).some(
            (sc) => sc.studentId === student.id && sc.classId === cls.id
          )
        ),
      };
    })
    .filter((group) => group.students.length > 0);

  return (
    <div className="space-y-6">
      <OfflineIndicator />

      <PageHeader
        description="Manage student information and class assignments"
        actions={
          <AddStudentModal
            onSuccess={handleStudentAdded}
            trigger={
              <Button className="w-full ">
                <Plus className="sm:mr-2" />
                <p>Add Student</p>
              </Button>
            }
          />
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search students..."
        />
        <Badge variant="secondary" className="w-30 ml-auto">Total {students.length} students</Badge>
      </div>

      {studentsLoading || classesLoading ? (
        <Card>
          <CardContent className="py-12">
            <Loader variant="skeleton" shape="students" className="max-w-none" />
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-6">
            {studentsByClass.map(({ class: cls, students: classStudents }) => (
              <Card key={cls.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    {cls.name}
                    <Badge variant="outline" className="ml-auto">
                      {classStudents.length} students
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {classStudents.map((student) => (
                      <div
                        key={`${cls.id}-${student.id}`}
                        className="flex items-center gap-3 rounded-lg border p-4 cursor-pointer transition-colors hover:bg-muted/50"
                        onClick={() => handleStudentClick(student)}
                      >
                        <Avatar className="h-12 w-12">
                          <AvatarImage
                            src={getStudentAvatarSrc(student.avatar, student.gender)}
                            alt={student.name}
                          />
                          <AvatarFallback>
                            {getInitials(student.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{student.name}</p>
                          <p className="text-sm text-muted-foreground truncate">
                            {student.fatherName}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {student.phone || "No phone number"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}

            {studentsByClass.length === 0 && searchTerm && (
              <EmptyState
                icon={Search}
                title="No students found"
                description="Try adjusting your search terms or add new students."
              />
            )}

            {studentsByClass.length === 0 && !searchTerm && (
              <EmptyState
                icon={Users}
                title="No students yet"
                description="Add students to see them organized by class."
              />
            )}
          </div>

          <StudentDetailsModal
            student={selectedStudent}
            isOpen={isDetailsModalOpen}
            onClose={() => setIsDetailsModalOpen(false)}
            onEdit={handleEditStudent}
            onStudentChange={handleStudentChange}
          />

          <EditStudentModal
            student={selectedStudent}
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            onSuccess={() => {
              setIsEditModalOpen(false);
              setSelectedStudent(null);
            }}
          />
        </>
      )}
    </div>
  );
}
