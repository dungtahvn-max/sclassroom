import React, { useState, useEffect } from 'react';
import { Student, LogPersonal, TeacherFeedback, LogGeneral, TinNhan } from '../types';
import { Star, Send, AlertTriangle, MessageCircle, Info, Loader2, Edit2, History } from 'lucide-react';
import Swal from 'sweetalert2';
import { format, isSameDay } from 'date-fns';

interface Props {
  profile: Student;
}

export default function StudentDashboard({ profile }: Props) {
  const [personalLog, setPersonalLog] = useState<Partial<LogPersonal>>({
    diem_HT: 10,
    diem_HD: 10,
    diem_HoaDong: 10,
    diem_CC: 10,
    diem_DP: 10,
    mucDoHanhPhuc: 10,
    canGapCo_KhanCap: false,
    machRieng: '',
  });
  const [feedbacks, setFeedbacks] = useState<TeacherFeedback[]>([]);
  const [announcements, setAnnouncements] = useState<LogGeneral[]>([]);
  const [messages, setMessages] = useState<TinNhan[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [isSubmittedToday, setIsSubmittedToday] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [todayLogId, setTodayLogId] = useState<number | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isEmergencyMessage, setIsEmergencyMessage] = useState(false);

  const fetchData = async () => {
    try {
      const [feedbackRes, annRes, personalRes, msgRes] = await Promise.all([
        fetch(`/api/feedback/${profile.username}`),
        fetch('/api/logs/general'),
        fetch('/api/logs/personal'),
        fetch(`/api/messages/${profile.username}`)
      ]);
      const feedbackData = await feedbackRes.json();
      const annData = await annRes.json();
      const personalLogs = await personalRes.json();
      const msgData = await msgRes.json();
      
      setFeedbacks(feedbackData);
      setAnnouncements(annData);
      setMessages(msgData);

      // Check if submitted today
      const today = new Date();
      const todayLog = personalLogs.find((l: LogPersonal) => 
        l.username === profile.username && isSameDay(new Date(l.ngay), today)
      );

      if (todayLog) {
        setIsSubmittedToday(true);
        setTodayLogId(todayLog.id);
        if (!isEditing) {
          setPersonalLog(todayLog);
        }
      } else {
        setIsSubmittedToday(false);
        setTodayLogId(null);
      }

      // Check for new stickers
      if (feedbackData.length > 0 && feedbackData[0].loaiSticker) {
        const lastSeen = localStorage.getItem(`last_sticker_${profile.username}`);
        if (lastSeen !== feedbackData[0].id.toString()) {
          Swal.fire({
            title: 'Chúc mừng!',
            text: `Bạn vừa nhận được sticker: ${feedbackData[0].loaiSticker}`,
            icon: 'success',
            confirmButtonText: 'Tuyệt vời!',
            backdrop: `rgba(0,0,123,0.4) url("https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJqZ2R6Z3Fwb3Jtc2sybnAybnAybnAybnAybnAybnAybnA/3o7TKDkDbIDJieKbVm/giphy.gif") left top no-repeat`
          });
          localStorage.setItem(`last_sticker_${profile.username}`, feedbackData[0].id.toString());
        }
      }
    } catch (e) {
      console.error("Fetch error", e);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [profile.username, isEditing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const response = await fetch('/api/logs/personal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...personalLog,
          id: todayLogId,
          username: profile.username,
          tenHocSinh: profile.hoTen,
          ngay: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
        }),
      });
      const data = await response.json();
      if (data.success) {
        Swal.fire('Thành công', isEditing ? 'Đã cập nhật nhật ký!' : 'Nhật ký cá nhân đã được gửi!', 'success');
        setIsEditing(false);
        fetchData();
      }
    } catch (error) {
      console.error(error);
      Swal.fire('Lỗi', 'Không thể gửi nhật ký.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ngay: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
          username: profile.username,
          tenHocSinh: profile.hoTen,
          noiDung: newMessage,
          isEmergency: isEmergencyMessage,
        }),
      });
      if ((await response.json()).success) {
        setNewMessage('');
        setIsEmergencyMessage(false);
        fetchData();
        Swal.fire('Đã gửi', 'Tin nhắn của em đã được gửi tới thầy cô.', 'success');
      }
    } catch (e) {
      Swal.fire('Lỗi', 'Không thể gửi tin nhắn.', 'error');
    }
  };

  const currentWeekAnnouncements = announcements.filter(ann => {
    const annDate = new Date(ann.ngay);
    const now = new Date();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 1));
    startOfWeek.setHours(0,0,0,0);
    return annDate >= startOfWeek;
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column: Announcements & Stickers */}
      <div className="lg:col-span-1 space-y-6">
        {/* Stickers Section */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-200">
          <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Star className="text-yellow-500 fill-yellow-500" /> Sticker của tôi
          </h2>
          <div className="flex flex-wrap gap-3">
            {feedbacks.filter(f => f.loaiSticker).length > 0 ? (
              feedbacks.filter(f => f.loaiSticker).map((f, i) => (
                <div key={i} className="flex flex-col items-center p-3 bg-yellow-50 rounded-xl border border-yellow-100">
                  <span className="text-3xl">{f.stickerIcon || '⭐'}</span>
                  <span className="text-xs font-bold text-yellow-700 mt-1">{f.loaiSticker}</span>
                </div>
              ))
            ) : (
              <p className="text-slate-400 text-sm italic">Chưa có sticker nào. Hãy cố gắng nhé!</p>
            )}
          </div>
        </div>

        {/* Announcements */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-200">
          <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Info className="text-indigo-600" /> Thông báo tuần này
          </h2>
          <div className="space-y-4">
            {currentWeekAnnouncements.length > 0 ? (
              currentWeekAnnouncements.map((ann, i) => (
                <div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-xs text-slate-400 mb-1">{ann.ngay}</p>
                  <p className="text-sm text-slate-700 font-medium">{ann.thongBaoChung}</p>
                </div>
              ))
            ) : (
              <p className="text-slate-400 text-sm italic">Không có thông báo mới trong tuần này.</p>
            )}
          </div>
        </div>
      </div>

      {/* Right Column: Self Evaluation Form & Messages */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-200 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-slate-900">Tự đánh giá hàng ngày</h2>
            {isSubmittedToday && !isEditing && (
              <button 
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 text-indigo-600 font-bold hover:bg-indigo-50 px-3 py-1 rounded-lg transition-all"
              >
                <Edit2 className="w-4 h-4" /> Chỉnh sửa
              </button>
            )}
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: 'Học tập', key: 'diem_HT' },
                { label: 'Hoạt động', key: 'diem_HD' },
                { label: 'Hòa đồng', key: 'diem_HoaDong' },
                { label: 'Chuyên cần', key: 'diem_CC' },
                { label: 'Đồng phục', key: 'diem_DP' },
                { label: 'Mức độ hạnh phúc', key: 'mucDoHanhPhuc' },
              ].map((item) => (
                <div key={item.key} className={`space-y-2 ${isSubmittedToday && !isEditing ? 'opacity-50 pointer-events-none' : ''}`}>
                  <label className="text-sm font-semibold text-slate-700 flex justify-between">
                    {item.label} <span>{personalLog[item.key as keyof LogPersonal]}/10</span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={personalLog[item.key as keyof LogPersonal] as number}
                    onChange={(e) => setPersonalLog({ ...personalLog, [item.key]: parseInt(e.target.value) })}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                </div>
              ))}
            </div>

            <button
              type="submit"
              disabled={submitting || (isSubmittedToday && !isEditing)}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              {isEditing ? 'Cập nhật đánh giá' : 'Gửi đánh giá'}
            </button>
          </form>
        </div>

        {/* Mách thầy Section */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-200 space-y-4">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <MessageCircle className="text-indigo-600" /> Mách riêng với thầy/cô
          </h2>
          <div className="space-y-4">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              placeholder="Em muốn tâm sự điều gì..."
              rows={3}
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="msg-emergency"
                  checked={isEmergencyMessage}
                  onChange={(e) => setIsEmergencyMessage(e.target.checked)}
                  className="w-4 h-4 accent-red-600"
                />
                <label htmlFor="msg-emergency" className="text-sm font-bold text-red-600 cursor-pointer">Khẩn cấp!</label>
              </div>
              <button
                onClick={handleSendMessage}
                className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all flex items-center gap-2"
              >
                <Send className="w-4 h-4" /> Gửi tin nhắn
              </button>
            </div>
          </div>

          {/* Message History */}
          {messages.length > 0 && (
            <div className="mt-6 space-y-3">
              <h3 className="text-sm font-bold text-slate-500 uppercase flex items-center gap-2">
                <History className="w-4 h-4" /> Lịch sử tin nhắn
              </h3>
              <div className="max-h-48 overflow-y-auto space-y-2 pr-2">
                {messages.map(m => (
                  <div key={m.id} className={`p-3 rounded-xl border ${m.isEmergency ? 'bg-red-50 border-red-100' : 'bg-slate-50 border-slate-100'}`}>
                    <p className="text-[10px] text-slate-400 mb-1">{m.ngay}</p>
                    <p className="text-sm text-slate-700">{m.noiDung}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Feedback History */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-200">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Phản hồi từ thầy/cô</h2>
          <div className="space-y-4">
            {feedbacks.map((f, i) => (
              <div key={i} className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">{f.ngay}</span>
                  {f.loaiSticker && <span className="text-xl">{f.stickerIcon}</span>}
                </div>
                <p className="text-slate-700">{f.noiDungPhanHoi || 'Thầy/cô đã xem nhật ký của em.'}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
