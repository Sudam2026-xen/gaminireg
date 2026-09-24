const { DatabaseSync } = require('node:sqlite');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'school.sqlite');
const db = new DatabaseSync(dbPath);
db.exec('PRAGMA foreign_keys = ON;');

const students = db.prepare('DELETE FROM student_information').run();
const registrations = db.prepare('DELETE FROM daily_registration').run();

db.exec('PRAGMA wal_checkpoint(TRUNCATE);');
db.close();

console.log(`Removed ${students.changes} student records and ${registrations.changes} daily registration records.`);
console.log('All classes are now empty and ready for manual student entry.');
