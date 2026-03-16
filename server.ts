import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import Database from 'better-sqlite3';
import { createClient } from '@libsql/client';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database Configuration
const TURSO_URL = process.env.TURSO_DATABASE_URL;
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN;

let db: any;
let isTurso = false;

if (TURSO_URL && TURSO_TOKEN) {
  console.log('Using Turso Cloud Database');
  db = createClient({
    url: TURSO_URL,
    authToken: TURSO_TOKEN,
  });
  isTurso = true;
} else {
  console.log('Using Local SQLite Database');
  const dbPath = process.env.DATABASE_PATH || 'classroom.db';
  db = new Database(dbPath);
}

// Helper for Database Execution (Abstracting Turso vs SQLite)
// Note: For Turso, we use async/await. For SQLite, we wrap it to be async.
const dbExec = async (sql: string) => {
  if (isTurso) {
    return await db.execute(sql);
  } else {
    return db.exec(sql);
  }
};

const dbGet = async (sql: string, params: any[] = []) => {
  if (isTurso) {
    const result = await db.execute({ sql, args: params });
    return result.rows[0];
  } else {
    return db.prepare(sql).get(...params);
  }
};

const dbAll = async (sql: string, params: any[] = []) => {
  if (isTurso) {
    const result = await db.execute({ sql, args: params });
    return result.rows;
  } else {
    return db.prepare(sql).all(...params);
  }
};

const dbRun = async (sql: string, params: any[] = []) => {
  if (isTurso) {
    return await db.execute({ sql, args: params });
  } else {
    return db.prepare(sql).run(...params);
  }
};

// Initialize Database Tables
async function initDb() {
  const schema = `
    CREATE TABLE IF NOT EXISTS HocSinh (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT,
      hoTen TEXT,
      ngaySinh TEXT,
      gioiTinh TEXT,
      noiSinh TEXT,
      cccd TEXT,
      noiO TEXT,
      sdt TEXT,
      to_group TEXT,
      chucVu TEXT,
      sticker_count INTEGER DEFAULT 0,
      role TEXT,
      must_change_password INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS Log_Chung (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ngay TEXT,
      hocTap TEXT,
      phongTrao TEXT,
      luuY TEXT,
      tamSu TEXT,
      thongBaoChung TEXT,
      ghiChep_ViecTot TEXT,
      ghiChep_ViPham TEXT,
      createdBy TEXT
    );

    CREATE TABLE IF NOT EXISTS Log_To (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ngay TEXT,
      to_group TEXT,
      tenHocSinh TEXT,
      hocTap INTEGER,
      hoatDong INTEGER,
      hoaDong INTEGER,
      chuyenCan INTEGER,
      dongPhuc INTEGER,
      nhanRieng_VoiThay TEXT,
      createdBy TEXT
    );

    CREATE TABLE IF NOT EXISTS Log_CaNhan (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ngay TEXT,
      username TEXT,
      tenHocSinh TEXT,
      diem_HT INTEGER,
      diem_HD INTEGER,
      diem_HoaDong INTEGER,
      diem_CC INTEGER,
      diem_DP INTEGER,
      machRieng TEXT,
      mucDoHanhPhuc INTEGER,
      canGapCo_KhanCap INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS PhanHoi_GVCN (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ngay TEXT,
      username TEXT,
      noiDungPhanHoi TEXT,
      loaiSticker TEXT,
      stickerIcon TEXT
    );

    CREATE TABLE IF NOT EXISTS TinNhan (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ngay TEXT,
      username TEXT,
      tenHocSinh TEXT,
      noiDung TEXT,
      isEmergency INTEGER DEFAULT 0
    );
  `;
  
  await dbExec(schema);

  // Seed Admin Account
  const admin = await dbGet('SELECT * FROM HocSinh WHERE username = ?', ['admin']);
  if (!admin) {
    await dbRun('INSERT INTO HocSinh (username, password, hoTen, role, chucVu, must_change_password) VALUES (?, ?, ?, ?, ?, ?)', 
      ['admin', 'Anhdung1@', 'Admin GVCN', 'teacher', 'GVCN', 0]);
  }
}

initDb();

// Helper to generate students
async function seedStudents() {
  const teacherCount = await dbGet('SELECT COUNT(*) as count FROM HocSinh WHERE role != ?', ['teacher']);
  const count = teacherCount.count;
  // If we have exactly 44 students, assume it's already seeded correctly
  if (count === 44) return;

  // Clear existing students (except admin) to re-initialize accurately as requested
  await dbRun('DELETE FROM HocSinh WHERE role != ?', ['teacher']);

  const students = [
    // ... (students list remains the same)
    { username: "anhntv", password: "15052008", hoTen: "Nguyễn Thị Vân Anh", ngaySinh: "2008-05-15", gioiTinh: "Nữ", noiSinh: "Bình Dương", cccd: "036308007092", noiO: "Bình Cơ", sdt: "0356750384", to_group: "1", chucVu: "Học sinh", role: "student", must_change_password: 1 },
    { username: "anhnt", password: "13052008", hoTen: "Nguyễn Tuấn Anh", ngaySinh: "2008-05-13", gioiTinh: "Nam", noiSinh: "Hà Tĩnh", cccd: "042208008232", noiO: "Uyên Hưng, Tân Uyên", sdt: "0899030165", to_group: "1", chucVu: "Tổ trưởng", role: "group_leader", must_change_password: 1 },
    { username: "anhnvt", password: "15102008", hoTen: "Nguyễn Vũ Trâm Anh", ngaySinh: "2008-10-15", gioiTinh: "Nữ", noiSinh: "Nghệ An", cccd: "040308001141", noiO: "Bình Cơ", sdt: "0394036275", to_group: "1", chucVu: "Học sinh", role: "student", must_change_password: 1 },
    { username: "anhvtl", password: "29032008", hoTen: "Vũ Thị Lan Anh", ngaySinh: "2008-03-29", gioiTinh: "Nữ", noiSinh: "Bình Dương", cccd: "038308017287", noiO: "Tân Hiệp", sdt: "0394167287", to_group: "1", chucVu: "Học sinh", role: "student", must_change_password: 1 },
    { username: "baotq", password: "06012008", hoTen: "Trần Quốc Bảo", ngaySinh: "2008-01-06", gioiTinh: "Nam", noiSinh: "Bình Dương", cccd: "074208001241", noiO: "Tân Uyên, Uyên Hưng", sdt: "0858280675", to_group: "1", chucVu: "Lớp trưởng", role: "class_leader", must_change_password: 1 },
    { username: "bichctn", password: "27112008", hoTen: "Cù Thị Ngọc Bích", ngaySinh: "2008-11-27", gioiTinh: "Nữ", noiSinh: "Hà Tĩnh", cccd: "042308007861", noiO: "Bình Cơ", sdt: "0355966593", to_group: "1", chucVu: "Học sinh", role: "student", must_change_password: 1 },
    { username: "dongtbh", password: "06082008", hoTen: "Trần Bồ Huỳnh Đông", ngaySinh: "2008-08-06", gioiTinh: "Nam", noiSinh: "Bình Dương", cccd: "074208010326", noiO: "Tân Uyên", sdt: "0326573578", to_group: "1", chucVu: "Học sinh", role: "student", must_change_password: 1 },
    { username: "hanth", password: "03112008", hoTen: "Nguyễn Thị Hải Hà", ngaySinh: "2008-11-03", gioiTinh: "Nữ", noiSinh: "Hà Tĩnh", cccd: "042308000334", noiO: "Bình Cơ , tpHCM", sdt: "0329791665", to_group: "1", chucVu: "Học sinh", role: "student", must_change_password: 1 },
    { username: "hanpnn", password: "30062008", hoTen: "Phạm Nguyễn Ngọc Hân", ngaySinh: "2008-06-30", gioiTinh: "Nữ", noiSinh: "Đồng Nai", cccd: "075308008350", noiO: "Thường Tân", sdt: "0964858943", to_group: "1", chucVu: "Học sinh", role: "student", must_change_password: 1 },
    { username: "hungbm", password: "25022008", hoTen: "Bùi Mạnh Hùng", ngaySinh: "2008-02-25", gioiTinh: "Nam", noiSinh: "Bình Dương", cccd: "017208007078", noiO: "Tân Uyên", sdt: "0982810742", to_group: "1", chucVu: "Học sinh", role: "student", must_change_password: 1 },
    { username: "huynq", password: "05102008", hoTen: "Nguyễn Quang Huy", ngaySinh: "2008-10-05", gioiTinh: "Nam", noiSinh: "Bình Dương", cccd: "074208007887", noiO: "Phường Tân Phước Khánh Xã Tân Uyên", sdt: "0908572377", to_group: "1", chucVu: "Học sinh", role: "student", must_change_password: 1 },
    { username: "huyenvtm", password: "08012008", hoTen: "Võ Thị Mai Huyền", ngaySinh: "2008-01-08", gioiTinh: "Nữ", noiSinh: "Bình Dương", cccd: "078304002432", noiO: "Tân Hiệp", sdt: "0388007604", to_group: "2", chucVu: "Học sinh", role: "student", must_change_password: 1 },
    { username: "huongptk", password: "12062008", hoTen: "Phạm Thị Khánh Hường", ngaySinh: "2008-06-12", gioiTinh: "Nữ", noiSinh: "Thành phố Hồ Chí Minh", cccd: "074308002588", noiO: "Tân Hiệp, Tân Uyên", sdt: "0343430252", to_group: "2", chucVu: "Học sinh", role: "student", must_change_password: 1 },
    { username: "kiettt", password: "07062007", hoTen: "Trần Tuấn Kiệt", ngaySinh: "2007-06-07", gioiTinh: "Nam", noiSinh: "Thái Bình", cccd: "034207004216", noiO: "Uyên Hưng, Tân Uyên", sdt: "0344005545", to_group: "2", chucVu: "Học sinh", role: "student", must_change_password: 1 },
    { username: "lanvpp", password: "06052008", hoTen: "Võ Phạm Phương Lan", ngaySinh: "2008-05-06", gioiTinh: "Nữ", noiSinh: "Thành phố Hồ Chí Minh", cccd: "046308005398", noiO: "Tân Hiệp", sdt: "0916422021", to_group: "2", chucVu: "Tổ trưởng", role: "group_leader", must_change_password: 1 },
    { username: "lanhdn", password: "05102008", hoTen: "Đoàn Ngọc Lành", ngaySinh: "2008-10-05", gioiTinh: "Nữ", noiSinh: "Bình Dương", cccd: "074308019334", noiO: "Tân Uyên", sdt: "0862924020", to_group: "2", chucVu: "Học sinh", role: "student", must_change_password: 1 },
    { username: "linhctt", password: "15012008", hoTen: "Cao Thị Thùy Linh", ngaySinh: "2008-01-15", gioiTinh: "Nữ", noiSinh: "Thừa Thiên Huế", cccd: "046308005131", noiO: "Tân Hiệp, Tân Uyên", sdt: "0356815636", to_group: "2", chucVu: "Học sinh", role: "student", must_change_password: 1 },
    { username: "linhhd", password: "12022008", hoTen: "Hà Diệu Linh", ngaySinh: "2008-02-12", gioiTinh: "Nữ", noiSinh: "Bình Dương", cccd: "001308057948", noiO: "Bình Cơ", sdt: "0392494874", to_group: "2", chucVu: "Bí thư", role: "class_leader", must_change_password: 1 },
    { username: "linhldy", password: "05102008", hoTen: "Lê Đỗ Yến Linh", ngaySinh: "2008-10-05", gioiTinh: "Nữ", noiSinh: "Bình Dương", cccd: "074308006893", noiO: "Tân Khánh", sdt: "0369357674", to_group: "2", chucVu: "Học sinh", role: "student", must_change_password: 1 },
    { username: "linhntn", password: "22102008", hoTen: "Nguyễn Thị Ngọc Linh", ngaySinh: "2008-10-22", gioiTinh: "Nữ", noiSinh: "Bình Dương", cccd: "093308007270", noiO: "Tân Khánh , Thành Phố Hồ Chí Minh", sdt: "0352992737", to_group: "2", chucVu: "Học sinh", role: "student", must_change_password: 1 },
    { username: "linhntt", password: "11012008", hoTen: "Nguyễn Thị Thùy Linh", ngaySinh: "2008-01-11", gioiTinh: "Nữ", noiSinh: "Bình Dương", cccd: "074308009804", noiO: "Tân Khánh", sdt: "0899473635", to_group: "2", chucVu: "Học sinh", role: "student", must_change_password: 1 },
    { username: "linhntk", password: "12082008", hoTen: "Nguyễn Tống Khánh Linh", ngaySinh: "2008-08-12", gioiTinh: "Nữ", noiSinh: "Hà Nội", cccd: "042308001717", noiO: "Tân Uyên", sdt: "0795096824", to_group: "2", chucVu: "Học sinh", role: "student", must_change_password: 1 },
    { username: "loanlp", password: "12012008", hoTen: "Lê Phượng Loan", ngaySinh: "2008-01-12", gioiTinh: "Nữ", noiSinh: "Bình Dương", cccd: "074308007168", noiO: "Bình Cơ", sdt: "0348482500", to_group: "3", chucVu: "Học sinh", role: "student", must_change_password: 1 },
    { username: "mynmt", password: "05102008", hoTen: "Nguyễn Minh Trà My", ngaySinh: "2008-10-05", gioiTinh: "Nữ", noiSinh: "Bình Dương", cccd: "074308004778", noiO: "Tân Uyên, Bình Dương", sdt: "0385872042", to_group: "3", chucVu: "Học sinh", role: "student", must_change_password: 1 },
    { username: "mytt", password: "19032008", hoTen: "Trần Trà My", ngaySinh: "2008-03-19", gioiTinh: "Nữ", noiSinh: "Quảng Bình", cccd: "044308007002", noiO: "Tân Hiệp", sdt: "0398829604", to_group: "3", chucVu: "Học sinh", role: "student", must_change_password: 1 },
    { username: "namth", password: "08012008", hoTen: "Trần Hải Nam", ngaySinh: "2008-01-08", gioiTinh: "Nam", noiSinh: "Hưng Yên", cccd: "033208005408", noiO: "Tân Khánh", sdt: "0969067302", to_group: "3", chucVu: "Tổ trưởng", role: "group_leader", must_change_password: 1 },
    { username: "nguyentdd", password: "10052008", hoTen: "Tô Đỗ Đình Nguyên", ngaySinh: "2008-05-10", gioiTinh: "Nam", noiSinh: "Phú Yên", cccd: "054208006701", noiO: "Tân Hiệp", sdt: "0964379484", to_group: "3", chucVu: "Học sinh", role: "student", must_change_password: 1 },
    { username: "nhidtt", password: "21012008", hoTen: "Đỗ Thị Tuyết Nhi", ngaySinh: "2008-01-21", gioiTinh: "Nữ", noiSinh: "Thành phố Hồ Chí Minh", cccd: "034308011600", noiO: "Bình Cơ", sdt: "0357116441", to_group: "3", chucVu: "Học sinh", role: "student", must_change_password: 1 },
    { username: "phonglm", password: "27052008", hoTen: "Lê Mẫn Phong", ngaySinh: "2008-05-27", gioiTinh: "Nam", noiSinh: "Bình Dương", cccd: "074208000470", noiO: "Tân Uyên", sdt: "0349141429", to_group: "3", chucVu: "Học sinh", role: "student", must_change_password: 1 },
    { username: "phuldg", password: "03122008", hoTen: "Lê Đức Gia Phú", ngaySinh: "2008-12-03", gioiTinh: "Nam", noiSinh: "Bình Dương", cccd: "04228005352", noiO: "Tân Uyên tân vĩnh hiệp", sdt: "0364945913", to_group: "3", chucVu: "Học sinh", role: "student", must_change_password: 1 },
    { username: "phuongvnm", password: "14012008", hoTen: "Võ Ngọc Minh Phương", ngaySinh: "2008-01-14", gioiTinh: "Nữ", noiSinh: "Bình Dương", cccd: "074308007226", noiO: "Tân Uyên", sdt: "0395204211", to_group: "3", chucVu: "Học sinh", role: "student", must_change_password: 1 },
    { username: "quynhnkx", password: "22012008", hoTen: "Nguyễn Kim Xuân Quỳnh", ngaySinh: "2008-01-22", gioiTinh: "Nữ", noiSinh: "Bình Dương", cccd: "074308008025", noiO: "Tân Uyên", sdt: "0392063139", to_group: "3", chucVu: "Học sinh", role: "student", must_change_password: 1 },
    { username: "tainp", password: "18062008", hoTen: "Nguyễn Phước Tài", ngaySinh: "2008-06-18", gioiTinh: "Nam", noiSinh: "Sóc Trăng", cccd: "094208006078", noiO: "Tân Hiệp", sdt: "0343925138", to_group: "3", chucVu: "Học sinh", role: "student", must_change_password: 1 },
    { username: "thanhnt", password: "11052008", hoTen: "Nguyễn Thị Thanh", ngaySinh: "2008-05-11", gioiTinh: "Nữ", noiSinh: "Ninh Bình", cccd: "037308006730", noiO: "Bình Cơ", sdt: "0345099845", to_group: "4", chucVu: "Học sinh", role: "student", must_change_password: 1 },
    { username: "thaolp", password: "07082008", hoTen: "Lê Phương Thảo", ngaySinh: "2008-08-07", gioiTinh: "Nữ", noiSinh: "Thành phố Hồ Chí Minh", cccd: "046308010339", noiO: "Tân Khánh", sdt: "0346874188", to_group: "4", chucVu: "Học sinh", role: "student", must_change_password: 1 },
    { username: "thaontt", password: "09112008", hoTen: "Ngô Thị Thanh Thảo", ngaySinh: "2008-11-09", gioiTinh: "Nữ", noiSinh: "Trà Vinh", cccd: "083308008237", noiO: "Tân Uyên", sdt: "0869403698", to_group: "4", chucVu: "Học sinh", role: "student", must_change_password: 1 },
    { username: "thaotk", password: "25032008", hoTen: "Trương Kim Thảo", ngaySinh: "2008-03-25", gioiTinh: "Nữ", noiSinh: "Bình Dương", cccd: "074308008598", noiO: "Tân Uyên", sdt: "0379413732", to_group: "4", chucVu: "Học sinh", role: "student", must_change_password: 1 },
    { username: "thinhtq", password: "30112008", hoTen: "Trần Quang Thịnh", ngaySinh: "2008-11-30", gioiTinh: "Nam", noiSinh: "Thái Bình", cccd: "034208016781", noiO: "Hội Nghĩa", sdt: "0974005714", to_group: "4", chucVu: "Tổ trưởng", role: "group_leader", must_change_password: 1 },
    { username: "thylhb", password: "11092008", hoTen: "Lê Huỳnh Bảo Thy", ngaySinh: "2008-09-11", gioiTinh: "Nữ", noiSinh: "Bình Dương", cccd: "074308006897", noiO: "Tân Uyên", sdt: "0343533989", to_group: "4", chucVu: "Học sinh", role: "student", must_change_password: 1 },
    { username: "tienntt", password: "30102008", hoTen: "Nguyễn Thị Thủy Tiên", ngaySinh: "2008-10-30", gioiTinh: "Nữ", noiSinh: "Thành phố Hồ Chí Minh", cccd: "074308004970", noiO: "Tân Uyên", sdt: "0396329820", to_group: "4", chucVu: "Học sinh", role: "student", must_change_password: 1 },
    { username: "toandm", password: "13112008", hoTen: "Diệu Minh Toàn", ngaySinh: "2008-11-13", gioiTinh: "Nam", noiSinh: "Bình Dương", cccd: "074208000693", noiO: "hội nghĩa", sdt: "0979693179", to_group: "4", chucVu: "Học sinh", role: "student", must_change_password: 1 },
    { username: "tramdn", password: "31082008", hoTen: "Dương Ngọc Trâm", ngaySinh: "2008-08-31", gioiTinh: "Nữ", noiSinh: "Bình Dương", cccd: "074308001993", noiO: "Bình Cơ", sdt: "0867786939", to_group: "4", chucVu: "Học sinh", role: "student", must_change_password: 1 },
    { username: "hangnn", password: "06042007", hoTen: "Nguyễn Ngọc Hằng", ngaySinh: "2007-04-06", gioiTinh: "Nữ", noiSinh: "Đồng Nai", cccd: "074307004966", noiO: "Tân Uyên", sdt: "0843133176", to_group: "4", chucVu: "Học sinh", role: "student", must_change_password: 1 },
    { username: "trucntt", password: "18102008", hoTen: "Nguyễn Thị Thiên Trúc", ngaySinh: "2008-10-18", gioiTinh: "Nữ", noiSinh: "Bình Dương", cccd: "080308004815", noiO: "Bình Cơ", sdt: "0379626657", to_group: "4", chucVu: "Học sinh", role: "student", must_change_password: 1 }
  ];

  for (const s of students) {
    await dbRun(`
      INSERT INTO HocSinh (username, password, hoTen, ngaySinh, gioiTinh, noiSinh, cccd, noiO, sdt, to_group, chucVu, role, must_change_password)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [s.username, s.password, s.hoTen, s.ngaySinh, s.gioiTinh, s.noiSinh, s.cccd, s.noiO, s.sdt, s.to_group, s.chucVu, s.role, s.must_change_password]);
  }
}

seedStudents();

const app = express();
app.use(express.json());

async function startServer() {

  // --- API Routes ---

  // Auth
  app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const user = db.prepare('SELECT * FROM HocSinh WHERE username = ? AND password = ?').get(username, password);
    if (user) {
      res.json({ success: true, user });
    } else {
      res.status(401).json({ success: false, message: 'Sai tên đăng nhập hoặc mật khẩu' });
    }
  });

  app.post('/api/change-password', (req, res) => {
    const { username, oldPassword, newPassword } = req.body;
    const user = db.prepare('SELECT * FROM HocSinh WHERE username = ? AND password = ?').get(username, oldPassword);
    if (user) {
      db.prepare('UPDATE HocSinh SET password = ?, must_change_password = 0 WHERE username = ?').run(newPassword, username);
      res.json({ success: true });
    } else {
      res.status(401).json({ success: false, message: 'Mật khẩu cũ không chính xác' });
    }
  });

  // Students
  app.get('/api/students', (req, res) => {
    const students = db.prepare('SELECT * FROM HocSinh').all();
    res.json(students);
  });

  app.post('/api/students', (req, res) => {
    const { username, password, hoTen, role, to_group, chucVu } = req.body;
    try {
      const result = db.prepare('INSERT INTO HocSinh (username, password, hoTen, role, to_group, chucVu) VALUES (?, ?, ?, ?, ?, ?)')
        .run(username, password, hoTen, role, to_group, chucVu);
      res.json({ success: true, id: result.lastInsertRowid });
    } catch (e) {
      res.status(400).json({ success: false, message: 'Tên đăng nhập đã tồn tại' });
    }
  });

  app.put('/api/students/:id', (req, res) => {
    const { username, password, hoTen, role, to_group, chucVu } = req.body;
    const { id } = req.params;
    try {
      db.prepare('UPDATE HocSinh SET username = ?, password = ?, hoTen = ?, role = ?, to_group = ?, chucVu = ? WHERE id = ?')
        .run(username, password, hoTen, role, to_group, chucVu, id);
      res.json({ success: true });
    } catch (e) {
      res.status(400).json({ success: false, message: 'Lỗi khi cập nhật học sinh' });
    }
  });

  app.delete('/api/students/:id', (req, res) => {
    const { id } = req.params;
    try {
      db.prepare('DELETE FROM HocSinh WHERE id = ?').run(id);
      res.json({ success: true });
    } catch (e) {
      res.status(400).json({ success: false, message: 'Lỗi khi xóa học sinh' });
    }
  });

  // Logs General
  app.get('/api/logs/general', (req, res) => {
    const logs = db.prepare('SELECT * FROM Log_Chung ORDER BY ngay DESC').all();
    res.json(logs);
  });

  app.post('/api/logs/general', (req, res) => {
    const { ngay, hocTap, phongTrao, luuY, tamSu, thongBaoChung, ghiChep_ViecTot, ghiChep_ViPham, createdBy } = req.body;
    db.prepare('INSERT INTO Log_Chung (ngay, hocTap, phongTrao, luuY, tamSu, thongBaoChung, ghiChep_ViecTot, ghiChep_ViPham, createdBy) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .run(ngay, hocTap, phongTrao, luuY, tamSu, thongBaoChung, ghiChep_ViecTot, ghiChep_ViPham, createdBy);
    res.json({ success: true });
  });

  app.delete('/api/logs/general/:id', (req, res) => {
    db.prepare('DELETE FROM Log_Chung WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  });

  // Logs Group
  app.get('/api/logs/group', (req, res) => {
    const logs = db.prepare('SELECT * FROM Log_To ORDER BY ngay DESC').all();
    res.json(logs);
  });

  app.post('/api/logs/group', (req, res) => {
    const { ngay, to_group, tenHocSinh, hocTap, hoatDong, hoaDong, chuyenCan, dongPhuc, nhanRieng_VoiThay, createdBy } = req.body;
    db.prepare('INSERT INTO Log_To (ngay, to_group, tenHocSinh, hocTap, hoatDong, hoaDong, chuyenCan, dongPhuc, nhanRieng_VoiThay, createdBy) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .run(ngay, to_group, tenHocSinh, hocTap, hoatDong, hoaDong, chuyenCan, dongPhuc, nhanRieng_VoiThay, createdBy);
    res.json({ success: true });
  });

  app.delete('/api/logs/group/:id', (req, res) => {
    db.prepare('DELETE FROM Log_To WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  });

  // Logs Personal
  app.get('/api/logs/personal', (req, res) => {
    const logs = db.prepare('SELECT * FROM Log_CaNhan ORDER BY ngay DESC').all();
    res.json(logs);
  });

  app.post('/api/logs/personal', (req, res) => {
    const { id, ngay, username, tenHocSinh, diem_HT, diem_HD, diem_HoaDong, diem_CC, diem_DP, machRieng, mucDoHanhPhuc, canGapCo_KhanCap } = req.body;
    if (id) {
      db.prepare('UPDATE Log_CaNhan SET diem_HT = ?, diem_HD = ?, diem_HoaDong = ?, diem_CC = ?, diem_DP = ?, mucDoHanhPhuc = ? WHERE id = ?')
        .run(diem_HT, diem_HD, diem_HoaDong, diem_CC, diem_DP, mucDoHanhPhuc, id);
    } else {
      db.prepare('INSERT INTO Log_CaNhan (ngay, username, tenHocSinh, diem_HT, diem_HD, diem_HoaDong, diem_CC, diem_DP, machRieng, mucDoHanhPhuc, canGapCo_KhanCap) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
        .run(ngay, username, tenHocSinh, diem_HT, diem_HD, diem_HoaDong, diem_CC, diem_DP, machRieng, mucDoHanhPhuc, canGapCo_KhanCap ? 1 : 0);
    }
    res.json({ success: true });
  });

  app.delete('/api/logs/personal/:id', (req, res) => {
    db.prepare('DELETE FROM Log_CaNhan WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  });

  // Teacher Feedback & Stickers
  app.get('/api/feedback/:username', (req, res) => {
    const feedback = db.prepare('SELECT * FROM PhanHoi_GVCN WHERE username = ? ORDER BY ngay DESC').all(req.params.username);
    res.json(feedback);
  });

  app.post('/api/feedback', (req, res) => {
    const { ngay, username, noiDungPhanHoi, loaiSticker, stickerIcon } = req.body;
    db.prepare('INSERT INTO PhanHoi_GVCN (ngay, username, noiDungPhanHoi, loaiSticker, stickerIcon) VALUES (?, ?, ?, ?, ?)')
      .run(ngay, username, noiDungPhanHoi, loaiSticker, stickerIcon);
    
    if (loaiSticker) {
      db.prepare('UPDATE HocSinh SET sticker_count = sticker_count + 1 WHERE username = ?').run(username);
    }
    res.json({ success: true });
  });

  app.delete('/api/feedback/:id', (req, res) => {
    db.prepare('DELETE FROM PhanHoi_GVCN WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  });

  // Messages (Mách thầy)
  app.get('/api/messages/:username', (req, res) => {
    const messages = db.prepare('SELECT * FROM TinNhan WHERE username = ? ORDER BY ngay DESC').all(req.params.username);
    res.json(messages);
  });

  app.get('/api/messages', (req, res) => {
    const messages = db.prepare('SELECT * FROM TinNhan ORDER BY ngay DESC').all();
    res.json(messages);
  });

  app.post('/api/messages', (req, res) => {
    const { ngay, username, tenHocSinh, noiDung, isEmergency } = req.body;
    db.prepare('INSERT INTO TinNhan (ngay, username, tenHocSinh, noiDung, isEmergency) VALUES (?, ?, ?, ?, ?)')
      .run(ngay, username, tenHocSinh, noiDung, isEmergency ? 1 : 0);
    res.json({ success: true });
  });

  app.delete('/api/messages/:id', (req, res) => {
    db.prepare('DELETE FROM TinNhan WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  });

  // --- Statistics ---

  app.get('/api/stats/weekly', (req, res) => {
    // Reference: March 9, 2026 is the start of Week 25
    const refDate = new Date('2026-03-09T00:00:00Z');
    
    const logs = db.prepare('SELECT * FROM Log_CaNhan').all() as any[];
    
    const stats: Record<number, any> = {};

    logs.forEach(log => {
      const logDate = new Date(log.ngay.replace(' ', 'T') + 'Z');
      const diffTime = logDate.getTime() - refDate.getTime();
      const weekOffset = Math.floor(diffTime / (7 * 24 * 60 * 60 * 1000));
      const weekNum = 25 + weekOffset;

      if (weekNum < 25) return;

      if (!stats[weekNum]) {
        stats[weekNum] = {
          week: weekNum,
          count: 0,
          sum_HT: 0,
          sum_HD: 0,
          sum_HoaDong: 0,
          sum_CC: 0,
          sum_DP: 0,
          sum_HanhPhuc: 0,
          emergencyCount: 0
        };
      }

      const s = stats[weekNum];
      s.count++;
      s.sum_HT += log.diem_HT;
      s.sum_HD += log.diem_HD;
      s.sum_HoaDong += log.diem_HoaDong;
      s.sum_CC += log.diem_CC;
      s.sum_DP += log.diem_DP;
      s.sum_HanhPhuc += log.mucDoHanhPhuc;
      if (log.canGapCo_KhanCap) s.emergencyCount++;
    });

    const result = Object.values(stats).map((s: any) => ({
      week: s.week,
      avg_HT: s.sum_HT / s.count,
      avg_HD: s.sum_HD / s.count,
      avg_HoaDong: s.sum_HoaDong / s.count,
      avg_CC: s.sum_CC / s.count,
      avg_DP: s.sum_DP / s.count,
      avg_HanhPhuc: s.sum_HanhPhuc / s.count,
      emergencyCount: s.emergencyCount
    }));

    res.json(result);
  });

  app.get('/api/stats/monthly', (req, res) => {
    const logs = db.prepare('SELECT * FROM Log_CaNhan').all() as any[];
    const stats: Record<string, any> = {};

    logs.forEach(log => {
      const logDate = new Date(log.ngay.replace(' ', 'T') + 'Z');
      const monthKey = `${logDate.getFullYear()}-${String(logDate.getMonth() + 1).padStart(2, '0')}`;

      if (!stats[monthKey]) {
        stats[monthKey] = {
          month: monthKey,
          count: 0,
          sum_HT: 0,
          sum_HD: 0,
          sum_HoaDong: 0,
          sum_CC: 0,
          sum_DP: 0,
          sum_HanhPhuc: 0,
        };
      }

      const s = stats[monthKey];
      s.count++;
      s.sum_HT += log.diem_HT;
      s.sum_HD += log.diem_HD;
      s.sum_HoaDong += log.diem_HoaDong;
      s.sum_CC += log.diem_CC;
      s.sum_DP += log.diem_DP;
      s.sum_HanhPhuc += log.mucDoHanhPhuc;
    });

    const result = Object.values(stats).map((s: any) => ({
      month: s.month,
      avg_HT: s.sum_HT / s.count,
      avg_HD: s.sum_HD / s.count,
      avg_HoaDong: s.sum_HoaDong / s.count,
      avg_CC: s.sum_CC / s.count,
      avg_DP: s.sum_DP / s.count,
      avg_HanhPhuc: s.sum_HanhPhuc / s.count,
    }));

    res.json(result);
  });

  // --- Vite Middleware ---
  if (process.env.NODE_ENV !== 'production' && process.env.VERCEL !== '1') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(process.cwd(), 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(process.cwd(), 'dist', 'index.html'));
    });
  }

  const PORT = process.env.PORT || 3000;
  if (process.env.VERCEL !== '1') {
    app.listen(Number(PORT), '0.0.0.0', () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  }
}

startServer();

export default app;
