import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';

interface ProtocolStats {
  studentCount: number;
  teacherCount: number;
  activeExams: number;
  recentViolations: number;
}

export default function ProtocolOverview() {
  const [stats, setStats] = useState<ProtocolStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  useEffect(() => {
    api.get<ProtocolStats>('/protocol/stats', token)
      .then(data => { setStats(data); setLoading(false); })
      .catch(err => { console.error(err); setLoading(false); });
  }, [token]);

  return (
    <div className="space-y-8 p-4 lg:p-6 max-w-7xl mx-auto font-sans">
      
      {/* Top Banner - Rectorate Academic Theme */}
      <div className="bg-[#002147] p-8 rounded-3xl shadow-xl flex flex-col md:flex-row items-center justify-between relative overflow-hidden border border-amber-500/20 gap-6">
         <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] pointer-events-none" />
         <div className="relative z-10 space-y-2 text-white">
           <h2 className="text-2xl font-bold font-serif tracking-tight flex items-center gap-2">
             <span className="material-symbols-outlined text-amber-400">account_balance</span>
             Rektörlük & Senato İzleme Paneli
           </h2>
           <p className="text-sm text-slate-300">
             Tüm akademik birimler, fakülteler ve aktif sınav salonlarının genel koordinasyon ve yapay zeka denetim verileri.
           </p>
         </div>
         <div className="relative z-10 flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-2.5 rounded-2xl">
            <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping" />
            <span className="text-xs text-slate-200 font-bold uppercase tracking-wider">Senato Güvenlik Protokolü Aktif</span>
         </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Akademisyen */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200/80 flex items-center justify-between hover:shadow-md transition-shadow">
           <div className="space-y-1">
             <p className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">Akademik Personel</p>
             <h3 className="text-3xl font-serif font-bold text-[#002147]">{loading ? '...' : (stats?.teacherCount || 0)}</h3>
             <span className="text-[10px] text-emerald-600 font-bold">14 Aktif Fakülte</span>
           </div>
           <span className="material-symbols-outlined text-4xl text-slate-400/50">school</span>
        </div>

        {/* Aktif Sınav */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200/80 flex items-center justify-between hover:shadow-md transition-shadow">
           <div className="space-y-1">
             <p className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">Aktif Oturumlar</p>
             <h3 className="text-3xl font-serif font-bold text-amber-600">{loading ? '...' : (stats?.activeExams || 0)}</h3>
             <span className="text-[10px] text-stone-400">Anlık Canlı Gözetim</span>
           </div>
           <span className="material-symbols-outlined text-4xl text-amber-500/50">sensors</span>
        </div>

        {/* Öğrenci */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200/80 flex items-center justify-between hover:shadow-md transition-shadow">
           <div className="space-y-1">
             <p className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">Kayıtlı Öğrenci</p>
             <h3 className="text-3xl font-serif font-bold text-emerald-600">{loading ? '...' : (stats?.studentCount || 0)}</h3>
             <span className="text-[10px] text-stone-400">Aktif MERNİS Onaylı</span>
           </div>
           <span className="material-symbols-outlined text-4xl text-emerald-500/50">group</span>
        </div>

        {/* Son İhlaller */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200/80 flex items-center justify-between hover:shadow-md transition-shadow">
           <div className="space-y-1">
             <p className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">Son 24s İhlalleri</p>
             <h3 className="text-3xl font-serif font-bold text-rose-600">{loading ? '...' : (stats?.recentViolations || 0)}</h3>
             <span className="text-[10px] text-rose-500 font-bold">AI Algılama Feed'i</span>
           </div>
           <span className="material-symbols-outlined text-4xl text-rose-500/50">policy</span>
        </div>
      </div>

      {/* Analytics & Security shortcuts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         <div className="bg-white border border-stone-200/80 rounded-3xl p-8 shadow-sm flex items-start gap-4 hover:shadow-md transition-shadow">
             <div className="w-12 h-12 bg-indigo-50 text-[#002147] rounded-2xl flex items-center justify-center shrink-0">
               <span className="material-symbols-outlined text-2xl">pie_chart</span>
             </div>
             <div className="space-y-2">
                 <h4 className="text-lg font-bold text-[#002147] font-serif">Detaylı Akademik Analitik</h4>
                 <p className="text-stone-500 text-xs leading-relaxed">
                   Fakülte bazında sınav dağılımları, soru havuzları doluluk oranları, bölümlerin sınav katılım istatistikleri ve genel akademik başarı matrisi.
                 </p>
             </div>
         </div>

         <div className="bg-white border border-stone-200/80 rounded-3xl p-8 shadow-sm flex items-start gap-4 hover:shadow-md transition-shadow">
             <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center shrink-0">
               <span className="material-symbols-outlined text-2xl">gavel</span>
             </div>
             <div className="space-y-2">
                 <h4 className="text-lg font-bold text-[#002147] font-serif">Güvenlik & Kopya Risk Analizleri</h4>
                 <p className="text-stone-500 text-xs leading-relaxed">
                   Yapay Zeka izleme modüllerimiz (Face API ve Ses Analizi) tarafından yakalanan kopya teşebbüsü şüphelileri, sekme değiştirme sayıları ve detaylı kanıt raporları.
                 </p>
             </div>
         </div>
      </div>

      {/* Harran Info Section */}
      <div className="bg-stone-100 border border-stone-200 p-6 rounded-3xl text-stone-600 text-xs leading-relaxed space-y-2">
         <p className="font-bold text-[#002147]">Akademik Dürüstlük ve Güvenli Ölçme Sistemi Hakkında:</p>
         <p>
            Bu sistem, TÜBİTAK 1001 araştırma ve geliştirme projesi standartlarına uygun olarak tasarlanmıştır. 
            Yapay zeka modellerinin ürettiği tüm risk skorları ve canlı ihlal kanıtları akademisyenlerin ve rektörlüğün nihai değerlendirmesine sunulur. 
            Tüm kişisel veriler kvkk uyumlu olarak ve sadece sınav oturumu süresince işlenmektedir.
         </p>
      </div>

    </div>
  );
}
