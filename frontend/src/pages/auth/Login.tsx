import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import fpPromise from '@fingerprintjs/fingerprintjs';

type Tab = 'ogrenci' | 'protokol' | 'akademisyen' | 'yonetici';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'ogrenci',     label: 'Öğrenci',     icon: 'school' },
  { id: 'akademisyen', label: 'Akademisyen',  icon: 'person_book' },
  { id: 'protokol',    label: 'Protokol',     icon: 'account_balance' },
  { id: 'yonetici',   label: 'Yönetici',     icon: 'terminal' },
];

const ROLE_ROUTES: Record<string, string> = {
  'Yönetici':    '/admin',
  'Protokol':    '/protokol',
  'Akademisyen': '/akademisyen',
  'Öğrenci':    '/ogrenci',
};

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<Tab>('ogrenci');
  const [tc, setTc] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Forgot Password state
  const [isForgotPass, setIsForgotPass] = useState(false);
  const [forgotData, setForgotData] = useState({
    tc_kimlik: '',
    forename: '',
    surname: '',
    yearOfBirth: '',
    email: ''
  });
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!tc || !password) {
      setError('Lütfen tüm alanları doldurunuz.');
      return;
    }

    setLoading(true);
    try {
      const fp = await fpPromise.load();
      const { visitorId } = await fp.get();

      const data = await api.post<{ token: string; user: { role: string; [k: string]: unknown } }>(
        '/auth/login',
        { email: tc, password, mac_address: visitorId }
      );

      // Tab - rol eşleşme kontrolü
      const tabRoleMap: Record<Tab, string> = {
        ogrenci:     'Öğrenci',
        akademisyen: 'Akademisyen',
        protokol:    'Protokol',
        yonetici:    'Yönetici',
      };
      if (data.user.role !== tabRoleMap[activeTab]) {
        setError(`Bu sekme ${tabRoleMap[activeTab]} kullanıcıları içindir.`);
        setLoading(false);
        return;
      }

      login(data.token, data.user as any);
      navigate(ROLE_ROUTES[data.user.role as string] ?? '/login');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Giriş işlemi başarısız. Lütfen bilgilerinizi kontrol edin.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess('');
    if (!forgotData.tc_kimlik || !forgotData.forename || !forgotData.surname || !forgotData.yearOfBirth || !forgotData.email) {
      setForgotError('Lütfen tüm alanları doldurunuz.');
      return;
    }

    setForgotLoading(true);
    try {
      // MERNIS verification and email generation via API
      const res = await api.post<{ message: string }>('/auth/forgot-password', {
        tc_kimlik: forgotData.tc_kimlik,
        forename: forgotData.forename.toLocaleUpperCase('tr-TR'),
        surname: forgotData.surname.toLocaleUpperCase('tr-TR'),
        yearOfBirth: parseInt(forgotData.yearOfBirth, 10),
        email: forgotData.email
      });
      setForgotSuccess(res.message || 'Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.');
      setForgotData({ tc_kimlik: '', forename: '', surname: '', yearOfBirth: '', email: '' });
    } catch (err: unknown) {
      setForgotError(err instanceof Error ? err.message : 'Bir hata oluştu veya kimlik bilgileriniz MERNİS kayıtları ile eşleşmedi.');
    } finally {
      setForgotLoading(false);
    }
  };

  const activeLabelMap: Record<Tab, string> = {
    ogrenci: 'Öğrenci Bilgi Sistemi Girişi',
    akademisyen: 'Akademik Personel Girişi',
    protokol: 'Protokol / Üst Yönetim Girişi',
    yonetici: 'Sistem Yöneticisi Girişi',
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Ambient Glassmorphic Background Blur Circles */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-tr from-sky-400/30 to-[#00306e]/30 opacity-20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-tr from-amber-200/30 to-[#ffe16d]/30 opacity-20 blur-[120px] pointer-events-none" />
      
      {/* Decorative Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,33,71,0.012)_1px,transparent_1px),linear-gradient(90deg,rgba(0,33,71,0.012)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      <main className="w-full max-w-[480px] z-10 relative">
        <div 
          className="rounded-2xl shadow-2xl border overflow-hidden transition-all duration-500"
          style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            borderColor: 'rgba(255, 255, 255, 0.6)'
          }}
        >
          {/* Brand Header */}
          <div className="bg-[#002147] p-6 text-center border-b border-slate-200/80">
            <div className="flex justify-center mb-4">
              <img 
                className="w-24 h-24 object-contain filter drop-shadow-md hover:scale-105 transition-transform duration-300" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBqypWiGmY0EBsZp_SckPkrWsWVLCy4IIzui6fQNtT_iyzcw3fC_tjGYzGj5ay_CAE-tFGbKaRnpUFZr4UCdP86I5mosfASKJTzSraE61VpF-s85cOWfpUc0HwzA5LCgwbHsXh_QFrT6cXYqHujSC0b5BeyLxKNz6PiDmgI5qJs0wLom8M0ZKzTWNjcHGlX4cdg6qqw3_KKBAGeruXZ726gOdxU5vmCGrf4ca5C5zdq_pqqeBY8aQwX7MUWBuy2prKIuA" 
                alt="Harran Üniversitesi Logo" 
              />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-wide">Harran Üniversitesi</h1>
            <p className="text-[11px] text-[#ffe16d] font-bold uppercase tracking-widest mt-1">Sınav Yönetim ve Gözetim Sistemi</p>
          </div>

          <div className="p-8 sm:p-10">
            {!isForgotPass ? (
              <div id="login-section" className="space-y-6">
                
                {/* Tab Selector */}
                <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100/80 rounded-xl border border-slate-200/60 backdrop-blur-md">
                  {TABS.map(tab => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => { setActiveTab(tab.id); setError(''); }}
                      className={`flex flex-col items-center gap-1 py-2 px-1 text-[10px] sm:text-xs font-bold transition-all rounded-lg ${
                        activeTab === tab.id
                          ? 'bg-[#00306e] text-white shadow-lg shadow-[#00306e]/20'
                          : 'text-slate-500 hover:text-[#00306e] hover:bg-slate-200/50'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </div>

                <div className="text-center">
                  <h2 className="text-[18px] font-bold text-[#00306e] tracking-tight">{activeLabelMap[activeTab]}</h2>
                  <p className="text-xs text-slate-500 mt-1.5">Lütfen bilgilerinizi kullanarak oturum açın.</p>
                </div>

                {error && (
                  <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium animate-shake animate-duration-300">
                    <span className="material-symbols-outlined text-[18px] shrink-0">error</span>
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                  {/* TCKN / Username */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600 block">T.C. Kimlik Numarası / E-Posta</label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">badge</span>
                      <input 
                        type="text" 
                        value={tc}
                        onChange={e => setTc(e.target.value)}
                        placeholder={activeTab === 'ogrenci' ? '11 Haneli TCKN veya Öğrenci No' : 'TCKN veya E-Posta'}
                        className="w-full pl-10 pr-4 py-3 bg-[#f6f3f2] border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#00306e] focus:border-[#00306e] text-sm outline-none transition-all text-slate-800 focus:bg-white"
                        required
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600 block">Şifre</label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">lock</span>
                      <input 
                        type={showPass ? 'text' : 'password'}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="••••••••" 
                        className="w-full pl-10 pr-12 py-3 bg-[#f6f3f2] border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#00306e] focus:border-[#00306e] text-sm outline-none transition-all text-slate-800 focus:bg-white"
                        required
                      />
                      <button 
                        type="button"
                        onClick={() => setShowPass(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#00306e] transition-colors"
                      >
                        <span className="material-symbols-outlined text-[20px]">{showPass ? 'visibility_off' : 'visibility'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Secure Connection Indicator */}
                  <div className="flex items-center gap-2.5 px-3 py-2.5 bg-[#00306e]/5 rounded-lg border border-[#00306e]/10">
                    <span className="material-symbols-outlined text-[#00306e] text-[18px]">verified_user</span>
                    <span className="text-[10px] font-semibold text-[#00306e]">Sistem güvenli giriş katmanı (WAF) ile korunmaktadır.</span>
                  </div>

                  <div className="pt-2">
                    <button 
                      type="submit" 
                      disabled={loading}
                      className="w-full bg-[#00306e] hover:bg-[#002147] disabled:opacity-60 text-white py-3.5 rounded-lg font-semibold transition-all transform active:scale-[0.98] shadow-md flex items-center justify-center gap-2 text-sm"
                    >
                      {loading ? (
                        <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <span>Giriş Yap</span>
                          <span className="material-symbols-outlined text-[18px]">login</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>

                <div className="flex flex-col sm:flex-row justify-between items-center gap-2 pt-2 text-xs">
                  <button 
                    type="button"
                    onClick={() => setIsForgotPass(true)}
                    className="text-[#00306e] hover:text-[#002147] font-semibold flex items-center gap-1 group"
                  >
                    <span className="material-symbols-outlined text-[16px]">help_center</span>
                    <span className="border-b border-transparent group-hover:border-[#002147]">Şifremi Unuttum</span>
                  </button>
                  <button 
                    type="button"
                    onClick={() => navigate('/register')}
                    className="text-[#00306e] hover:text-[#002147] font-semibold flex items-center gap-1 group"
                  >
                    <span className="material-symbols-outlined text-[16px]">person_add</span>
                    <span className="border-b border-transparent group-hover:border-[#002147]">Hesap Oluştur / Kayıt Ol</span>
                  </button>
                </div>

              </div>
            ) : (
              <div id="forgot-password-section" className="space-y-6">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <button 
                    type="button" 
                    className="p-1 hover:bg-slate-100 rounded-full transition-colors flex items-center justify-center" 
                    onClick={() => { setIsForgotPass(false); setForgotError(''); setForgotSuccess(''); }}
                  >
                    <span className="material-symbols-outlined text-[#00306e]">arrow_back</span>
                  </button>
                  <div>
                    <h2 className="text-base font-bold text-[#00306e]">Şifre Sıfırlama</h2>
                    <p className="text-[11px] text-slate-500">MERNİS doğrulaması ile şifre sıfırlama işlemi.</p>
                  </div>
                </div>

                {forgotError && (
                  <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium animate-shake">
                    <span className="material-symbols-outlined text-[18px] shrink-0">error</span>
                    <span>{forgotError}</span>
                  </div>
                )}
                {forgotSuccess && (
                  <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs font-medium">
                    <span className="material-symbols-outlined text-[18px] shrink-0">check_circle</span>
                    <span>{forgotSuccess}</span>
                  </div>
                )}

                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600 block">T.C. Kimlik Numarası</label>
                    <input 
                      className="w-full px-4 py-2.5 bg-[#f6f3f2] border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#00306e] focus:border-[#00306e] text-sm outline-none text-slate-800 focus:bg-white" 
                      maxLength={11} 
                      type="text"
                      value={forgotData.tc_kimlik}
                      onChange={e => setForgotData({...forgotData, tc_kimlik: e.target.value.replace(/[^0-9]/g, '')})}
                      placeholder="11 haneli T.C. kimlik numarası"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-600 block">Ad</label>
                      <input 
                        className="w-full px-4 py-2.5 bg-[#f6f3f2] border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#00306e] focus:border-[#00306e] text-sm outline-none text-slate-800 focus:bg-white" 
                        type="text"
                        value={forgotData.forename}
                        onChange={e => setForgotData({...forgotData, forename: e.target.value})}
                        placeholder="MERNİS kaydındaki adınız"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-600 block">Soyad</label>
                      <input 
                        className="w-full px-4 py-2.5 bg-[#f6f3f2] border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#00306e] focus:border-[#00306e] text-sm outline-none text-slate-800 focus:bg-white" 
                        type="text"
                        value={forgotData.surname}
                        onChange={e => setForgotData({...forgotData, surname: e.target.value})}
                        placeholder="MERNİS soyadınız"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-600 block">Doğum Yılı</label>
                      <input 
                        className="w-full px-4 py-2.5 bg-[#f6f3f2] border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#00306e] focus:border-[#00306e] text-sm outline-none text-slate-800 focus:bg-white" 
                        type="number"
                        min="1930"
                        max="2010"
                        value={forgotData.yearOfBirth}
                        onChange={e => setForgotData({...forgotData, yearOfBirth: e.target.value})}
                        placeholder="Örn: 2002"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-600 block">E-Posta</label>
                      <input 
                        className="w-full px-4 py-2.5 bg-[#f6f3f2] border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#00306e] focus:border-[#00306e] text-sm outline-none text-slate-800 focus:bg-white" 
                        type="email"
                        value={forgotData.email}
                        onChange={e => setForgotData({...forgotData, email: e.target.value})}
                        placeholder="ornek@harran.edu.tr"
                        required
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button 
                      type="submit"
                      disabled={forgotLoading}
                      className="w-full bg-[#00306e] hover:bg-[#002147] disabled:opacity-60 text-white py-3 rounded-lg font-semibold transition-all shadow-md text-sm flex items-center justify-center gap-2"
                    >
                      {forgotLoading ? (
                        <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <span>Şifre Sıfırlama Bağlantısını Gönder</span>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* Footer details */}
          <div className="bg-slate-100/60 p-4 text-center border-t border-slate-200/80 backdrop-blur-md">
            <div className="flex items-center justify-center gap-4 text-[10px] font-semibold">
              <a className="text-slate-600 hover:text-[#00306e] transition-colors" href="#">Kullanım Koşulları</a>
              <span className="w-1 h-1 bg-slate-400 rounded-full" />
              <a className="text-slate-600 hover:text-[#00306e] transition-colors" href="#">KVKK Aydınlatma Metni</a>
            </div>
            <p className="text-[10px] text-slate-400 mt-2">© 2024 Harran Üniversitesi. Tüm Hakları Saklıdır.</p>
          </div>
        </div>

        {/* Decorative Info Cards (Desktop Only) */}
        <div className="hidden md:grid grid-cols-2 gap-4 mt-4">
          <div 
            className="p-4 rounded-xl shadow-lg flex items-start gap-3 border transition-all duration-300 hover:scale-[1.02]"
            style={{
              background: 'rgba(255, 255, 255, 0.85)',
              backdropFilter: 'blur(8px)',
              borderColor: 'rgba(255, 255, 255, 0.5)'
            }}
          >
            <span className="material-symbols-outlined text-[#2E7D32]">verified</span>
            <div>
              <h4 className="text-xs font-bold text-slate-800">Güvenli Bağlantı</h4>
              <p className="text-[10px] text-slate-500 leading-normal mt-0.5">Uçtan uca 256-bit SSL sertifikası ile verileriniz güvende.</p>
            </div>
          </div>
          <div 
            className="p-4 rounded-xl shadow-lg flex items-start gap-3 border transition-all duration-300 hover:scale-[1.02]"
            style={{
              background: 'rgba(255, 255, 255, 0.85)',
              backdropFilter: 'blur(8px)',
              borderColor: 'rgba(255, 255, 255, 0.5)'
            }}
          >
            <span className="material-symbols-outlined text-amber-600">support_agent</span>
            <div>
              <h4 className="text-xs font-bold text-slate-800">Teknik Destek</h4>
              <p className="text-[10px] text-slate-500 leading-normal mt-0.5">Sorunlar için: destek@harran.edu.tr adresine yazın.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
