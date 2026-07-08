import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { api } from '../../../lib/api';

export default function ProtocolSecurity() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  useEffect(() => {
    api.get<any[]>('/protocol/security', token)
      .then(data => { setLogs(data); setLoading(false); })
      .catch(err => { console.error(err); setLoading(false); });
  }, [token]);

  return (
    <section className="space-y-6 max-w-7xl mx-auto p-4 lg:p-6 font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-6 rounded-3xl border border-stone-200/80 shadow-sm gap-4">
        <div>
          <h1 className="text-xl font-bold font-serif text-[#002147] flex items-center gap-2">
            <span className="material-symbols-outlined text-rose-500">gavel</span>
            Kopya Risk Raporları & AI İhlal Logları
          </h1>
          <p className="text-sm text-stone-500">Yapay Zeka modelleri tarafından üniversite genelinde yakalanan tüm biyometrik uyarılar.</p>
        </div>
        <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center shrink-0">
           <span className="material-symbols-outlined text-3xl">policy</span>
        </div>
      </div>

      {/* Rapor Listesi */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-stone-100 bg-stone-50/50 flex justify-between items-center">
          <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">İhlal Kayıtları</span>
          <span className="text-[11px] text-rose-600 bg-rose-50 font-bold px-2.5 py-1 rounded-lg border border-rose-100/50">
            Son 100 İhlal Analiz Ediliyor
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-stone-50 text-stone-500 text-[10px] uppercase tracking-widest font-bold">
              <tr>
                <th className="p-4 border-b border-stone-200">Tarih / Saat</th>
                <th className="p-4 border-b border-stone-200">İhlal Türü</th>
                <th className="p-4 border-b border-stone-200">Öğrenci Bilgisi</th>
                <th className="p-4 border-b border-stone-200">Sınav</th>
                <th className="p-4 border-b border-stone-200">Açıklama / Kanıt</th>
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
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-stone-400">
                    <span className="material-symbols-outlined text-4xl text-stone-300 block mb-2">verified_user</span>
                    <span className="text-xs font-medium block">Sistemde kayıtlı herhangi bir ihlal raporu bulunmamaktadır.</span>
                  </td>
                </tr>
              ) : (
                logs.map((log, idx) => (
                  <tr key={idx} className="hover:bg-stone-50/50 transition-colors">
                    <td className="p-4 text-stone-600 font-mono whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString('tr-TR')}
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 w-fit border ${
                        log.type === 'NO_FACE' ? 'bg-red-50 border-red-200 text-red-700' :
                        log.type === 'MULTIPLE_FACES' ? 'bg-orange-50 border-orange-200 text-orange-700' :
                        log.type === 'TAB_SWITCH' ? 'bg-amber-50 border-amber-200 text-amber-700' :
                        'bg-stone-50 border-stone-200 text-stone-700'
                      }`}>
                        <span className={`w-1 h-1 rounded-full ${
                          log.type === 'NO_FACE' ? 'bg-red-500' :
                          log.type === 'MULTIPLE_FACES' ? 'bg-orange-500' :
                          log.type === 'TAB_SWITCH' ? 'bg-amber-500' :
                          'bg-stone-500'
                        }`} />
                        {log.type}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-[#002147]">{log.session?.user?.forename} {log.session?.user?.surname}</div>
                      <div className="text-xs text-stone-500 font-mono mt-0.5">{log.session?.user?.tc_kimlik}</div>
                    </td>
                    <td className="p-4 font-bold text-stone-800">{log.session?.exam?.title}</td>
                    <td className="p-4 text-stone-500 leading-relaxed text-xs">
                      {log.description || '-'}
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
