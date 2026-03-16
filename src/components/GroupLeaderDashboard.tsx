import React, { useState, useEffect } from 'react';
import { Student, LogGroup } from '../types';
import { Send, Users, MessageSquare } from 'lucide-react';
import Swal from 'sweetalert2';
import { format } from 'date-fns';

interface Props {
  profile: Student;
}

export default function GroupLeaderDashboard({ profile }: Props) {
  const [groupMembers, setGroupMembers] = useState<Student[]>([]);
  const [selectedMember, setSelectedMember] = useState<string>('');
  const [log, setLog] = useState<Partial<LogGroup>>({
    hocTap: 10,
    hoatDong: 10,
    hoaDong: 10,
    chuyenCan: 10,
    dongPhuc: 10,
    nhanRieng_VoiThay: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const response = await fetch('/api/students');
        const data = await response.json();
        if (Array.isArray(data)) {
          setGroupMembers(data.filter((s: Student) => s.to_group === profile.to_group && s.username !== profile.username));
        }
      } catch (error) {
        console.error('Error fetching members:', error);
      }
    };
    fetchMembers();
  }, [profile.to_group]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) {
      Swal.fire('Lỗi', 'Vui lòng chọn học sinh để chấm điểm.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const member = groupMembers.find(m => m.username === selectedMember);
      const response = await fetch('/api/logs/group', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...log,
          tenHocSinh: member?.hoTen || '',
          to_group: profile.to_group,
          ngay: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
        }),
      });
      const data = await response.json();
      if (data.success) {
        Swal.fire('Thành công', `Đã chấm điểm cho ${member?.hoTen}`, 'success');
        setLog({
          hocTap: 10, hoatDong: 10, hoaDong: 10, chuyenCan: 10, dongPhuc: 10, nhanRieng_VoiThay: ''
        });
        setSelectedMember('');
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
      <div className="bg-white rounded-2xl shadow-sm p-8 border border-slate-200">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
            <Users className="text-emerald-600 w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Chấm điểm Tổ {profile.to_group}</h1>
            <p className="text-slate-500">Tổ trưởng: {profile.hoTen}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Chọn thành viên trong tổ</label>
            <select
              value={selectedMember}
              onChange={(e) => setSelectedMember(e.target.value)}
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">-- Chọn học sinh --</option>
              {groupMembers.map(m => (
                <option key={m.username} value={m.username}>{m.hoTen}</option>
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
                  {item.label} <span>{log[item.key as keyof LogGroup]}/10</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={log[item.key as keyof LogGroup] as number}
                  onChange={(e) => setLog({ ...log, [item.key]: parseInt(e.target.value) })}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" /> Nhắn riêng với thầy/cô về thành viên này
            </label>
            <textarea
              value={log.nhanRieng_VoiThay}
              onChange={(e) => setLog({ ...log, nhanRieng_VoiThay: e.target.value })}
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
            {submitting ? 'Đang gửi...' : 'Gửi chấm điểm tổ'}
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
