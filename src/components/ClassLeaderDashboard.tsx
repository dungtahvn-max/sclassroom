import React, { useState, useEffect } from 'react';
import { Student, LogGeneral, LogGroup } from '../types';
import { Send, ClipboardList, Megaphone, CheckCircle, AlertCircle, Users, MessageSquare, User } from 'lucide-react';
import Swal from 'sweetalert2';
import { format } from 'date-fns';
import StudentDashboard from './StudentDashboard';

interface Props {
  profile: Student;
}

export default function ClassLeaderDashboard({ profile }: Props) {
  const [log, setLog] = useState<Partial<LogGeneral>>({
    hocTap: '',
    phongTrao: '',
    luuY: '',
    tamSu: '',
    thongBaoChung: '',
    ghiChep_ViecTot: '',
    ghiChep_ViPham: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'leadership' | 'personal'>('leadership');
  const [groupLeaders, setGroupLeaders] = useState<Student[]>([]);
  const [selectedLeader, setSelectedLeader] = useState<string>('');
  const [groupLog, setGroupLog] = useState<Partial<LogGroup>>({
    hocTap: 10,
    hoatDong: 10,
    hoaDong: 10,
    chuyenCan: 10,
    dongPhuc: 10,
    nhanRieng_VoiThay: '',
  });

  useEffect(() => {
    const fetchLeaders = async () => {
      try {
        const response = await fetch('/api/students');
        const data = await response.json();
        if (Array.isArray(data)) {
          setGroupLeaders(data.filter((s: Student) => s.role === 'group_leader'));
        }
      } catch (error) {
        console.error('Error fetching leaders:', error);
      }
    };
    fetchLeaders();
  }, []);

  const handleSubmitGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const response = await fetch('/api/logs/general', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...log,
          createdBy: profile.username,
          ngay: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
        }),
      });
      const data = await response.json();
      if (data.success) {
        Swal.fire('Thành công', 'Báo cáo lớp đã được gửi!', 'success');
        setLog({
          hocTap: '', phongTrao: '', luuY: '', tamSu: '',
          thongBaoChung: '', ghiChep_ViecTot: '', ghiChep_ViPham: ''
        });
      }
    } catch (error) {
      console.error(error);
      Swal.fire('Lỗi', 'Không thể gửi báo cáo.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeader) {
      Swal.fire('Lỗi', 'Vui lòng chọn tổ trưởng để chấm điểm.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const leader = groupLeaders.find(m => m.username === selectedLeader);
      const response = await fetch('/api/logs/group', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...groupLog,
          tenHocSinh: leader?.hoTen || '',
          to_group: leader?.to_group || '',
          createdBy: profile.username,
          ngay: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
        }),
      });
      const data = await response.json();
      if (data.success) {
        Swal.fire('Thành công', `Đã chấm điểm cho ${leader?.hoTen}`, 'success');
        setGroupLog({
          hocTap: 10, hoatDong: 10, hoaDong: 10, chuyenCan: 10, dongPhuc: 10, nhanRieng_VoiThay: ''
        });
        setSelectedLeader('');
      }
    } catch (error) {
      console.error(error);
      Swal.fire('Lỗi', 'Không thể gửi chấm điểm.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Tab Navigation */}
      <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-slate-200 w-fit mx-auto sm:mx-0">
        <button
          onClick={() => setActiveTab('leadership')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'leadership' 
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' 
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <ClipboardList className="w-4 h-4" /> Ban cán sự
        </button>
        <button
          onClick={() => setActiveTab('personal')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'personal' 
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' 
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <User className="w-4 h-4" /> Cá nhân
        </button>
      </div>

      {activeTab === 'personal' ? (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <StudentDashboard profile={profile} />
        </div>
      ) : (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* General Report Section */}
          <div className="bg-white rounded-2xl shadow-sm p-8 border border-slate-200">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                <ClipboardList className="text-indigo-600 w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Báo cáo Lớp trưởng / Bí thư</h1>
                <p className="text-slate-500">Cập nhật tình hình chung của lớp ngày {format(new Date(), 'dd/MM/yyyy')}</p>
              </div>
            </div>

            <form onSubmit={handleSubmitGeneral} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Tình hình học tập</label>
                  <textarea
                    value={log.hocTap}
                    onChange={(e) => setLog({ ...log, hocTap: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    rows={2}
                    placeholder="Nhận xét chung về học tập..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Phong trào & Hoạt động</label>
                  <textarea
                    value={log.phongTrao}
                    onChange={(e) => setLog({ ...log, phongTrao: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    rows={2}
                    placeholder="Các hoạt động đã diễn ra..."
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <Megaphone className="w-4 h-4 text-indigo-600" /> Thông báo chung cho lớp
                </label>
                <textarea
                  value={log.thongBaoChung}
                  onChange={(e) => setLog({ ...log, thongBaoChung: e.target.value })}
                  className="w-full p-3 bg-indigo-50 border-indigo-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  rows={2}
                  placeholder="Thông báo này sẽ hiển thị trên Dashboard của tất cả học sinh..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-emerald-700 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" /> Ghi chép việc tốt
                  </label>
                  <textarea
                    value={log.ghiChep_ViecTot}
                    onChange={(e) => setLog({ ...log, ghiChep_ViecTot: e.target.value })}
                    className="w-full p-3 bg-emerald-50 border border-emerald-100 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    rows={3}
                    placeholder="Tên học sinh + Việc tốt..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-red-700 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" /> Ghi chép vi phạm
                  </label>
                  <textarea
                    value={log.ghiChep_ViPham}
                    onChange={(e) => setLog({ ...log, ghiChep_ViPham: e.target.value })}
                    className="w-full p-3 bg-red-50 border border-red-100 rounded-xl focus:ring-2 focus:ring-red-500 outline-none"
                    rows={3}
                    placeholder="Tên học sinh + Vi phạm..."
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
              >
                {submitting ? 'Đang gửi...' : 'Gửi báo cáo tổng hợp'}
                <Send className="w-5 h-5" />
              </button>
            </form>
          </div>

          {/* Group Leader Evaluation Section */}
          <div className="bg-white rounded-2xl shadow-sm p-8 border border-slate-200">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                <Users className="text-emerald-600 w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Nhận xét Tổ trưởng</h2>
                <p className="text-slate-500">Đánh giá hoạt động của các tổ trưởng</p>
              </div>
            </div>

            <form onSubmit={handleSubmitGroup} className="space-y-8">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Chọn Tổ trưởng</label>
                <select
                  value={selectedLeader}
                  onChange={(e) => setSelectedLeader(e.target.value)}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">-- Chọn tổ trưởng --</option>
                  {groupLeaders.map(m => (
                    <option key={m.username} value={m.username}>{m.hoTen} (Tổ {m.to_group})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {[
                  { label: 'Học tập', key: 'hocTap' },
                  { label: 'Hoạt động', key: 'hoatDong' },
                  { label: 'Hòa đồng', key: 'hoaDong' },
                  { label: 'Chuyên cần', key: 'chuyenCan' },
                  { label: 'Đồng phục', key: 'dongPhuc' },
                ].map((item) => (
                  <div key={item.key} className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 flex justify-between">
                      {item.label} <span>{groupLog[item.key as keyof LogGroup]}/10</span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      value={groupLog[item.key as keyof LogGroup] as number}
                      onChange={(e) => setGroupLog({ ...groupLog, [item.key]: parseInt(e.target.value) })}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                    />
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" /> Nhận xét riêng về tổ trưởng này
                </label>
                <textarea
                  value={groupLog.nhanRieng_VoiThay}
                  onChange={(e) => setGroupLog({ ...groupLog, nhanRieng_VoiThay: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                  rows={3}
                  placeholder="Nhận xét riêng hoặc vấn đề cần lưu ý..."
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
              >
                {submitting ? 'Đang gửi...' : 'Gửi nhận xét tổ trưởng'}
                <Send className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
