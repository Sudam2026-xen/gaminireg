const { db, CLASSES } = require('../server');

console.log(`Seed complete. ${db.prepare('SELECT COUNT(*) AS count FROM staff_users').get().count} staff users and ${db.prepare("SELECT COUNT(*) AS count FROM student_information WHERE status = 'active'").get().count} active students are available.`);
console.log(`Configured classes: ${CLASSES.length}`);
process.exit(0);
