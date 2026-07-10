import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../../lib/api';

export default function ActivateAccount() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const activate = async () => {
      if (!token) {
        setError('Geçersiz aktivasyon bağlantısı. Aktivasyon kodu bulunamadı.');
        setLoading(false);
        return;
      }

      try {
        const response = await api.get<{ message: string }>(`/auth/activate?token=${token}`);
        setSuccess(response.message || 'Hesabınız başarıyla aktifleştirildi!');
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Aktivasyon işlemi başarısız oldu. Link süresi dolmuş veya geçersiz olabilir.');
      } finally {
        setLoading(false);
      }
    };

    activate();
  }, [token, navigate]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Animated background blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-700/20 rounded-full blur-3xl animate-[pulse_8s_ease-in-out_infinite]" />
        <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-blue-700/20 rounded-full blur-3xl animate-[pulse_10s_ease-in-out_infinite_2s]" />
      </div>

      {/* Grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
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
          <div className="bg-slate-950/60 px-8 py-6 border-b border-slate-800/80 text-center">
            <h2 className="text-lg font-bold text-white flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-indigo-400">verified_user</span>
              Hesap Aktivasyonu
            </h2>
          </div>

          <div className="p-8 text-center">
            {loading && (
              <div className="space-y-4 py-6">
                <div className="inline-block w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-slate-300 text-sm font-medium">Aktivasyon kodunuz doğrulanıyor, lütfen bekleyin...</p>
              </div>
            )}

            {error && (
              <div className="space-y-6 py-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-rose-950/30 border border-rose-800/40 text-rose-500 mb-2">
                  <span className="material-symbols-outlined text-4xl">error</span>
                </div>
                <div className="p-4 bg-rose-950/40 border border-rose-800/50 rounded-xl text-rose-300 text-sm font-medium text-left">
                  {error}
                </div>
                <button
                  onClick={() => navigate('/login')}
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl transition-all border border-slate-700 text-sm"
                >
                  Giriş Sayfasına Dön
                </button>
              </div>
            )}

            {success && (
              <div className="space-y-6 py-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-950/30 border border-emerald-800/40 text-emerald-400 mb-2">
                  <span className="material-symbols-outlined text-4xl">check_circle</span>
                </div>
                <div className="p-4 bg-emerald-950/40 border border-emerald-800/50 rounded-xl text-emerald-300 text-sm font-medium">
                  {success}
                </div>
                <p className="text-xs text-slate-400 animate-pulse">
                  Giriş sayfasına otomatik olarak yönlendiriliyorsunuz...
                </p>
              </div>
            )}
          </div>

          <div className="px-8 py-4 bg-slate-950/40 border-t border-slate-800 text-center">
            <p className="text-slate-600 text-[10px]">
              © 2024 Harran Üniversitesi · LEUKOLION v2.0 · TÜBİTAK Projesi
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
