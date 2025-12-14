"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
    queryClient.invalidateQueries({ queryKey: ["/api/student-classes"] });
  };

  const handleStudentChange = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/students"] });
    setSelectedStudent(null);
  };

  const handleStudentClick = (student: Student) => {
    setSelectedStudent(student);
    setIsDetailsModalOpen(true);
  };

  const handleEditStudent = () => {
    setIsEditModalOpen(true);
  };

  const filteredStudents = students.filter(
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
    .map((cls) => ({
      class: cls,
      students: filteredStudents.filter((student) =>
        studentClasses.some(
          (sc) => sc.studentId === student.id && sc.classId === cls.id
        )
      ),
    }))
    .filter((group) => group.students.length > 0);

  return (
    <div className="space-y-6">
      <OfflineIndicator />
      {studentsLoading || classesLoading ? (
        <div className="flex justify-center py-12">
          <Loader size="md" text="Loading students..." />
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground mt-1">
                Manage student information and class assignments
              </p>
            </div>
            <AddStudentModal
              onSuccess={handleStudentAdded}
              trigger={
                <Button className="cursor-pointer">
                  <Plus className="h-4 w-4 sm:mr-2" />
                  <p className="hidden sm:block">Add Student</p>
                </Button>
              }
            />
          </div>

          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Badge variant="secondary">Total {students.length} students</Badge>
          </div>

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
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {classStudents.map((student) => (
                      <div
                        key={student.id}
                        className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-all duration-300"
                        onClick={() => handleStudentClick(student)}
                      >
                        <Avatar className="h-12 w-12">
                          <AvatarImage
                            src={student.avatar || undefined}
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
              <Card>
                <CardContent className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium">No students found</h3>
                    <p className="text-muted-foreground">
                      Try adjusting your search terms or add new students.
                    </p>
                  </div>
                </CardContent>
              </Card>
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
