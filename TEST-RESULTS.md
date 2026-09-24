# Test Results

Test date: 2026-08-23

The application was started locally with `node server.js` and returned HTTP 200 for `/`, `/DB/1`, `/DB/2`, and `/DB/3`. The startup banner reported 26 configured classes and `Server: RUNNING`.

The automated smoke test passed the following workflows: public routes; all 26 classes; class-login authorization; wrong-class rejection; teacher and assistant-teacher logins; student creation; duplicate Student ID rejection; student profile and age calculation; attendance validation; one-submission-per-day locking; duplicate attendance rejection; read-only access to another class; student transfer/inactivation; Principal, Vice Principal, and all four Assistant Principal logins; invalid and valid database passwords; Database 1, 2, and 3 access; CSV-capable database views; and audit-log entries.

Static syntax checks also passed:

```text
node --check server.js
node --check public/app.js
```

The disposable smoke-test student was marked inactive after the test. The project archive intentionally excludes `node_modules` and the generated SQLite database; `npm install` and first start recreate the runnable environment.
