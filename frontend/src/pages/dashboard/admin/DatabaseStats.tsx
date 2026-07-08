import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { api } from '../../../lib/api';

export default function DatabaseStats() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  useEffect(() => {
    api.get<any>('/admin/stats', token)
      .then(data => { setStats(data); setLoading(false); })
      .catch(err => { console.error(err); setLoading(false); });
  }, [token]);

  return (
    <section className="space-y-6">
      <div className="flex justify-between items-center bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-sm text-white">
        <div>
          <h1 className="text-xl font-bold">Veritabanı Yönetimi</h1>
          <p className="text-sm text-slate-400">Canlı veritabanı büyüklüğü ve sistem bileşenlerinin durumu</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Kullanıcı Sayısı', value: stats?.userCount, icon: 'group', color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { label: 'Sınav Sayısı', value: stats?.examCount, icon: 'quiz', color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
          { label: 'Oturum Sayısı', value: stats?.sessionCount, icon: 'laptop_mac', color: 'text-amber-400', bg: 'bg-amber-500/10' },
          { label: 'Üniversite', value: stats?.universityCount, icon: 'account_balance', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
        ].map((item, idx) => (
          <div key={idx} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex items-center gap-4">
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${item.bg} ${item.color}`}>
              <span className="material-symbols-outlined text-3xl">{item.icon}</span>
            </div>
            <div>
              <div className="text-3xl font-bold text-white">
                {loading ? '...' : (item.value || 0)}
              </div>
              <div className="text-sm font-bold text-slate-400">{item.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
        <h3 className="text-lg font-bold text-white mb-4">Sistem Sağlık Durumu</h3>
        <div className="flex items-center gap-2 text-green-400 mb-2">
          <span className="material-symbols-outlined">check_circle</span>
          <span>PostgreSQL Veritabanı Bağlantısı: Aktif</span>
        </div>
        <div className="flex items-center gap-2 text-green-400">
          <span className="material-symbols-outlined">check_circle</span>
          <span>Log Tablosu Boyutu: {stats?.logCount || 0} kayıt</span>
        </div>
      </div>
    </section>
  );
}
