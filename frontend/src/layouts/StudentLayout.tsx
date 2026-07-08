import { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function StudentLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 font-sans overflow-hidden">
      {/* Sidebar - Academic Navy design */}
      <aside className={`fixed lg:relative top-0 left-0 h-full w-68 bg-[#002147] text-slate-100 flex flex-col shadow-2xl z-50 transform lg:transform-none lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out`}>
        {/* Close Button on mobile */}
        <button 
          onClick={() => setIsSidebarOpen(false)}
          className="lg:hidden absolute top-4 right-4 text-white/70 hover:text-white"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>

        <div className="p-6 border-b border-white/10 flex items-center gap-3">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg shrink-0">
            <img 
              className="w-10 h-10 object-contain" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAPRrQgZ6jXhW7rPgBxPXg0Kim0j0ZjR0Ox58lq4omQPhPTJBFxYLJK7a97_htI-Im-t94KZlzjpLcGZ0gjiNAsjctqgUUTVKweEyXG67SbVfJKzAM6D2OSS5LI4Ceix1CdFSOkTzYLVySKh265lBh-STUfSO7UqIwUMqdVRMeLc4jcZe2AQtXYqgPjzDCioSy208e3io-nhSDLkvUxIAy2Ar1wjpMYI_hwR68_WoWlqZoNOlDFZQLOfKa1if9vI0Bviw" 
              alt="Harran Üniversitesi Logo"
            />
          </div>
          <div>
            <h1 className="text-xs font-extrabold uppercase tracking-wider text-white">Harran Üniversitesi</h1>
            <p className="text-[10px] text-amber-400 font-mono tracking-widest uppercase">Öğrenci Paneli</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          <Link
            to="/ogrenci"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all relative ${
              isActive('/ogrenci')
                ? 'bg-slate-800/80 text-white border-l-4 border-amber-400'
                : 'text-slate-300 hover:bg-slate-800/40 hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">dashboard</span>
            <span>Sınavlarım</span>
            {isActive('/ogrenci') && (
              <span className="absolute right-3 w-1.5 h-1.5 bg-amber-400 rounded-full" />
            )}
          </Link>
          <Link
            to="/ogrenci/results"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all relative ${
              isActive('/ogrenci/results')
                ? 'bg-slate-800/80 text-white border-l-4 border-amber-400'
                : 'text-slate-300 hover:bg-slate-800/40 hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">grading</span>
            <span>Sonuçlarım</span>
            {isActive('/ogrenci/results') && (
              <span className="absolute right-3 w-1.5 h-1.5 bg-amber-400 rounded-full" />
            )}
          </Link>
          <Link
            to="/ogrenci/profile"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all relative ${
              isActive('/ogrenci/profile')
                ? 'bg-slate-800/80 text-white border-l-4 border-amber-400'
                : 'text-slate-300 hover:bg-slate-800/40 hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">person</span>
            <span>Profilim</span>
            {isActive('/ogrenci/profile') && (
              <span className="absolute right-3 w-1.5 h-1.5 bg-amber-400 rounded-full" />
            )}
          </Link>
        </nav>

        {/* Footer / User Profile section */}
        <div className="p-4 border-t border-white/10 bg-black/20">
          <div className="flex items-center gap-3 mb-4 bg-white/5 p-2.5 rounded-xl border border-white/5">
            <div className="w-10 h-10 rounded-full border-2 border-amber-400 overflow-hidden shrink-0 shadow-inner">
              {user?.photo ? (
                <img src={user.photo} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-slate-700 flex items-center justify-center text-slate-300">
                  <span className="material-symbols-outlined text-[20px]">person</span>
                </div>
              )}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-white truncate">{user?.forename} {user?.surname}</p>
              <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-rose-950/20 hover:bg-rose-900/40 text-rose-400 rounded-xl transition-all text-xs font-bold border border-rose-900/30"
          >
            <span className="material-symbols-outlined text-[16px]">logout</span>
            <span>Güvenli Çıkış</span>
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

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-50">
        <header className="h-16 bg-white border-b border-slate-200/80 flex items-center px-4 sm:px-8 justify-between shrink-0 shadow-sm relative z-10 gap-2">
          <div className="flex items-center gap-2 overflow-hidden">
            <button 
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 shrink-0 flex items-center justify-center"
            >
              <span className="material-symbols-outlined text-[20px]">menu</span>
            </button>
            <h2 className="text-sm sm:text-base font-bold text-slate-800 truncate">
              {location.pathname === '/ogrenci/profile' ? 'Hesap ve Profil Ayarları' : 'Aktif Sınav Merkezi'}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            {/* Quick Status indicators */}
            <div className="flex items-center gap-2 px-3 py-1 bg-green-50 border border-green-200 rounded-full">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              <span className="text-[10px] text-green-700 font-bold uppercase tracking-wider">NVİ BAĞLANTISI AKTİF</span>
            </div>
          </div>
        </header>
        
        <div className="flex-1 overflow-auto p-8 animate-fade-in-up">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
