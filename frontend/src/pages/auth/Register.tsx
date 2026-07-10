import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import fpPromise from '@fingerprintjs/fingerprintjs';
import { api } from '../../lib/api';

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    forename: '',
    surname: '',
    username: '',
    tc_kimlik: '',
    email: '',
    password: '',
    yearOfBirth: '',
    roleId: 4 // Varsayılan Öğrenci
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const fp = await fpPromise.load();
      const { visitorId } = await fp.get();
      await api.post('/auth/register', {
        ...formData,
        roleId: parseInt(formData.roleId.toString(), 10),
        mac_address: visitorId
      });
      setSuccess('Kayıt başarılı! E-posta doğrulama kodunu gireceğiniz sayfaya yönlendiriliyorsunuz...');
      setTimeout(() => navigate(`/verify-email?email=${encodeURIComponent(formData.email)}`), 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Kayıt işlemi başarısız oldu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Animated background blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-700/20 rounded-full blur-3xl animate-[pulse_8s_ease-in-out_infinite]" />
        <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-blue-700/20 rounded-full blur-3xl animate-[pulse_10s_ease-in-out_infinite_2s]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-900/10 rounded-full blur-3xl" />
      </div>

      {/* Grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none" />

      <div className="w-full max-w-lg relative z-10">
        {/* Logo / Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white shadow-xl shadow-indigo-900/50 mb-3 p-2">
            <img src="/favicon.png" alt="Harran Üniversitesi Logo" className="w-10 h-10 object-contain" />
          </div>
          <h1 className="text-xl font-bold text-white">Harran Üniversitesi</h1>
          <p className="text-slate-400 text-xs mt-0.5">Uzaktan Sınav Yönetim Sistemi</p>
        </div>

        {/* Card */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/60 rounded-3xl shadow-2xl overflow-hidden">
          <div className="bg-slate-950/60 px-8 py-5 border-b border-slate-800/80 text-center">
            <h2 className="text-lg font-bold text-white flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-indigo-400">person_add</span>
              Yeni Hesap Oluştur
            </h2>
            <p className="text-slate-400 text-xs mt-1">Sisteme kayıt olmak için bilgilerinizi eksiksiz girin.</p>
          </div>

          <div className="p-8">
            {error && (
              <div className="mb-5 flex items-center gap-3 p-4 bg-rose-950/50 border border-rose-800/60 rounded-xl text-rose-300 text-sm font-medium">
                <span className="material-symbols-outlined text-[18px] shrink-0">error</span>
                {error}
              </div>
            )}
            {success && (
              <div className="mb-5 flex items-center gap-3 p-4 bg-emerald-950/50 border border-emerald-800/60 rounded-xl text-emerald-300 text-sm font-medium">
                <span className="material-symbols-outlined text-[18px] shrink-0">check_circle</span>
                {success}
              </div>
            )}

            <form className="space-y-4" onSubmit={handleRegister}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-slate-400 mb-1">Ad</label>
                  <input 
                    type="text" 
                    name="forename"
                    value={formData.forename}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm" 
                    placeholder="Adınız" 
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-slate-400 mb-1">Soyad</label>
                  <input 
                    type="text" 
                    name="surname"
                    value={formData.surname}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm" 
                    placeholder="Soyadınız" 
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-slate-400 mb-1">Kullanıcı Adı</label>
                  <input 
                    type="text" 
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm" 
                    placeholder="sistem.kullanicisi" 
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-slate-400 mb-1">T.C. Kimlik No</label>
                  <input 
                    type="text" 
                    name="tc_kimlik"
                    value={formData.tc_kimlik}
                    onChange={handleChange}
                    maxLength={11}
                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm" 
                    placeholder="11 haneli T.C. no" 
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-slate-400 mb-1">E-Posta</label>
                  <input 
                    type="email" 
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm" 
                    placeholder="ornek@harran.edu.tr" 
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-slate-400 mb-1">Doğum Yılı</label>
                  <input 
                    type="number" 
                    name="yearOfBirth"
                    value={formData.yearOfBirth}
                    onChange={handleChange}
                    min="1930"
                    max="2010"
                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm" 
                    placeholder="Örn: 2002" 
                    required
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-400 mb-1">Şifre</label>
                <input 
                  type="password" 
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm" 
                  placeholder="••••••••" 
                  required
                />
              </div>

              <div className="pt-2">
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-900/40 text-sm"
                >
                  {loading ? (
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span className="material-symbols-outlined text-[20px]">person_add</span>
                  )}
                  {loading ? 'Hesap Oluşturuluyor...' : 'Hesap Oluştur'}
                </button>
              </div>
            </form>

            <div className="mt-5 text-center">
              <button 
                type="button"
                onClick={() => navigate('/login')}
                className="text-indigo-400 hover:text-indigo-300 font-medium text-xs inline-block transition-colors"
              >
                Zaten hesabınız var mı? Giriş yapın.
              </button>
            </div>
          </div>

          <div className="px-8 py-4 bg-slate-950/40 border-t border-slate-800 text-center">
            <p className="text-slate-600 text-[10px]">
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
