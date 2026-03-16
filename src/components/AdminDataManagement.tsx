import React, { useState, useEffect } from 'react';
import { Student } from '../types';
import { 
  Users, 
  Plus, 
  Edit2, 
  Trash2, 
  Search, 
  Download, 
  X, 
  Save,
  Database,
  FileText,
  Eye,
  EyeOff
} from 'lucide-react';
import Swal from 'sweetalert2';

export default function AdminDataManagement() {
  const [students, setStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    hoTen: '',
    role: 'student',
    to_group: '1',
    chucVu: 'Học sinh'
  });
  const [activeTab, setActiveTab] = useState<'students' | 'logs'>('students');
  const [personalLogs, setPersonalLogs] = useState<any[]>([]);
  const [generalLogs, setGeneralLogs] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [feedback, setFeedback] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  useEffect(() => {
    fetchStudents();
    if (activeTab === 'logs') {
      fetchLogs();
    }
  }, [activeTab]);

  const fetchStudents = async () => {
    try {
      const response = await fetch('/api/students');
      const data = await response.json();
      setStudents(data);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const fetchLogs = async () => {
    setLoadingLogs(true);
    try {
      const [pRes, gRes, mRes, fRes] = await Promise.all([
        fetch('/api/logs/personal'),
        fetch('/api/logs/general'),
        fetch('/api/messages'),
        fetch('/api/feedback')
      ]);
      setPersonalLogs(await pRes.json());
      setGeneralLogs(await gRes.json());
      setMessages(await mRes.json());
      setFeedback(await fRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleDeleteLog = async (type: string, id: number) => {
    const result = await Swal.fire({
      title: 'Xác nhận xóa?',
      text: "Dữ liệu này sẽ bị xóa vĩnh viễn!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Xóa',
      cancelButtonText: 'Hủy'
    });

    if (result.isConfirmed) {
      try {
        let url = '';
        if (type === 'personal') url = `/api/logs/personal/${id}`;
        else if (type === 'general') url = `/api/logs/general/${id}`;
        else if (type === 'feedback') url = `/api/feedback/${id}`;
        else if (type === 'message') url = `/api/messages/${id}`;

        const res = await fetch(url, { method: 'DELETE' });
        if ((await res.json()).success) {
          Swal.fire('Đã xóa', '', 'success');
          fetchLogs();
        }
      } catch (e) {
        Swal.fire('Lỗi', 'Không thể xóa.', 'error');
      }
    }
  };

  const handleOpenModal = (student: Student | null = null) => {
    if (student) {
      setEditingStudent(student);
      setFormData({
        username: student.username,
        password: student.password || '',
        hoTen: student.hoTen,
        role: student.role,
        to_group: student.to_group || '1',
        chucVu: student.chucVu || 'Học sinh'
      });
    } else {
      setEditingStudent(null);
      setFormData({
        username: '',
        password: '',
        hoTen: '',
        role: 'student',
        to_group: '1',
        chucVu: 'Học sinh'
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingStudent ? `/api/students/${editingStudent.id}` : '/api/students';
    const method = editingStudent ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await response.json();

      if (data.success) {
        Swal.fire('Thành công', editingStudent ? 'Đã cập nhật học sinh' : 'Đã thêm học sinh mới', 'success');
        setIsModalOpen(false);
        fetchStudents();
      } else {
        Swal.fire('Lỗi', data.message || 'Có lỗi xảy ra', 'error');
      }
    } catch (error) {
      Swal.fire('Lỗi', 'Không thể kết nối đến máy chủ', 'error');
    }
  };

  const handleDelete = async (id: number) => {
    const result = await Swal.fire({
      title: 'Bạn có chắc chắn?',
      text: "Dữ liệu học sinh sẽ bị xóa vĩnh viễn!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Xóa ngay',
      cancelButtonText: 'Hủy'
    });

    if (result.isConfirmed) {
      try {
        const response = await fetch(`/api/students/${id}`, { method: 'DELETE' });
        const data = await response.json();
        if (data.success) {
          Swal.fire('Đã xóa!', 'Học sinh đã được xóa khỏi hệ thống.', 'success');
          fetchStudents();
        }
      } catch (error) {
        Swal.fire('Lỗi', 'Không thể xóa học sinh', 'error');
      }
    }
  };

  const filteredStudents = students.filter(s => 
    s.hoTen.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const exportToCSV = () => {
    const headers = ['ID', 'Tên đăng nhập', 'Họ tên', 'Vai trò', 'Tổ', 'Chức vụ', 'Sticker'];
    const rows = students.map(s => [
      s.id,
      s.username,
      s.hoTen,
      s.role,
      s.to_group,
      s.chucVu,
      s.sticker_count
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `danh_sach_hoc_sinh_${new Date().toLocaleDateString()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <Database className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Quản trị dữ liệu</h1>
            <p className="text-slate-500 text-sm">Quản lý danh sách học sinh và hệ thống</p>
          </div>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('students')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'students' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Học sinh
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'logs' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Nhật ký hệ thống
          </button>
        </div>
      </div>

      {activeTab === 'students' ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* ... existing student table ... */}
          <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-50/50">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm kiếm tên hoặc tài khoản..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>
            
            <div className="flex items-center gap-2 w-full md:w-auto">
              <button 
                onClick={exportToCSV}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50 transition-all"
              >
                <Download className="w-4 h-4" /> Xuất CSV
              </button>
              <button 
                onClick={() => handleOpenModal()}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
              >
                <Plus className="w-4 h-4" /> Thêm mới
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Học sinh</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Tài khoản</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Tổ / Chức vụ</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Stickers</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 font-bold">
                          {student.hoTen.charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">{student.hoTen}</div>
                          <div className="text-xs text-slate-500 capitalize">{student.role}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 font-mono">{student.username}</td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-900">Tổ {student.to_group}</div>
                      <div className="text-xs text-slate-500">{student.chucVu}</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                        ⭐ {student.sticker_count}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleOpenModal(student)}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(student.id!)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Personal Logs */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-slate-900 flex justify-between items-center">
                <span>Nhật ký cá nhân</span>
                <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-1 rounded-full">{personalLogs.length}</span>
              </div>
              <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
                {personalLogs.map(log => (
                  <div key={log.id} className="p-4 hover:bg-slate-50 transition-colors relative group">
                    <button 
                      onClick={() => handleDeleteLog('personal', log.id)}
                      className="absolute top-4 right-4 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <p className="text-xs font-bold text-indigo-600">{log.ngay}</p>
                    <p className="font-bold text-sm text-slate-900">{log.tenHocSinh}</p>
                    <p className="text-sm text-slate-600 mt-1">{log.machRieng || 'Không có tâm sự'}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* General Logs */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-slate-900 flex justify-between items-center">
                <span>Báo cáo Ban cán sự</span>
                <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-1 rounded-full">{generalLogs.length}</span>
              </div>
              <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
                {generalLogs.map(log => (
                  <div key={log.id} className="p-4 hover:bg-slate-50 transition-colors relative group">
                    <button 
                      onClick={() => handleDeleteLog('general', log.id)}
                      className="absolute top-4 right-4 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <p className="text-xs font-bold text-indigo-600">{log.ngay}</p>
                    <p className="text-sm font-bold text-slate-900">Tốt: <span className="font-normal">{log.ghiChep_ViecTot}</span></p>
                    <p className="text-sm font-bold text-red-600">Vi phạm: <span className="font-normal text-slate-600">{log.ghiChep_ViPham}</span></p>
                  </div>
                ))}
              </div>
            </div>

            {/* Messages */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-slate-900 flex justify-between items-center">
                <span>Tin nhắn mách thầy</span>
                <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-1 rounded-full">{messages.length}</span>
              </div>
              <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
                {messages.map(m => (
                  <div key={m.id} className={`p-4 hover:bg-slate-50 transition-colors relative group ${m.isEmergency ? 'bg-red-50' : ''}`}>
                    <button 
                      onClick={() => handleDeleteLog('message', m.id)}
                      className="absolute top-4 right-4 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <p className="text-xs font-bold text-indigo-600">{m.ngay}</p>
                    <p className="font-bold text-sm text-slate-900">{m.tenHocSinh}</p>
                    <p className="text-sm text-slate-600 mt-1">{m.noiDung}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Feedback */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-slate-900 flex justify-between items-center">
                <span>Phản hồi của giáo viên</span>
                <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-1 rounded-full">{feedback.length}</span>
              </div>
              <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
                {feedback.map(f => (
                  <div key={f.id} className="p-4 hover:bg-slate-50 transition-colors relative group">
                    <button 
                      onClick={() => handleDeleteLog('feedback', f.id)}
                      className="absolute top-4 right-4 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <p className="text-xs font-bold text-indigo-600">{f.ngay}</p>
                    <p className="font-bold text-sm text-slate-900">Gửi tới: {f.username}</p>
                    <p className="text-sm text-slate-600 mt-1">{f.noiDungPhanHoi}</p>
                    {f.loaiSticker && <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full mt-2 inline-block">Sticker: {f.loaiSticker}</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-900">
                {editingStudent ? 'Cập nhật học sinh' : 'Thêm học sinh mới'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Tên đăng nhập</label>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Mật khẩu</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      className="w-full px-4 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Họ và tên</label>
                <input
                  type="text"
                  required
                  value={formData.hoTen}
                  onChange={(e) => setFormData({...formData, hoTen: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Tổ</label>
                  <select
                    value={formData.to_group}
                    onChange={(e) => setFormData({...formData, to_group: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="1">Tổ 1</option>
                    <option value="2">Tổ 2</option>
                    <option value="3">Tổ 3</option>
                    <option value="4">Tổ 4</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Vai trò</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="student">Học sinh</option>
                    <option value="class_leader">Lớp trưởng</option>
                    <option value="group_leader">Tổ trưởng</option>
                    <option value="teacher">Giáo viên</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Chức vụ</label>
                <input
                  type="text"
                  value={formData.chucVu}
                  onChange={(e) => setFormData({...formData, chucVu: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Ví dụ: Lớp trưởng, Tổ trưởng tổ 1..."
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-all"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" /> Lưu dữ liệu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
