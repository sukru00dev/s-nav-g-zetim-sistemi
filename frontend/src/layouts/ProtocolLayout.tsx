import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtocolLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/protokol') return location.pathname === '/protokol';
    return location.pathname.startsWith(path);
  };

  const navItems = [
    { name: 'Rektörlük Özeti', path: '/protokol', icon: 'account_balance' },
    { name: 'Üniversite İstatistikleri', path: '/protokol/analytics', icon: 'pie_chart' },
    { name: 'Canlı Sınav Merkezi', path: '/protokol/live', icon: 'visibility' },
    { name: 'Güvenlik & Kopya Riskleri', path: '/protokol/security', icon: 'gavel' }
  ];

  return (
    <div className="flex min-h-screen bg-stone-50 text-stone-800 font-sans">
      {/* Sidebar - Academic Navy Theme */}
      <aside className={`fixed left-0 top-0 h-full w-[280px] bg-[#002147] text-white flex flex-col z-50 shadow-2xl overflow-hidden transform lg:transform-none lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out`}>
        {/* Close Button on mobile */}
        <button 
          onClick={() => setIsSidebarOpen(false)}
          className="lg:hidden absolute top-4 right-4 text-white/70 hover:text-white"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>

        <div className="p-8 border-b border-white/10 text-center relative z-10">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg mx-auto mb-4">
            <img 
              className="w-12 h-12 object-contain filter drop-shadow-md" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAPRrQgZ6jXhW7rPgBxPXg0Kim0j0ZjR0Ox58lq4omQPhPTJBFxYLJK7a97_htI-Im-t94KZlzjpLcGZ0gjiNAsjctqgUUTVKweEyXG67SbVfJKzAM6D2OSS5LI4Ceix1CdFSOkTzYLVySKh265lBh-STUfSO7UqIwUMqdVRMeLc4jcZe2AQtXYqgPjzDCioSy208e3io-nhSDLkvUxIAy2Ar1wjpMYI_hwR68_WoWlqZoNOlDFZQLOfKa1if9vI0Bviw" 
              alt="Harran Üniversitesi Logo" 
            />
          </div>
          <h2 className="text-sm font-extrabold text-white uppercase tracking-widest">Harran Üniversitesi</h2>
          <p className="text-[10px] text-amber-400 font-mono tracking-widest uppercase mt-1">Protokol Yönetimi</p>
        </div>

        <nav className="flex-1 py-8 px-4 space-y-3 relative z-10">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-4 px-5 py-3.5 rounded-xl transition-all duration-300 ${
                isActive(item.path)
                  ? 'bg-slate-800/80 text-white border-l-4 border-amber-400 shadow-lg'
                  : 'text-stone-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-[22px] font-light">
                {item.icon}
              </span>
              <span className="text-[15px] font-medium tracking-wide">{item.name}</span>
            </Link>
          ))}
        </nav>

        <div className="p-6 relative z-10 border-t border-white/10 bg-black/20">
          <button 
            onClick={logout}
            className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-white/5 text-stone-300 rounded-lg hover:bg-white/10 hover:text-white transition-all text-sm"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            Güvenli Çıkış
          </button>
        </div>
      </aside>

      {/* Backdrop overlay for mobile */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-xs"
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 ml-0 lg:ml-[280px] flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="h-[80px] bg-white border-b border-stone-200 sticky top-0 z-40 px-4 sm:px-10 flex items-center justify-between shadow-sm font-sans gap-2">
          <div className="flex items-center gap-2 overflow-hidden">
            <button 
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-1.5 rounded-xl border border-stone-200 text-[#1a2c42] hover:bg-stone-50 shrink-0 flex items-center justify-center"
            >
              <span className="material-symbols-outlined text-[20px]">menu</span>
            </button>
            <div className="truncate">
              <h1 className="text-sm sm:text-2xl font-bold text-[#1a2c42] truncate">Üst Yönetim Ekranı</h1>
              <p className="text-[10px] sm:text-xs text-stone-500 truncate">2025-2026 Eğitim Öğretim Yılı Analizleri</p>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <Link to="/protokol/profile" className="flex items-center gap-4 border-l pl-6 border-stone-200 cursor-pointer hover:opacity-80 transition-opacity">
              <div className="text-right">
                <p className="text-sm font-bold text-[#1a2c42] uppercase">{user?.forename} {user?.surname}</p>
                <p className="text-xs text-amber-600 font-bold tracking-widest">
                  DEKANLIK / REKTÖRLÜK
                </p>
              </div>
              <div className="w-12 h-12 rounded-full border-2 border-amber-500/50 flex items-center justify-center shadow-md overflow-hidden bg-stone-100">
                {user?.photo ? (
                  <img src={user.photo} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="material-symbols-outlined text-amber-600">account_balance</span>
                )}
              </div>
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-10 bg-stone-50 font-sans">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
