
import Database from 'better-sqlite3';
try {
    const db = new Database('classroom.db');
    const row = db.prepare('SELECT count(*) as count FROM HocSinh').get();
    console.log('Database check:', row);
    db.close();
} catch (e) {
    console.error('Database check failed:', e);
}
