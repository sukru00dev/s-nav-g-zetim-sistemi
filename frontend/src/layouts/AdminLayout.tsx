import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AdminLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/admin') return location.pathname === '/admin';
    return location.pathname.startsWith(path);
  };

  const navItems = [
    { name: 'Sistem Durumu', path: '/admin', icon: 'monitor_heart' },
    { name: 'Kullanıcı Yönetimi', path: '/admin/roles', icon: 'manage_accounts' },
    { name: 'Sistem Logları', path: '/admin/logs', icon: 'receipt_long' },
    { name: 'Veritabanı', path: '/admin/database', icon: 'database' }
  ];

  return (
    <div className="flex min-h-screen bg-slate-900 text-slate-300 font-sans">
      {/* Sidebar - Academic Navy Theme */}
      <aside className={`fixed left-0 top-0 h-full w-[280px] bg-[#002147] border-r border-white/10 flex flex-col z-50 shadow-2xl transform lg:transform-none lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out`}>
        {/* Close Button on mobile */}
        <button 
          onClick={() => setIsSidebarOpen(false)}
          className="lg:hidden absolute top-4 right-4 text-white/70 hover:text-white"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>

        <div className="p-6 border-b border-white/10 text-center flex flex-col items-center">
          <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-lg mb-3">
            <img 
              className="w-12 h-12 object-contain" 
              src="/favicon.png" 
              alt="Harran Üniversitesi Logo"
            />
          </div>
          <h2 className="text-sm font-extrabold text-white uppercase tracking-wider">Harran Üniversitesi</h2>
          <p className="text-[10px] text-amber-400 font-mono tracking-widest uppercase mt-1">Sistem Yöneticisi</p>
        </div>

        <nav className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 px-2">Sistem Araçları</div>
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                isActive(item.path)
                  ? 'bg-slate-800/80 text-white border-l-4 border-amber-400 shadow-lg'
                  : 'text-slate-300 hover:bg-slate-800/40 hover:text-white'
              }`}
            >
              <span className={`material-symbols-outlined text-[20px] transition-transform duration-300 ${isActive(item.path) ? 'scale-110' : 'group-hover:scale-110'}`}>
                {item.icon}
              </span>
              <span className="text-sm font-semibold tracking-wide">{item.name}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10 bg-black/20">
          <button 
            onClick={logout}
            className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-rose-950/30 text-rose-400 rounded-lg hover:bg-rose-900/50 hover:text-rose-300 transition-all text-sm font-bold border border-rose-900/50"
          >
            <span className="material-symbols-outlined text-[18px]">power_settings_new</span>
            Sistemi Kapat
          </button>
        </div>
      </aside>

      {/* Backdrop overlay for mobile */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-black/45 z-40 lg:hidden backdrop-blur-xs"
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 ml-0 lg:ml-[280px] flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="h-[70px] bg-slate-950/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40 px-4 sm:px-8 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 overflow-hidden">
            <button 
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-1.5 rounded-xl border border-slate-800 text-slate-400 hover:text-slate-200 shrink-0 flex items-center justify-center bg-slate-900"
            >
              <span className="material-symbols-outlined text-[20px]">menu</span>
            </button>
            <h1 className="text-sm sm:text-lg font-bold text-slate-100 truncate">IT & Güvenlik Merkezi</h1>
          </div>
          
          <div className="flex items-center gap-6">
            {/* Status Pulse */}
            <div className="flex items-center gap-2 px-3 py-1 bg-green-950/30 border border-green-800/30 rounded-full">
               <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
               <span className="text-xs text-green-400 font-mono">SİSTEM AKTİF</span>
            </div>

            <Link to="/admin/profile" className="flex items-center gap-3 border-l pl-6 border-slate-800 cursor-pointer hover:opacity-80 transition-opacity">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-200">{user?.forename} {user?.surname}</p>
                <p className="text-[10px] text-blue-400 font-mono uppercase tracking-widest">
                  ROOT ADMIN
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-slate-800 text-blue-400 border border-blue-500/30 flex items-center justify-center shadow-sm overflow-hidden">
                {user?.photo ? (
                  <img src={user.photo} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="material-symbols-outlined">shield_person</span>
                )}
              </div>
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
