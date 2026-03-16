import React, { useState, useEffect } from 'react';
import { Student } from './types';
import Dashboard from './components/Dashboard';
import { LogIn, LogOut, Loader2, User, Lock, Eye, EyeOff, Menu, X, ChevronRight } from 'lucide-react';
import Swal from 'sweetalert2';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [user, setUser] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 5;

    const checkServer = async () => {
      try {
        const res = await fetch('/api/health');
        if (res.ok) {
          setServerStatus('online');
        } else {
          throw new Error('Server not ready');
        }
      } catch (e) {
        if (retryCount < maxRetries) {
          retryCount++;
          setTimeout(checkServer, 2000);
        } else {
          setServerStatus('offline');
        }
      }
    };
    checkServer();
    
    const savedUser = localStorage.getItem('classroom_user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      if (parsedUser.must_change_password === 1) {
        setShowChangePassword(true);
      }
    }
    setLoading(false);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      console.log('Attempting login to /api/login');
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      console.log('Login response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Đăng nhập thất bại';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          errorMessage = `Lỗi hệ thống (${response.status})`;
        }
        Swal.fire('Thất bại', errorMessage, 'error');
        return;
      }

      const data = await response.json();
      if (data.success) {
        setUser(data.user);
        localStorage.setItem('classroom_user', JSON.stringify(data.user));
        if (data.user.must_change_password === 1) {
          setShowChangePassword(true);
        }
        Swal.fire({
          title: 'Đăng nhập thành công!',
          text: `Chào mừng ${data.user.hoTen}`,
          icon: 'success',
          timer: 1500,
          showConfirmButton: false
        });
      } else {
        Swal.fire('Thất bại', data.message, 'error');
      }
    } catch (error) {
      console.error("Login failed", error);
      Swal.fire('Lỗi', 'Không thể kết nối đến máy chủ', 'error');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      Swal.fire('Lỗi', 'Mật khẩu xác nhận không khớp', 'error');
      return;
    }
    if (newPassword.length < 6) {
      Swal.fire('Lỗi', 'Mật khẩu phải có ít nhất 6 ký tự', 'error');
      return;
    }

    try {
      const response = await fetch('/api/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: user?.username, 
          oldPassword: password || JSON.parse(localStorage.getItem('classroom_user') || '{}').password, 
          newPassword 
        }),
      });
      const data = await response.json();
      if (data.success) {
        const updatedUser = { ...user!, must_change_password: 0 };
        setUser(updatedUser);
        localStorage.setItem('classroom_user', JSON.stringify(updatedUser));
        setShowChangePassword(false);
        Swal.fire('Thành công', 'Đã đổi mật khẩu mới', 'success');
      } else {
        Swal.fire('Thất bại', data.message, 'error');
      }
    } catch (error) {
      Swal.fire('Lỗi', 'Không thể đổi mật khẩu', 'error');
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('classroom_user');
    setSidebarOpen(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto">
              <LogIn className="w-10 h-10 text-indigo-600" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900">Smart Classroom</h1>
            <p className="text-slate-500">Vui lòng đăng nhập để tiếp tục</p>
            <div className="mt-4 flex items-center justify-center">
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                serverStatus === 'online' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 
                serverStatus === 'offline' ? 'bg-red-50 text-red-600 border border-red-100' : 
                'bg-slate-50 text-slate-600 border border-slate-100'
              }`}>
                <div className={`w-1.5 h-1.5 rounded-full ${
                  serverStatus === 'online' ? 'bg-emerald-500 animate-pulse' : 
                  serverStatus === 'offline' ? 'bg-red-500' : 
                  'bg-slate-400'
                }`} />
                {serverStatus === 'online' ? 'Máy chủ: Sẵn sàng' : 
                 serverStatus === 'offline' ? 'Máy chủ: Mất kết nối' : 
                 'Máy chủ: Đang kiểm tra...'}
              </div>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Tên đăng nhập</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  placeholder="Nhập tên đăng nhập"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Mật khẩu</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  placeholder="Nhập mật khẩu"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-200"
            >
              Đăng nhập
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex overflow-hidden">
      {/* Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ 
          width: sidebarOpen ? 280 : 0,
          x: sidebarOpen ? 0 : -280
        }}
        className="fixed lg:relative h-screen bg-white border-r border-slate-200 z-[70] overflow-hidden flex flex-col shadow-2xl lg:shadow-none"
      >
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
              <span className="text-white font-bold text-xl">SC</span>
            </div>
            <div className="overflow-hidden">
              <h2 className="font-bold text-slate-900 whitespace-nowrap">Smart Classroom</h2>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Quản lý lớp học</p>
            </div>
          </div>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">Người dùng</p>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold">
                  {user.hoTen.charAt(0)}
                </div>
                <div className="overflow-hidden">
                  <p className="text-sm font-bold text-slate-900 truncate">{user.hoTen}</p>
                  <p className="text-xs text-slate-500 capitalize">{user.role.replace('_', ' ')}</p>
                </div>
              </div>
              <div className="space-y-1 text-xs text-slate-500">
                <p>Tài khoản: <span className="font-mono font-bold text-slate-700">{user.username}</span></p>
                {user.to_group && <p>Tổ: <span className="font-bold text-slate-700">{user.to_group}</span></p>}
                {user.chucVu && <p>Chức vụ: <span className="font-bold text-slate-700">{user.chucVu}</span></p>}
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 mb-2">Hành động</p>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all group"
            >
              <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span className="font-semibold">Đăng xuất</span>
              <ChevronRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          </div>
        </div>

        <div className="p-4 border-t border-slate-100">
          <p className="text-[10px] text-center text-slate-400 font-medium">© 2026 Smart Classroom v2.0</p>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-50 shadow-sm">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all shadow-sm"
              title="Toggle Menu"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="flex items-center gap-2 cursor-pointer group"
            >
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-indigo-100">
                <span className="text-white font-bold">SC</span>
              </div>
              <span className="font-bold text-slate-900 hidden sm:inline group-hover:text-indigo-600 transition-colors">Smart Classroom</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-slate-900">{user.hoTen}</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">{user.chucVu}</p>
            </div>
            <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 font-bold border-2 border-white shadow-sm">
              {user.hoTen.charAt(0)}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/50">
          <div className="max-w-7xl mx-auto">
            <Dashboard profile={user} />
          </div>
        </main>
      </div>

      {showChangePassword && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 space-y-6 border border-slate-100"
          >
            <div className="text-center space-y-2">
              <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <Lock className="w-10 h-10 text-amber-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Bảo mật tài khoản</h2>
              <p className="text-slate-500 text-sm">Vui lòng đổi mật khẩu mặc định để tiếp tục sử dụng hệ thống.</p>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Mật khẩu mới</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-mono"
                    placeholder="Ít nhất 6 ký tự"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Xác nhận mật khẩu</label>
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-mono"
                  placeholder="Nhập lại mật khẩu mới"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl transition-all shadow-xl shadow-indigo-200 active:scale-[0.98]"
              >
                Cập nhật mật khẩu
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
