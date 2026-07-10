import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../../lib/api';

export default function VerifyEmail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';

  const [code, setCode] = useState<string[]>(Array(6).fill(''));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    // Focus first input on mount
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleChange = (index: number, value: string) => {
    // Only allow numbers
    if (value !== '' && !/^[0-9]$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus next input
    if (value !== '' && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      const newCode = [...code];
      
      // If current input is empty, clear previous input and focus it
      if (code[index] === '' && index > 0) {
        newCode[index - 1] = '';
        setCode(newCode);
        inputRefs.current[index - 1]?.focus();
      } else {
        newCode[index] = '';
        setCode(newCode);
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
    
    if (pastedData.length > 0) {
      const newCode = [...code];
      for (let i = 0; i < pastedData.length; i++) {
        newCode[i] = pastedData[i];
        if (inputRefs.current[i]) {
          inputRefs.current[i]!.value = pastedData[i];
        }
      }
      setCode(newCode);
      
      // Focus the last filled input or the next one
      const focusIndex = Math.min(pastedData.length, 5);
      inputRefs.current[focusIndex]?.focus();
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const fullCode = code.join('');
    if (fullCode.length !== 6) {
      setError('Lütfen 6 haneli doğrulama kodunun tamamını giriniz.');
      return;
    }

    if (!email) {
      setError('E-posta adresi bulunamadı. Lütfen kayıt sayfasına dönün.');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post<{ message: string }>('/auth/verify-code', {
        email,
        code: fullCode
      });
      setSuccess(response.message || 'Hesabınız başarıyla doğrulandı!');
      setTimeout(() => {
        navigate('/login');
      }, 2500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Doğrulama işlemi başarısız oldu. Girdiğiniz kodu kontrol edin.');
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
          <div className="bg-slate-950/60 px-8 py-5 border-b border-slate-800/80 text-center">
            <h2 className="text-lg font-bold text-white flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-indigo-400">mail_lock</span>
              E-Posta Doğrulama
            </h2>
            <p className="text-slate-400 text-xs mt-1">Lütfen e-posta adresinize gönderilen 6 haneli kodu giriniz.</p>
          </div>

          <div className="p-8">
            {email && (
              <p className="text-center text-slate-300 text-xs mb-6">
                Doğrulama kodu gönderilen adres: <span className="font-semibold text-indigo-400">{email}</span>
              </p>
            )}

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

            <form onSubmit={handleVerify} className="space-y-6">
              {/* OTP Inputs */}
              <div className="flex justify-between gap-2 max-w-xs mx-auto">
                {code.map((digit, idx) => (
                  <input
                    key={idx}
                    type="text"
                    maxLength={1}
                    value={digit}
                    ref={(el) => { inputRefs.current[idx] = el; }}
                    onChange={(e) => handleChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    onPaste={handlePaste}
                    className="w-12 h-14 bg-slate-800 border border-slate-700 rounded-xl text-center text-xl font-bold text-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  />
                ))}
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading || code.join('').length !== 6}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-900/40 text-sm"
                >
                  {loading ? (
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span className="material-symbols-outlined text-[20px]">verified</span>
                  )}
                  {loading ? 'Doğrulanıyor...' : 'Hesabı Doğrula'}
                </button>
              </div>
            </form>

            <div className="mt-5 text-center flex flex-col gap-2">
              <button
                type="button"
                onClick={() => navigate('/register')}
                className="text-slate-400 hover:text-indigo-300 font-medium text-xs transition-colors"
              >
                Geri Dön ve Yeniden Kaydol
              </button>
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="text-indigo-400 hover:text-indigo-300 font-medium text-xs transition-colors"
              >
                Zaten doğrulandı mı? Giriş yapın.
              </button>
            </div>
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
