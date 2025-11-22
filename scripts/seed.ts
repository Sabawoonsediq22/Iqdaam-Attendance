import { config } from 'dotenv';

config({ path: '../.env.local' });


import { db } from '../lib/storage';
import { classes, students, attendance } from '../lib/schema';

async function seed() {
  console.log('Seeding database...');

  // Create classes
  const classData = [
    { name: 'Mathematics 101', subject: 'Mathematics', teacher: 'Dr. Smith', time: '9:00 AM', startDate: '2024-01-01' },
    { name: 'English Literature', subject: 'English', teacher: 'Prof. Johnson', time: '10:30 AM', startDate: '2024-01-01' },
    { name: 'Physics 101', subject: 'Physics', teacher: 'Dr. Brown', time: '2:00 PM', startDate: '2024-01-01' },
    { name: 'Chemistry 101', subject: 'Chemistry', teacher: 'Dr. Davis', time: '3:30 PM', startDate: '2024-01-01' },
  ];

  const insertedClasses = await db.insert(classes).values(classData).returning();
  console.log('Inserted classes:', insertedClasses);

  // Create students
  const studentData = [
    { name: 'Alice Johnson', fatherName: 'John Johnson', studentId: 'S001', email: 'alice@example.com', gender: 'Female', classId: insertedClasses[0].id },
    { name: 'Bob Smith', fatherName: 'Robert Smith', studentId: 'S002', email: 'bob@example.com', gender: 'Male', classId: insertedClasses[0].id },
    { name: 'Charlie Brown', fatherName: 'Charles Brown', studentId: 'S003', email: 'charlie@example.com', gender: 'Male', classId: insertedClasses[1].id },
    { name: 'Diana Prince', fatherName: 'David Prince', studentId: 'S004', email: 'diana@example.com', gender: 'Female', classId: insertedClasses[1].id },
    { name: 'Eve Wilson', fatherName: 'Edward Wilson', studentId: 'S005', email: 'eve@example.com', gender: 'Female', classId: insertedClasses[2].id },
    { name: 'Frank Miller', fatherName: 'Francis Miller', studentId: 'S006', email: 'frank@example.com', gender: 'Male', classId: insertedClasses[2].id },
    { name: 'Grace Lee', fatherName: 'George Lee', studentId: 'S007', email: 'grace@example.com', gender: 'Female', classId: insertedClasses[3].id },
    { name: 'Henry Davis', fatherName: 'Harold Davis', studentId: 'S008', email: 'henry@example.com', gender: 'Male', classId: insertedClasses[3].id },
  ];

  const insertedStudents = await db.insert(students).values(studentData).returning();
  console.log('Inserted students:', insertedStudents);

  // Create attendance records
  const today = new Date();
  const todayString = today.toISOString().split('T')[0];
  const day = today.toLocaleDateString('en-US', { weekday: 'long' });
  const month = today.toLocaleDateString('en-US', { month: 'long' });
  const year = today.getFullYear().toString();

  const attendanceData = [
    { studentId: insertedStudents[0].id, classId: insertedClasses[0].id, date: todayString, day, month, year, status: 'present' },
    { studentId: insertedStudents[1].id, classId: insertedClasses[0].id, date: todayString, day, month, year, status: 'present' },
    { studentId: insertedStudents[2].id, classId: insertedClasses[1].id, date: todayString, day, month, year, status: 'absent' },
    { studentId: insertedStudents[3].id, classId: insertedClasses[1].id, date: todayString, day, month, year, status: 'present' },
    { studentId: insertedStudents[4].id, classId: insertedClasses[2].id, date: todayString, day, month, year, status: 'present' },
    { studentId: insertedStudents[5].id, classId: insertedClasses[2].id, date: todayString, day, month, year, status: 'late' },
    { studentId: insertedStudents[6].id, classId: insertedClasses[3].id, date: todayString, day, month, year, status: 'present' },
    { studentId: insertedStudents[7].id, classId: insertedClasses[3].id, date: todayString, day, month, year, status: 'absent' },
  ];

  const insertedAttendance = await db.insert(attendance).values(attendanceData).returning();
  console.log('Inserted attendance:', insertedAttendance);

  console.log('Seeding completed!');
}

seed().catch(console.error);