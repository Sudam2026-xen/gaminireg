const assert = require('node:assert/strict');
const base = process.env.BASE_URL || 'http://localhost:3000';
const cookies = {};
async function request(path, options = {}, useCookie = true) {
  const headers = { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...(useCookie && Object.keys(cookies).length ? { Cookie: Object.entries(cookies).map(([name,value]) => `${name}=${value}`).join('; ') } : {}) };
  const response = await fetch(`${base}${path}`, { ...options, headers });
  const setCookie = response.headers.get('set-cookie');
  if (setCookie) { const pair = setCookie.split(';')[0]; const index = pair.indexOf('='); cookies[pair.slice(0,index)] = pair.slice(index + 1); }
  const body = await response.json().catch(() => ({}));
  return { status: response.status, body };
}
async function login(staffId, mode = 'admin', grade = '6', section = 'A') {
  const result = await request('/api/login', { method:'POST', body:JSON.stringify({ staffId, password:'School@123', mode, grade, section }) }, false);
  assert.equal(result.status, 200, `${staffId} should log in`);
  return result.body.user;
}
(async () => {
  let result = await request('/api/session', {}, false);
  assert.equal(result.status, 200); assert.equal(result.body.classes.length, 26);
  for (const route of ['/', '/DB/1', '/DB/2', '/DB/3']) { const page = await fetch(`${base}${route}`); assert.equal(page.status, 200, `${route} should load`); }

  result = await request('/api/login', { method:'POST', body:JSON.stringify({ staffId:'CT-6A-2026', password:'School@123', mode:'class', grade:'6', section:'B' }) }, false);
  assert.equal(result.status, 403); assert.equal(result.body.error, 'This account is not assigned to this class.');
  await login('CT-6A-2026', 'class', '6', 'A');
  result = await request('/api/students?class=6A');
  assert.equal(result.status, 200); assert.ok(result.body.students.length >= 4);
  const studentId = `SMOKE-${Date.now()}`;
  const student = { student_id:studentId, full_name:'Smoke Test Student', date_of_birth:'2011-05-20', gender:'Male', guardian_name:'Smoke Guardian', guardian_phone:'0700000000', address:'Smoke address', emergency_contact:'0700000000', notes:'Created by automated smoke test', class_name:'6A' };
  result = await request('/api/students', { method:'POST', body:JSON.stringify(student) });
  assert.equal(result.status, 201); assert.equal(result.body.student.class_name, '6A');
  result = await request('/api/students', { method:'POST', body:JSON.stringify(student) });
  assert.equal(result.status, 409); assert.equal(result.body.error, 'This student ID already exists.');
  result = await request(`/api/students/${studentId}`); assert.equal(result.status, 200); assert.equal(result.body.student.age, 15);
  result = await request('/api/attendance/today?class=6A'); assert.equal(result.status, 200); assert.equal(result.body.readOnly, false); assert.equal(result.body.registration, null);
  const statuses = result.body.students.map(s => ({ studentId:s.student_id, status:s.student_id === studentId ? 'absent' : 'present' }));
  result = await request('/api/attendance', { method:'POST', body:JSON.stringify({ class_name:'6A', statuses }) }); assert.equal(result.status, 201);
  result = await request('/api/attendance', { method:'POST', body:JSON.stringify({ class_name:'6A', statuses }) }); assert.equal(result.status, 409); assert.equal(result.body.error, "This class has already submitted today's registration.");
  result = await request('/api/attendance', { method:'POST', body:JSON.stringify({ class_name:'6B', statuses:[] }) }); assert.equal(result.status, 403);
  result = await request('/api/attendance/today?class=6B'); assert.equal(result.status, 200); assert.equal(result.body.readOnly, true);
  result = await request(`/api/students/${studentId}/transfer`, { method:'POST', body:JSON.stringify({ action:'inactive', reason:'Smoke test cleanup' }) }); assert.equal(result.status, 200);

  for (const id of ['PRI0102','VI0101','AS0101','AS0102','AS0103','AS0104']) { await login(id); result = await request('/api/admin/dashboard'); assert.equal(result.status, 200); assert.equal(result.body.totalClasses, 26); }
  result = await request('/api/db/1/unlock', { method:'POST', body:JSON.stringify({ staffId:'PRI0102', password:'School@123', databasePassword:'wrong' }) }, false); assert.equal(result.status, 401);
  await login('PRI0102');
  for (const [number, password, endpoint] of [[1,'DB1@123','/api/db/1/students'],[2,'DB2@123','/api/db/2/registrations'],[3,'DB3@123','/api/db/3/users']]) {
    result = await request(`/api/db/${number}/unlock`, { method:'POST', body:JSON.stringify({ staffId:'PRI0102', password:'School@123', databasePassword:password }) }); assert.equal(result.status, 200);
    result = await request(endpoint); assert.equal(result.status, 200);
  }
  result = await request('/api/audit'); assert.equal(result.status, 200); assert.ok(result.body.audit.some(item => item.action === 'Attendance submitted')); assert.ok(result.body.audit.some(item => item.action === 'Student transferred'));
  console.log('SMOKE TEST PASSED: public routes, 26 classes, class authorization, teacher and assistant workflows, CRUD, duplicate prevention, attendance validation/locking, admin access, DB passwords, DB views, read-only access, transfers, and audit logging.');
})().catch(error => { console.error('SMOKE TEST FAILED:', error.stack || error); process.exit(1); });
