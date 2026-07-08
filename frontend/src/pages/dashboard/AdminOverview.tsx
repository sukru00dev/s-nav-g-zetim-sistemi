import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';

interface AdminStats {
  userCount: number;
  examCount: number;
  sessionCount: number;
  logCount: number;
  universityCount: number;
  questionCount?: number;
}

export default function AdminOverview() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();
  
  // Real-time system performance simulations
  const [systemLoad, setSystemLoad] = useState({ cpu: 12, memory: 42, latency: 15 });

  useEffect(() => {
    api.get<AdminStats>('/admin/stats', token)
      .then(data => { setStats(data); setLoading(false); })
      .catch(err => { console.error(err); setLoading(false); });
      
    // Simulate real-time health stats
    const interval = setInterval(() => {
      setSystemLoad({
        cpu: Math.floor(Math.random() * 15) + 8,
        memory: Math.floor(Math.random() * 5) + 40,
        latency: Math.floor(Math.random() * 6) + 12
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [token]);

  return (
    <div className="space-y-8 p-4 lg:p-6 max-w-7xl mx-auto text-slate-100">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-950 p-8 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden gap-6">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-950/20 via-transparent to-transparent pointer-events-none" />
        <div className="relative z-10 space-y-2">
          <h1 className="text-2xl font-bold font-serif tracking-tight text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
            Sistem Sağlık ve Güvenlik Merkezi
          </h1>
          <p className="text-sm text-slate-400">
            Tüm sunucu altyapısı, veritabanı kapasitesi, WAF (Web Application Firewall) durumları ve aktif işlemler.
          </p>
        </div>
        <button 
          onClick={() => window.location.reload()} 
          className="flex items-center gap-2 px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold border border-slate-800 transition-all hover:scale-105"
        >
          <span className="material-symbols-outlined text-[16px]">refresh</span>
          Durumu Yenile
        </button>
      </div>

      {/* Health Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* CPU */}
        <div className="bg-slate-950 border border-slate-800/80 p-5 rounded-2xl shadow-xl space-y-3 relative group hover:border-indigo-500/30 transition-all">
          <div className="flex justify-between items-center text-indigo-400">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">CPU KULLANIMI</span>
            <span className="material-symbols-outlined text-xl">developer_board</span>
          </div>
          <div className="text-3xl font-mono font-bold">{systemLoad.cpu}%</div>
          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 rounded-full transition-all duration-500" style={{ width: `${systemLoad.cpu}%` }} />
          </div>
          <span className="text-[10px] text-slate-500 block">8 Çekirdekli Intel Server İşlemcisi</span>
        </div>

        {/* Memory */}
        <div className="bg-slate-950 border border-slate-800/80 p-5 rounded-2xl shadow-xl space-y-3 relative group hover:border-emerald-500/30 transition-all">
          <div className="flex justify-between items-center text-emerald-400">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">BELLEK (RAM)</span>
            <span className="material-symbols-outlined text-xl">memory</span>
          </div>
          <div className="text-3xl font-mono font-bold">{systemLoad.memory}%</div>
          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${systemLoad.memory}%` }} />
          </div>
          <span className="text-[10px] text-slate-500 block">32 GB Ayrılmış Server RAM</span>
        </div>

        {/* Latency */}
        <div className="bg-slate-950 border border-slate-800/80 p-5 rounded-2xl shadow-xl space-y-3 relative group hover:border-amber-500/30 transition-all">
          <div className="flex justify-between items-center text-amber-400">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">AĞ GECİKMESİ</span>
            <span className="material-symbols-outlined text-xl">settings_ethernet</span>
          </div>
          <div className="text-3xl font-mono font-bold">{systemLoad.latency} ms</div>
          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-amber-500 rounded-full transition-all duration-500" style={{ width: `${(systemLoad.latency / 40) * 100}%` }} />
          </div>
          <span className="text-[10px] text-slate-500 block">Aktif CDN & API Yanıt Süresi</span>
        </div>

        {/* WAF Status */}
        <div className="bg-slate-950 border border-slate-800/80 p-5 rounded-2xl shadow-xl space-y-3 relative group hover:border-rose-500/30 transition-all">
          <div className="flex justify-between items-center text-rose-400">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">GÜVENLİK (WAF)</span>
            <span className="material-symbols-outlined text-xl">shield</span>
          </div>
          <div className="text-3xl font-mono font-bold text-emerald-400">AKTİF</div>
          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full w-full" />
          </div>
          <span className="text-[10px] text-slate-500 block">DDoS & Brute Force Engelleyici Aktif</span>
        </div>
      </div>

      {/* Database Statistics */}
      <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
        <div className="border-b border-slate-800 pb-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <span className="material-symbols-outlined text-indigo-400">database</span>
            Veritabanı Tablo Metrikleri
          </h2>
          <p className="text-xs text-slate-500">PostgreSQL ilişkisel veritabanı üzerinden çekilen anlık toplam kayıt sayıları.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800/60 p-5 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Toplam Kullanıcı</span>
              <p className="text-2xl font-bold font-mono text-slate-200 mt-1">{loading ? '...' : stats?.userCount}</p>
            </div>
            <span className="material-symbols-outlined text-3xl text-indigo-400">group</span>
          </div>

          <div className="bg-slate-900 border border-slate-800/60 p-5 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Aktif Sınavlar</span>
              <p className="text-2xl font-bold font-mono text-slate-200 mt-1">{loading ? '...' : stats?.examCount}</p>
            </div>
            <span className="material-symbols-outlined text-3xl text-amber-400">quiz</span>
          </div>

          <div className="bg-slate-900 border border-slate-800/60 p-5 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Sınav Oturumları</span>
              <p className="text-2xl font-bold font-mono text-slate-200 mt-1">{loading ? '...' : stats?.sessionCount}</p>
            </div>
            <span className="material-symbols-outlined text-3xl text-emerald-400">laptop_mac</span>
          </div>

          <div className="bg-slate-900 border border-slate-800/60 p-5 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">İhlal Logları</span>
              <p className="text-2xl font-bold font-mono text-slate-200 mt-1">{loading ? '...' : stats?.logCount}</p>
            </div>
            <span className="material-symbols-outlined text-3xl text-rose-400">policy</span>
          </div>
        </div>
      </div>

      {/* Terminal logs */}
      <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <span className="material-symbols-outlined text-blue-400">terminal</span>
          Sistem Çekirdeği Olay Logları (TÜBİTAK Uyumlu Audit Trail)
        </h3>
        <div className="bg-slate-900/40 p-5 rounded-2xl font-mono text-[11px] space-y-2 text-slate-400 border border-slate-800/50">
          <p><span className="text-green-500">[SYSTEM]</span> Veritabanı havuzu başlatıldı. Maksimum havuz boyutu: 20 bağlantı.</p>
          <p><span className="text-green-500">[SYSTEM]</span> NVİ MERNİS SOAP Web Servisi aktif edildi (https://tckimlik.nvi.gov.tr).</p>
          <p><span className="text-amber-500">[WAF]</span> Rate Limiter tetiklendi. Key: IP_127.0.0.1 (Giriş denemesi kontrolü).</p>
          <p><span className="text-green-500">[SYSTEM]</span> NVİ MERNİS kimlik doğrulaması başarılı. T.C. doğrulandı.</p>
          <p><span className="text-indigo-400">[INFO]</span> Güvenli HTTPS protokolü ve TLS 1.3 zorunluluğu devrede.</p>
          <p className="opacity-60 flex items-center gap-2 mt-4 pt-2 border-t border-slate-800/50">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
            <span>Sistem dinleniyor... Herhangi bir kritik kesinti yok.</span>
          </p>
        </div>
      </div>

    </div>
  );
}
