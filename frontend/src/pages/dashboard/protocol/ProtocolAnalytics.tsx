import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { api } from '../../../lib/api';

export default function ProtocolAnalytics() {
  const [universities, setUniversities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  useEffect(() => {
    api.get<any[]>('/protocol/analytics', token)
      .then(data => { setUniversities(data); setLoading(false); })
      .catch(err => { console.error(err); setLoading(false); });
  }, [token]);

  return (
    <section className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold font-serif text-[#1a2c42]">Üniversite Analitik</h1>
          <p className="text-sm text-stone-500">Kayıtlı fakülteler, bölümler ve programların detaylı dökümü</p>
        </div>
        <div className="w-12 h-12 bg-sky-100 text-sky-600 rounded-xl flex items-center justify-center">
           <span className="material-symbols-outlined text-3xl">pie_chart</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 overflow-hidden">
        {loading ? (
           <div className="p-8 text-center text-stone-400">Veriler Yükleniyor...</div>
        ) : universities.length === 0 ? (
           <div className="p-8 text-center text-stone-400">Sistemde kayıtlı bir üniversite hiyerarşisi bulunmuyor.</div>
        ) : (
          <div className="space-y-8">
            {universities.map(uni => (
              <div key={uni.id} className="space-y-4">
                <div className="flex items-center gap-2 border-b border-stone-100 pb-2">
                  <span className="material-symbols-outlined text-[#1a2c42]">account_balance</span>
                  <h2 className="text-xl font-bold font-serif text-[#1a2c42]">{uni.name}</h2>
                </div>
                
                {(!uni.unities || uni.unities.length === 0) ? (
                   <p className="text-sm text-stone-500 pl-8">Henüz birim (fakülte) eklenmemiş.</p>
                ) : (
                  <div className="space-y-6 pl-4">
                    {uni.unities.map((unity: any) => (
                      <div key={unity.id} className="space-y-3">
                        <div className="flex items-center gap-2 text-amber-700 font-bold">
                          <span className="material-symbols-outlined text-amber-600">school</span>
                          {unity.name}
                        </div>
                        
                        {(!unity.departments || unity.departments.length === 0) ? (
                          <p className="text-sm text-stone-400 pl-8">Bu birimde henüz bölüm yok.</p>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pl-8">
                            {unity.departments.map((dept: any) => (
                              <div key={dept.id} className="bg-stone-50 p-4 rounded-xl border border-stone-100">
                                <div className="flex items-center gap-2 text-stone-700 font-bold mb-3">
                                  <span className="material-symbols-outlined text-sky-600">domain</span>
                                  {dept.name}
                                </div>
                                <ul className="space-y-2">
                                  {(!dept.programs || dept.programs.length === 0) ? (
                                     <li className="text-xs text-stone-400">Program bulunmuyor.</li>
                                  ) : (
                                    dept.programs.map((prog: any) => (
                                      <li key={prog.id} className="text-sm text-stone-600 flex items-center gap-2 before:content-['•'] before:text-stone-300">
                                        {prog.name}
                                      </li>
                                    ))
                                  )}
                                </ul>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
