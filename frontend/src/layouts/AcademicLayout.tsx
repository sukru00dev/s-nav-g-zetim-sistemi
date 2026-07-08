import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AcademicLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();

  // Mobil Sidebar Durumu
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Erişilebilirlik Durumları
  const [fontSizeClass, setFontSizeClass] = useState<'text-normal' | 'text-large' | 'text-xlarge'>('text-normal');
  const [highContrast, setHighContrast] = useState<boolean>(false);

  // Sayfa yüklendiğinde ayarları localStorage'dan oku
  useEffect(() => {
    const savedSize = localStorage.getItem('pref-font-size') as any;
    const savedContrast = localStorage.getItem('pref-contrast') === 'true';
    if (savedSize) setFontSizeClass(savedSize);
    if (savedContrast) setHighContrast(savedContrast);
  }, []);

  const changeFontSize = (size: 'text-normal' | 'text-large' | 'text-xlarge') => {
    setFontSizeClass(size);
    localStorage.setItem('pref-font-size', size);
  };

  const toggleContrast = () => {
    const next = !highContrast;
    setHighContrast(next);
    localStorage.setItem('pref-contrast', String(next));
  };

  const isActive = (path: string) => {
    if (path === '/akademisyen') return location.pathname === '/akademisyen';
    return location.pathname.startsWith(path);
  };

  const navItems = [
    { name: 'Çalışma Masası', path: '/akademisyen', icon: 'space_dashboard' },
    { name: 'Sınavlarım & PDF', path: '/akademisyen/exams', icon: 'drive_file_rename_outline' },
    { name: 'Gözetim Sınıfım', path: '/akademisyen/monitor', icon: 'meeting_room' },
    { name: 'Öğrenci Sonuçları', path: '/akademisyen/results', icon: 'grading' },
    { name: 'Sınıf & Şube Yönetimi', path: '/akademisyen/classes', icon: 'groups' },
    { name: 'Soru Havuzu', path: '/akademisyen/questions', icon: 'database' }
  ];

  // Yazı boyutları için CSS sınıfı
  const getFontSizeStyle = () => {
    if (fontSizeClass === 'text-large') return 'scale-102 origin-top-left transition-transform duration-200';
    if (fontSizeClass === 'text-xlarge') return 'scale-105 origin-top-left transition-transform duration-200';
    return '';
  };

  return (
    <div className={`flex min-h-screen ${highContrast ? 'bg-black text-white contrast-125' : 'bg-slate-50 text-slate-800'} font-sans`}>
      {/* Sidebar - Academic Navy Theme */}
      <aside className={`fixed left-0 top-0 h-full w-[260px] ${highContrast ? 'bg-zinc-950 border-r border-white/20' : 'bg-[#002147]'} text-white flex flex-col z-50 shadow-2xl transform lg:transform-none lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out`}>
        {/* Close Button on mobile */}
        <button 
          onClick={() => setIsSidebarOpen(false)}
          className="lg:hidden absolute top-4 right-4 text-white/70 hover:text-white"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>

        <div className="p-6 border-b border-white/10 flex flex-col items-center justify-center">
          <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-lg mb-3">
            <img 
              className="w-12 h-12 object-contain" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAPRrQgZ6jXhW7rPgBxPXg0Kim0j0ZjR0Ox58lq4omQPhPTJBFxYLJK7a97_htI-Im-t94KZlzjpLcGZ0gjiNAsjctqgUUTVKweEyXG67SbVfJKzAM6D2OSS5LI4Ceix1CdFSOkTzYLVySKh265lBh-STUfSO7UqIwUMqdVRMeLc4jcZe2AQtXYqgPjzDCioSy208e3io-nhSDLkvUxIAy2Ar1wjpMYI_hwR68_WoWlqZoNOlDFZQLOfKa1if9vI0Bviw" 
              alt="Harran Üniversitesi Logo"
            />
          </div>
          <h2 className="text-xs font-extrabold text-white uppercase tracking-wider">Harran Üniversitesi</h2>
          <p className="text-[10px] text-amber-400 font-mono tracking-widest uppercase mt-1">Eğitmen Paneli</p>
        </div>

        <nav className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive(item.path)
                  ? 'bg-slate-800/80 text-white border-l-4 border-amber-400 shadow-lg'
                  : 'text-slate-300 hover:bg-slate-800/40 hover:text-white'
              }`}
            >
              <span className={`material-symbols-outlined ${isActive(item.path) ? 'font-medium' : 'font-light'}`}>
                {item.icon}
              </span>
              <span className="text-sm font-semibold">{item.name}</span>
            </Link>
          ))}
        </nav>

        {/* Erişilebilirlik ve Alt Kontroller */}
        <div className="p-4 border-t border-white/10 bg-black/20 space-y-4">
          <div className="flex flex-col gap-2">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Erişilebilirlik</span>
            <div className="flex items-center justify-between gap-1.5 bg-black/25 p-1 rounded-lg">
              <button 
                onClick={() => changeFontSize('text-normal')}
                className={`flex-1 text-[10px] font-bold py-1.5 rounded transition-colors ${fontSizeClass === 'text-normal' ? 'bg-amber-400 text-[#002147]' : 'text-slate-300 hover:bg-white/5'}`}
                title="Normal Metin Boyutu"
              >
                A
              </button>
              <button 
                onClick={() => changeFontSize('text-large')}
                className={`flex-1 text-xs font-bold py-1.5 rounded transition-colors ${fontSizeClass === 'text-large' ? 'bg-amber-400 text-[#002147]' : 'text-slate-300 hover:bg-white/5'}`}
                title="Büyük Metin Boyutu"
              >
                A+
              </button>
              <button 
                onClick={() => changeFontSize('text-xlarge')}
                className={`flex-1 text-sm font-bold py-1.5 rounded transition-colors ${fontSizeClass === 'text-xlarge' ? 'bg-amber-400 text-[#002147]' : 'text-slate-300 hover:bg-white/5'}`}
                title="Çok Büyük Metin Boyutu"
              >
                A++
              </button>
            </div>
            <button
              onClick={toggleContrast}
              className={`w-full py-2 px-3 rounded-xl border text-[10px] font-bold transition-all flex items-center justify-center gap-1.5 ${
                highContrast 
                  ? 'bg-amber-400 text-[#002147] border-amber-400' 
                  : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">contrast</span>
              Kontrast: {highContrast ? 'Yüksek' : 'Normal'}
            </button>
          </div>

          <button 
            onClick={logout}
            className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-white/5 text-stone-300 rounded-lg hover:bg-rose-600/20 hover:text-rose-200 transition-all text-sm font-medium border border-white/10"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            Çıkış Yap
          </button>
        </div>
      </aside>

      {/* Backdrop overlay for mobile */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-black/40 z-45 lg:hidden backdrop-blur-xs"
        />
      )}

      {/* Main Content Area */}
      <div className={`flex-1 ml-0 lg:ml-[260px] flex flex-col min-h-screen ${getFontSizeStyle()}`}>
        {/* Top Header */}
        <header className={`h-[70px] ${highContrast ? 'bg-zinc-900 border-b border-white/20' : 'bg-white/80 backdrop-blur-md border-b border-slate-200'} sticky top-0 z-40 px-4 sm:px-8 flex items-center justify-between gap-2`}>
          <div className="flex items-center gap-2 overflow-hidden">
            <button 
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 shrink-0 flex items-center justify-center"
            >
              <span className="material-symbols-outlined text-[20px]">menu</span>
            </button>
            <div className="truncate">
              <h1 className="text-sm sm:text-xl font-bold text-slate-800 truncate">Hoş Geldiniz, {user?.forename || 'Hocam'}</h1>
              <p className="text-[10px] sm:text-sm text-slate-500 truncate">Bugün sizi verimli bir gün bekliyor.</p>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <Link to="/akademisyen/exams" className="hidden md:flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-full text-sm font-bold transition-colors">
              <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
              PDF'den Sınav Üret
            </Link>

            <Link to="/akademisyen/profile" className="flex items-center gap-3 border-l pl-6 border-slate-200 cursor-pointer group">
              <div className="text-right">
                <p className="text-sm font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{user?.forename} {user?.surname}</p>
                <p className="text-xs text-slate-500">Akademisyen</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shadow-sm overflow-hidden border border-indigo-200">
                {user?.photo ? (
                  <img src={user.photo} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="material-symbols-outlined font-medium">person</span>
                )}
              </div>
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-8 bg-slate-50/50">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
