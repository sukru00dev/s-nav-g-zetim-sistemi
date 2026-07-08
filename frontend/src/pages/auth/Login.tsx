import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import fpPromise from '@fingerprintjs/fingerprintjs';

type Tab = 'ogrenci' | 'protokol' | 'akademisyen' | 'yonetici';

const TABS: { id: Tab; label: string; icon: string; color: string }[] = [
  { id: 'ogrenci',     label: 'Öğrenci',     icon: 'school',           color: 'indigo' },
  { id: 'akademisyen', label: 'Akademisyen',  icon: 'person_book',      color: 'emerald' },
  { id: 'protokol',    label: 'Protokol',     icon: 'account_balance',  color: 'amber' },
  { id: 'yonetici',   label: 'Yönetici',     icon: 'terminal',         color: 'rose' },
];

const ROLE_ROUTES: Record<string, string> = {
  'Yönetici':    '/admin',
  'Protokol':    '/protokol',
  'Akademisyen': '/akademisyen',
  'Öğrenci':    '/ogrenci',
};

export default function Login() {
  const { login } = useAuth();
  const navigate   = useNavigate();

  const [activeTab, setActiveTab] = useState<Tab>('ogrenci');
  const [tc, setTc]               = useState('');
  const [password, setPassword]   = useState('');
  const [showPass, setShowPass]   = useState(false);
  const [error, setError]         = useState('');
  const [loading, setLoading]     = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!tc || !password) { setError('Lütfen tüm alanları doldurunuz.'); return; }

    setLoading(true);
    try {
      const fp = await fpPromise.load();
      const { visitorId } = await fp.get();

      const data = await api.post<{ token: string; user: { role: string; [k: string]: unknown } }>(
        '/auth/login',
        { email: tc, password, mac_address: visitorId }
      );

      // Tab – rol eşleşme kontrolü
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
      setError(err instanceof Error ? err.message : 'Sunucuya bağlanılamadı.');
    } finally {
      setLoading(false);
    }
  };

  const active = TABS.find(t => t.id === activeTab)!;

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-700/20 rounded-full blur-3xl animate-[pulse_8s_ease-in-out_infinite]" />
        <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-blue-700/20 rounded-full blur-3xl animate-[pulse_10s_ease-in-out_infinite_2s]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-900/10 rounded-full blur-3xl" />
      </div>

      {/* Grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600 shadow-xl shadow-indigo-900/50 mb-4">
            <span className="material-symbols-outlined text-white text-3xl">school</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Harran Üniversitesi</h1>
          <p className="text-slate-400 text-sm mt-1">Uzaktan Sınav Yönetim Sistemi</p>
        </div>

        {/* Card */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/60 rounded-3xl shadow-2xl overflow-hidden">
          {/* Tab Selector */}
          <div className="grid grid-cols-4 bg-slate-950/60 border-b border-slate-800">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setError(''); }}
                className={`flex flex-col items-center gap-1 py-3 px-2 text-xs font-bold transition-all border-b-2 ${
                  activeTab === tab.id
                    ? 'text-indigo-400 border-indigo-500 bg-indigo-950/40'
                    : 'text-slate-500 border-transparent hover:text-slate-300 hover:bg-slate-800/40'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
                <span className="hidden sm:block">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Form */}
          <div className="p-8">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-indigo-400">{active.icon}</span>
                {active.label} Girişi
              </h2>
              <p className="text-slate-400 text-sm mt-1">Kurumsal kimlik bilgilerinizle giriş yapın.</p>
            </div>

            {error && (
              <div className="mb-5 flex items-center gap-3 p-4 bg-rose-950/50 border border-rose-800/60 rounded-xl text-rose-300 text-sm font-medium">
                <span className="material-symbols-outlined text-[18px] shrink-0">error</span>
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              {/* TC / Username */}
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1.5">
                  T.C. Kimlik No / Kullanıcı Adı
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-[20px]">badge</span>
                  <input
                    type="text"
                    value={tc}
                    onChange={e => setTc(e.target.value)}
                    placeholder={active.id === 'ogrenci' ? 'Öğrenci No veya T.C.' : active.id === 'akademisyen' ? 'Personel No veya T.C.' : 'Kullanıcı adı veya e-posta'}
                    className="w-full pl-11 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1.5">Şifre</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-[20px]">lock</span>
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Şifreniz"
                    className="w-full pl-11 pr-12 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(v => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[20px]">{showPass ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-900/40 text-sm mt-2"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span className="material-symbols-outlined text-[20px]">login</span>
                )}
                {loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
              </button>
            </form>
          </div>

          {/* Footer */}
          <div className="px-8 py-4 bg-slate-950/40 border-t border-slate-800 text-center">
            <p className="text-slate-600 text-xs">
              © 2024 Harran Üniversitesi · LEUKOLION v2.0 · TÜBİTAK Projesi
            </p>
          </div>
        </div>

        {/* Security badge */}
        <div className="flex items-center justify-center gap-2 mt-4 text-slate-600 text-xs">
          <span className="material-symbols-outlined text-[14px]">shield</span>
          NVİ Doğrulamalı · Şifrelenmiş Bağlantı · Cihaz Kimlik Takibi
        </div>
      </div>
    </div>
  );
}
