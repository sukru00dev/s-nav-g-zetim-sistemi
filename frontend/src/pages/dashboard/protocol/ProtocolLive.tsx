import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { api } from '../../../lib/api';

export default function ProtocolLive() {
  const [liveExams, setLiveExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  useEffect(() => {
    api.get<any[]>('/protocol/live', token)
      .then(data => { setLiveExams(data); setLoading(false); })
      .catch(err => { console.error(err); setLoading(false); });
  }, [token]);

  return (
    <section className="space-y-6 max-w-7xl mx-auto p-4 lg:p-6 font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-6 rounded-3xl border border-stone-200/80 shadow-sm gap-4">
        <div>
          <h1 className="text-xl font-bold font-serif text-[#002147] flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping" />
            Canlı Sınav Merkezi
          </h1>
          <p className="text-sm text-stone-500">Üniversite genelinde şu an devam etmekte olan tüm aktif sınav oturumlarının canlı izleme konsolu.</p>
        </div>
        <div className="flex items-center gap-2 text-rose-600 font-bold bg-rose-50 px-4 py-2 rounded-2xl border border-rose-100/60 text-xs shrink-0">
           <span className="material-symbols-outlined animate-pulse text-[16px]">sensors</span>
           <span>Canlı Yayın Aktif</span>
        </div>
      </div>

      {/* Live Table Card */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-stone-100 bg-stone-50/50 flex justify-between items-center">
          <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Aktif Oturum Listesi</span>
          <span className="text-[11px] text-[#002147] bg-[#002147]/5 font-bold px-2.5 py-1 rounded-lg">
            Toplam: {liveExams.length} Sınav Girişi
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-stone-50 text-stone-500 text-[10px] uppercase tracking-widest font-bold">
              <tr>
                <th className="p-4 border-b border-stone-200">Sınav / Ders Adı</th>
                <th className="p-4 border-b border-stone-200">Öğrenci Bilgisi</th>
                <th className="p-4 border-b border-stone-200">Başlangıç Zamanı</th>
                <th className="p-4 border-b border-stone-200">Biyometrik İhlal</th>
                <th className="p-4 border-b border-stone-200 text-right">Durum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-150 text-sm text-stone-700">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-stone-400">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="animate-spin w-8 h-8 border-4 border-[#002147] border-t-transparent rounded-full" />
                      <span className="text-xs font-medium">Veriler yükleniyor...</span>
                    </div>
                  </td>
                </tr>
              ) : liveExams.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-stone-400">
                    <span className="material-symbols-outlined text-4xl text-stone-300 block mb-2">dashboard_customize</span>
                    <span className="text-xs font-medium block">Şu anda üniversite genelinde aktif devam eden sınav oturumu bulunmamaktadır.</span>
                  </td>
                </tr>
              ) : (
                liveExams.map((session, idx) => (
                  <tr key={idx} className="hover:bg-stone-50/50 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-[#002147]">{session.exam?.title}</div>
                      <div className="text-[11px] text-stone-500 mt-0.5">{session.exam?.branch?.course?.name || 'Genel Ders'}</div>
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-stone-800">{session.user?.forename} {session.user?.surname}</div>
                      <div className="text-xs text-stone-500 font-mono mt-0.5">{session.user?.tc_kimlik}</div>
                    </td>
                    <td className="p-4 text-stone-600 font-mono">{new Date(session.startTime).toLocaleTimeString('tr-TR')}</td>
                    <td className="p-4">
                      {session._count?.logs > 0 ? (
                        <span className="bg-rose-50 border border-rose-100 text-rose-600 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 w-fit">
                          <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse" />
                          {session._count.logs} Adet İhlal
                        </span>
                      ) : (
                        <span className="bg-emerald-50 border border-emerald-100 text-emerald-600 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 w-fit">
                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                          Stabil
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <span className="bg-amber-50 border border-amber-200 text-amber-700 px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wider">
                        DEVAM EDİYOR
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
