const { cleanup } = require('../server');

const result = cleanup();
console.log(`Cleanup complete. Deleted ${result.students} expired student records and ${result.registrations} expired daily registrations.`);
process.exit(0);
