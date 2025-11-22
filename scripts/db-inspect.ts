// scripts/db-inspect.ts
// Read-only DB inspection script for local debugging.
// Usage: npx tsx ./scripts/db-inspect.ts


import "dotenv/config";

(async function inspect() {
  try {
    console.log('Using DATABASE_URL:', process.env.DATABASE_URL ? '[REDACTED]' : 'none');

    const storageMod = await import('../lib/storage');
    const schemaMod = await import('../lib/schema');
    const db = storageMod.db;
    const { classes, students, attendance } = schemaMod;

    const classesRows = await db.select().from(classes);
    console.log(`classes: ${classesRows.length}`);

    const studentsRows = await db.select().from(students).limit(10);
    console.log(`students: ${studentsRows.length} (showing up to 10)`);
    console.table(studentsRows.map((s) => ({ id: s.id, name: s.name, studentId: s.studentId, email: s.email, classId: s.classId })));

    const attendanceRows = await db.select().from(attendance).limit(20);
    console.log(`attendance: ${attendanceRows.length} (showing up to 20)`);
    console.table(attendanceRows.map((a) => ({ id: a.id, studentId: a.studentId, classId: a.classId, date: a.date, status: a.status })));

    process.exit(0);
  } catch (err) {
    console.error('Error inspecting DB:');
    console.error(err);
    process.exit(1);
  }
})();
