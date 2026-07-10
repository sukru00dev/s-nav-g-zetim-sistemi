import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../../lib/api';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const token = searchParams.get('token');
  const id = searchParams.get('id');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!token || !id) {
      setError('Geçersiz veya eksik şifre sıfırlama parametreleri. Lütfen e-postanızdaki bağlantıyı kontrol edin.');
      return;
    }

    if (!password || !confirmPassword) {
      setError('Lütfen tüm alanları doldurunuz.');
      return;
    }

    if (password.length < 6) {
      setError('Şifre en az 6 karakter uzunluğunda olmalıdır.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Girdiğiniz şifreler birbiriyle uyuşmuyor.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post<{ message: string }>('/auth/reset-password', {
        id,
        token,
        password
      });

      setSuccess(res.message || 'Şifreniz başarıyla sıfırlandı!');
      setPassword('');
      setConfirmPassword('');
      
      // 3 saniye sonra login sayfasına yönlendir
      setTimeout(() => {
        navigate('/login');
      }, 3000);

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Şifre sıfırlama işlemi başarısız oldu. Bağlantının süresi dolmuş olabilir.');
    } finally {
      setLoading(false);
    }
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
                className="w-24 h-24 object-contain filter drop-shadow-md" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBqypWiGmY0EBsZp_SckPkrWsWVLCy4IIzui6fQNtT_iyzcw3fC_tjGYzGj5ay_CAE-tFGbKaRnpUFZr4UCdP86I5mosfASKJTzSraE61VpF-s85cOWfpUc0HwzA5LCgwbHsXh_QFrT6cXYqHujSC0b5BeyLxKNz6PiDmgI5qJs0wLom8M0ZKzTWNjcHGlX4cdg6qqw3_KKBAGeruXZ726gOdxU5vmCGrf4ca5C5zdq_pqqeBY8aQwX7MUWBuy2prKIuA" 
                alt="Harran Üniversitesi Logo" 
              />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-wide">Harran Üniversitesi</h1>
            <p className="text-[11px] text-[#ffe16d] font-bold uppercase tracking-widest mt-1">Sınav Yönetim ve Gözetim Sistemi</p>
          </div>

          <div className="p-8 sm:p-10">
            <div className="space-y-6">
              
              <div className="text-center">
                <h2 className="text-[18px] font-bold text-[#00306e] tracking-tight">Yeni Şifre Belirleme</h2>
                <p className="text-xs text-slate-500 mt-1.5">Lütfen hesabınız için yeni bir şifre giriniz.</p>
              </div>

              {error && (
                <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium animate-shake">
                  <span className="material-symbols-outlined text-[18px] shrink-0">error</span>
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs font-medium">
                  <span className="material-symbols-outlined text-[18px] shrink-0">check_circle</span>
                  <span>{success}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Password */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600 block">Yeni Şifre</label>
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

                {/* Confirm Password */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600 block">Yeni Şifre Tekrar</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">lock_reset</span>
                    <input 
                      type={showPass ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="••••••••" 
                      className="w-full pl-10 pr-12 py-3 bg-[#f6f3f2] border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#00306e] focus:border-[#00306e] text-sm outline-none transition-all text-slate-800 focus:bg-white"
                      required
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button 
                    type="submit" 
                    disabled={loading || !!success}
                    className="w-full bg-[#00306e] hover:bg-[#002147] disabled:opacity-60 text-white py-3.5 rounded-lg font-semibold transition-all transform active:scale-[0.98] shadow-md flex items-center justify-center gap-2 text-sm"
                  >
                    {loading ? (
                      <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Şifreyi Güncelle</span>
                        <span className="material-symbols-outlined text-[18px]">key</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              <div className="text-center pt-2">
                <button 
                  type="button"
                  onClick={() => navigate('/login')}
                  className="text-[#00306e] hover:text-[#002147] font-semibold text-xs flex items-center gap-1 mx-auto group"
                >
                  <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                  <span className="border-b border-transparent group-hover:border-[#002147]">Giriş Ekranına Dön</span>
                </button>
              </div>

            </div>
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
      </main>
    </div>
  );
}
