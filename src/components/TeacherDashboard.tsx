import React, { useState, useEffect, useRef } from 'react';
import { Student, LogPersonal, LogGeneral, LogGroup, TeacherFeedback, TinNhan } from '../types';
import { Users, FileText, AlertCircle, TrendingUp, Award, Send, Download, Loader2, LayoutDashboard, Database, Trash2, MessageSquare, History } from 'lucide-react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend } from 'chart.js';
import Swal from 'sweetalert2';
import { format, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import AdminDataManagement from './AdminDataManagement';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

interface Props {
  profile: Student;
}

export default function TeacherDashboard({ profile }: Props) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'admin' | 'stats' | 'messages'>('dashboard');
  const [students, setStudents] = useState<Student[]>([]);
  const [personalLogs, setPersonalLogs] = useState<LogPersonal[]>([]);
  const [generalLogs, setGeneralLogs] = useState<LogGeneral[]>([]);
  const [messages, setMessages] = useState<TinNhan[]>([]);
  const [weeklyStats, setWeeklyStats] = useState<any[]>([]);
  const [monthlyStats, setMonthlyStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [selectedSticker, setSelectedSticker] = useState({ name: '', icon: '' });
  const reportRef = useRef<HTMLDivElement>(null);

  const stickers = [
    { name: 'Chăm chỉ', icon: '⭐' },
    { name: 'Tốt bụng', icon: '🌸' },
    { name: 'Tiến bộ', icon: '🚀' },
    { name: 'Sáng tạo', icon: '🎨' },
    { name: 'Hòa đồng', icon: '🤝' },
  ];

  const fetchData = async () => {
    try {
      const [studentsRes, personalRes, generalRes, weeklyRes, monthlyRes, msgRes] = await Promise.all([
        fetch('/api/students'),
        fetch('/api/logs/personal'),
        fetch('/api/logs/general'),
        fetch('/api/stats/weekly'),
        fetch('/api/stats/monthly'),
        fetch('/api/messages')
      ]);
      setStudents(await studentsRes.json());
      setPersonalLogs(await personalRes.json());
      setGeneralLogs(await generalRes.json());
      setWeeklyStats(await weeklyRes.json());
      setMonthlyStats(await monthlyRes.json());
      setMessages(await msgRes.json());
      setLoading(false);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleSendFeedback = async () => {
    if (!selectedStudent || (!feedbackText && !selectedSticker.name)) return;
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ngay: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
          username: selectedStudent.username,
          noiDungPhanHoi: feedbackText,
          loaiSticker: selectedSticker.name,
          stickerIcon: selectedSticker.icon,
        }),
      });
      const data = await response.json();
      if (data.success) {
        Swal.fire('Thành công', `Đã gửi phản hồi cho ${selectedStudent.hoTen}`, 'success');
        setFeedbackText('');
        setSelectedSticker({ name: '', icon: '' });
        setSelectedStudent(null);
        fetchData();
      }
    } catch (error) {
      console.error(error);
      Swal.fire('Lỗi', 'Không thể gửi phản hồi.', 'error');
    }
  };

  const handleDeleteLog = async (type: 'personal' | 'general' | 'feedback' | 'message', id: number) => {
    const result = await Swal.fire({
      title: 'Xác nhận xóa?',
      text: "Hành động này không thể hoàn tác!",
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
          fetchData();
        }
      } catch (e) {
        Swal.fire('Lỗi', 'Không thể xóa.', 'error');
      }
    }
  };

  const exportPDF = async () => {
    if (!reportRef.current) return;
    setLoading(true);
    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        logging: false
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Bao_cao_Smart_Classroom_${format(new Date(), 'yyyyMMdd')}.pdf`);
    } catch (e) {
      console.error(e);
      Swal.fire('Lỗi', 'Không thể xuất PDF.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const chartData = {
    labels: personalLogs.slice(0, 7).reverse().map(l => format(new Date(l.ngay), 'dd/MM')),
    datasets: [
      {
        label: 'Mức độ hạnh phúc trung bình',
        data: personalLogs.slice(0, 7).reverse().map(l => l.mucDoHanhPhuc),
        borderColor: 'rgb(99, 102, 241)',
        backgroundColor: 'rgba(99, 102, 241, 0.5)',
        tension: 0.4,
      },
    ],
  };

  const riskyStudents = personalLogs.filter(l => l.mucDoHanhPhuc < 5 || l.canGapCo_KhanCap);

  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

  const currentWeekLogs = personalLogs.filter(l => 
    isWithinInterval(new Date(l.ngay), { start: weekStart, end: weekEnd })
  );

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-8">
      {/* Tab Navigation */}
      <div className="flex flex-wrap bg-white p-1 rounded-2xl shadow-sm border border-slate-200 w-fit gap-1">
        {[
          { id: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard },
          { id: 'messages', label: 'Tin nhắn', icon: MessageSquare },
          { id: 'stats', label: 'Thống kê', icon: TrendingUp },
          { id: 'admin', label: 'Quản trị', icon: Database },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              activeTab === tab.id 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' 
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'dashboard' ? (
        <div className="space-y-8 animate-in fade-in duration-500">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-slate-500">Tổng học sinh</p>
                  <h3 className="text-2xl font-bold text-slate-900">{students.filter(s => s.role !== 'teacher').length}</h3>
                </div>
                <Users className="text-indigo-600" />
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-slate-500">Cần hỗ trợ</p>
                  <h3 className="text-2xl font-bold text-red-600">{riskyStudents.length}</h3>
                </div>
                <AlertCircle className="text-red-600" />
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-slate-500">Nhật ký hôm nay</p>
                  <h3 className="text-2xl font-bold text-emerald-600">
                    {personalLogs.filter(l => l.ngay.includes(format(new Date(), 'yyyy-MM-dd'))).length}
                  </h3>
                </div>
                <FileText className="text-emerald-600" />
              </div>
            </div>
            <button 
              onClick={exportPDF}
              className="bg-indigo-600 p-6 rounded-2xl shadow-sm text-white flex flex-col items-center justify-center gap-2 hover:bg-indigo-700 transition-all"
            >
              <Download />
              <span className="font-bold">Xuất báo cáo PDF</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {/* Chart */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                  <TrendingUp className="text-indigo-600" /> Xu hướng hạnh phúc lớp
                </h3>
                <div className="h-64">
                  <Line data={chartData} options={{ maintainAspectRatio: false }} />
                </div>
              </div>

              {/* Weekly Logs Table */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                  <h3 className="text-lg font-bold text-slate-900">Nhật ký tuần này ({format(weekStart, 'dd/MM')} - {format(weekEnd, 'dd/MM')})</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="p-4 text-xs font-bold text-slate-500 uppercase">Học sinh</th>
                        <th className="p-4 text-xs font-bold text-slate-500 uppercase">Hạnh phúc</th>
                        <th className="p-4 text-xs font-bold text-slate-500 uppercase">Hành động</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {currentWeekLogs.map((log) => (
                        <tr key={log.id} className={log.canGapCo_KhanCap ? 'bg-red-50' : ''}>
                          <td className="p-4">
                            <p className="font-bold text-slate-900">{log.tenHocSinh}</p>
                            <p className="text-xs text-slate-400">{log.ngay}</p>
                          </td>
                          <td className="p-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${log.mucDoHanhPhuc < 5 ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                              {log.mucDoHanhPhuc}/10
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <button 
                                onClick={() => {
                                  const student = students.find(s => s.username === log.username);
                                  if (student) setSelectedStudent(student);
                                }}
                                className="text-indigo-600 hover:text-indigo-800 font-bold text-sm"
                              >
                                Phản hồi
                              </button>
                              <button 
                                onClick={() => handleDeleteLog('personal', log.id!)}
                                className="text-red-400 hover:text-red-600"
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
            </div>

            <div className="space-y-8">
              {/* Feedback Panel */}
              {selectedStudent && (
                <div className="bg-white p-6 rounded-2xl shadow-xl border-2 border-indigo-500 animate-in fade-in slide-in-from-right-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-slate-900">Phản hồi cho {selectedStudent.hoTen}</h3>
                    <button onClick={() => setSelectedStudent(null)} className="text-slate-400 hover:text-slate-600">×</button>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Tặng Sticker</label>
                      <div className="flex flex-wrap gap-2">
                        {stickers.map(s => (
                          <button
                            key={s.name}
                            onClick={() => setSelectedSticker(s)}
                            className={`p-2 rounded-xl border transition-all ${selectedSticker.name === s.name ? 'bg-indigo-50 border-indigo-500' : 'bg-slate-50 border-slate-100'}`}
                          >
                            <span className="text-xl">{s.icon}</span>
                            <p className="text-[10px] font-bold mt-1 uppercase">{s.name}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Lời nhắn</label>
                      <textarea
                        value={feedbackText}
                        onChange={(e) => setFeedbackText(e.target.value)}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                        rows={3}
                        placeholder="Nhập lời nhắn riêng..."
                      />
                    </div>
                    <button
                      onClick={handleSendFeedback}
                      className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                    >
                      <Send className="w-4 h-4" /> Gửi phản hồi
                    </button>
                  </div>
                </div>
              )}

              {/* Leader Logs */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Award className="text-indigo-600" /> Báo cáo Ban cán sự
                </h3>
                <div className="space-y-4">
                  {generalLogs.map((log, i) => (
                    <div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-100 relative group">
                      <button 
                        onClick={() => handleDeleteLog('general', log.id!)}
                        className="absolute top-2 right-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <p className="text-xs font-bold text-indigo-600 mb-1">{log.ngay}</p>
                      <p className="text-sm font-bold text-slate-900">Việc tốt: <span className="font-normal text-slate-600">{log.ghiChep_ViecTot}</span></p>
                      <p className="text-sm font-bold text-red-600">Vi phạm: <span className="font-normal text-slate-600">{log.ghiChep_ViPham}</span></p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Hidden Report for PDF Export */}
          <div className="hidden">
            <div ref={reportRef} className="p-10 bg-white text-slate-900 space-y-8 w-[210mm]">
              <div className="text-center border-b-2 border-indigo-600 pb-6">
                <h1 className="text-3xl font-black text-indigo-600 uppercase">Báo cáo Smart Classroom</h1>
                <p className="text-slate-500 mt-2">Ngày xuất: {format(new Date(), 'dd/MM/yyyy HH:mm')}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-8">
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200">
                  <h3 className="font-bold text-slate-500 uppercase text-xs mb-4">Thống kê lớp</h3>
                  <div className="space-y-2">
                    <p className="flex justify-between font-bold">Tổng học sinh: <span>{students.length}</span></p>
                    <p className="flex justify-between font-bold text-red-600">Cần hỗ trợ: <span>{riskyStudents.length}</span></p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-bold text-lg border-l-4 border-indigo-600 pl-3">Học sinh cần hỗ trợ khẩn cấp</h3>
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="border p-2 text-left">Học sinh</th>
                      <th className="border p-2 text-left">Nội dung khẩn cấp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {riskyStudents.map((s, i) => (
                      <tr key={i}>
                        <td className="border p-2 font-bold">{s.tenHocSinh}</td>
                        <td className="border p-2">{s.machRieng || 'Mức độ hạnh phúc thấp'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      ) : activeTab === 'messages' ? (
        <div className="space-y-6 animate-in fade-in duration-500">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <MessageSquare className="text-indigo-600" /> Tất cả tin nhắn mách thầy
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {messages.map(m => (
              <div key={m.id} className={`p-6 rounded-2xl border-2 transition-all relative group ${m.isEmergency ? 'bg-red-50 border-red-200' : 'bg-white border-slate-100 shadow-sm'}`}>
                <button 
                  onClick={() => handleDeleteLog('message', m.id!)}
                  className="absolute top-4 right-4 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${m.isEmergency ? 'bg-red-600 text-white' : 'bg-indigo-100 text-indigo-600'}`}>
                    {m.tenHocSinh.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{m.tenHocSinh}</p>
                    <p className="text-[10px] text-slate-400">{m.ngay}</p>
                  </div>
                </div>
                <p className="text-slate-700 text-sm leading-relaxed">{m.noiDung}</p>
                {m.isEmergency && (
                  <div className="mt-4 flex items-center gap-2 text-red-600 text-xs font-bold uppercase">
                    <AlertCircle className="w-4 h-4" /> Khẩn cấp
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : activeTab === 'stats' ? (
        <div className="space-y-8 animate-in fade-in duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Weekly Stats */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                <TrendingUp className="text-indigo-600" /> Thống kê theo tuần (Từ tuần 25)
              </h3>
              <div className="h-80">
                <Line 
                  data={{
                    labels: weeklyStats.map(s => `Tuần ${s.week}`),
                    datasets: [
                      {
                        label: 'Học tập',
                        data: weeklyStats.map(s => s.avg_HT),
                        borderColor: 'rgb(99, 102, 241)',
                        tension: 0.4,
                      },
                      {
                        label: 'Hạnh phúc',
                        data: weeklyStats.map(s => s.avg_HanhPhuc),
                        borderColor: 'rgb(244, 63, 94)',
                        tension: 0.4,
                      }
                    ]
                  }} 
                  options={{ maintainAspectRatio: false }} 
                />
              </div>
            </div>

            {/* Monthly Stats */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                <TrendingUp className="text-emerald-600" /> Thống kê theo tháng
              </h3>
              <div className="h-80">
                <Line 
                  data={{
                    labels: monthlyStats.map(s => s.month),
                    datasets: [
                      {
                        label: 'Học tập',
                        data: monthlyStats.map(s => s.avg_HT),
                        borderColor: 'rgb(16, 185, 129)',
                        tension: 0.4,
                      },
                      {
                        label: 'Hòa đồng',
                        data: monthlyStats.map(s => s.avg_HoaDong),
                        borderColor: 'rgb(245, 158, 11)',
                        tension: 0.4,
                      }
                    ]
                  }} 
                  options={{ maintainAspectRatio: false }} 
                />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="animate-in fade-in duration-500">
          <AdminDataManagement />
        </div>
      )}
    </div>
  );
}
