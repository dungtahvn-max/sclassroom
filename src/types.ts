export type UserRole = 'student' | 'class_leader' | 'group_leader' | 'teacher';

export interface Student {
  id?: number;
  username: string;
  password?: string;
  hoTen: string;
  ngaySinh: string;
  gioiTinh: string;
  noiSinh: string;
  cccd: string;
  noiO: string;
  sdt: string;
  to_group: string;
  chucVu: string;
  sticker_count: number;
  role: UserRole;
  must_change_password?: number;
}

export interface LogGeneral {
  id?: number;
  ngay: string;
  hocTap: string;
  phongTrao: string;
  luuY: string;
  tamSu: string;
  thongBaoChung: string;
  ghiChep_ViecTot: string;
  ghiChep_ViPham: string;
  createdBy: string;
}

export interface LogGroup {
  id?: number;
  ngay: string;
  to_group: string;
  tenHocSinh: string;
  hocTap: number;
  hoatDong: number;
  hoaDong: number;
  chuyenCan: number;
  dongPhuc: number;
  nhanRieng_VoiThay: string;
  createdBy: string;
}

export interface LogPersonal {
  id?: number;
  ngay: string;
  username: string;
  tenHocSinh: string;
  diem_HT: number;
  diem_HD: number;
  diem_HoaDong: number;
  diem_CC: number;
  diem_DP: number;
  machRieng: string;
  mucDoHanhPhuc: number;
  canGapCo_KhanCap: boolean;
}

export interface TeacherFeedback {
  id?: number;
  ngay: string;
  username: string;
  noiDungPhanHoi: string;
  loaiSticker: string;
  stickerIcon: string;
}

export interface TinNhan {
  id?: number;
  ngay: string;
  username: string;
  tenHocSinh: string;
  noiDung: string;
  isEmergency: boolean;
}
