import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { api } from '../../../lib/api';

interface SystemLog {
  id: number;
  type: string;
  description?: string;
  timestamp: string;
  session?: {
    user?: { forename: string; surname: string; tc_kimlik: string };
    exam?: { title: string };
  };
}

export default function AdminLogs() {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  useEffect(() => {
    api.get<SystemLog[]>('/admin/logs', token)
      .then(data => { setLogs(data); setLoading(false); })
      .catch(err => { console.error(err); setLoading(false); });
  }, [token]);

  return (
    <section className="space-y-6">
      <div className="flex justify-between items-center bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-sm text-white">
        <div>
          <h1 className="text-xl font-bold">Sistem Logları</h1>
          <p className="text-sm text-slate-400">Sistemdeki son sınav uyarıları ve oturum hareketleri (Gerçek Zamanlı Veri)</p>
        </div>
      </div>

      <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-sm p-6 overflow-x-auto text-slate-200">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-950 text-slate-400 text-xs uppercase tracking-wider">
            <tr>
              <th className="p-4 border-b border-slate-800">Tarih</th>
              <th className="p-4 border-b border-slate-800">Log Tipi</th>
              <th className="p-4 border-b border-slate-800">Kullanıcı (T.C.)</th>
              <th className="p-4 border-b border-slate-800">Sınav</th>
              <th className="p-4 border-b border-slate-800">Açıklama</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50 text-sm">
            {loading ? (
              <tr><td colSpan={5} className="p-8 text-center text-slate-500">Loglar yükleniyor...</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-slate-500">Henüz kaydedilmiş bir log bulunmuyor.</td></tr>
            ) : (
              logs.map(log => (
                <tr key={log.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="p-4 whitespace-nowrap">{new Date(log.timestamp).toLocaleString('tr-TR')}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      log.type === 'NO_FACE' ? 'bg-red-500/20 text-red-400' :
                      log.type === 'MULTIPLE_FACES' ? 'bg-orange-500/20 text-orange-400' :
                      log.type === 'TAB_SWITCH' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-slate-500/20 text-slate-400'
                    }`}>
                      {log.type}
                    </span>
                  </td>
                  <td className="p-4">
                    {log.session?.user ? `${log.session.user.forename} ${log.session.user.surname} (${log.session.user.tc_kimlik})` : 'Bilinmiyor'}
                  </td>
                  <td className="p-4">{log.session?.exam?.title || 'Bilinmeyen Sınav'}</td>
                  <td className="p-4">{log.description || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
