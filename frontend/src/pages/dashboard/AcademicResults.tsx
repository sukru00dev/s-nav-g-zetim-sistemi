import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';

interface StudentSession {
  id: number;
  status: string;
  startTime: string;
  endTime?: string;
  riskScore: number;
  user: {
    id: number;
    forename: string;
    surname: string;
    tc_kimlik: string;
    email: string;
    photo?: string;
  };
  exam: {
    id: number;
    title: string;
    durationMin: number;
    isSupervised: boolean;
    branch: {
      name: string;
    }
  };
  answers: Array<{
    id: number;
    question: { text: string; type: string };
    option?: { text: string; isCorrect: boolean };
    textAnswer?: string;
  }>;
  logs: Array<{
    id: number;
    type: string;
    description?: string;
    timestamp: string;
  }>;
}

export default function AcademicResults() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [sessions, setSessions] = useState<StudentSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExamId, setSelectedExamId] = useState<number | 'all'>('all');
  const [riskFilter, setRiskFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [selectedSession, setSelectedSession] = useState<StudentSession | null>(null);

  useEffect(() => {
    api.get<StudentSession[]>('/academic/results', token)
      .then(data => {
        setSessions(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [token]);

  // Unique exams list for filter dropdown
  const uniqueExams = Array.from(
    new Map(sessions.map(s => [s.exam.id, s.exam])).values()
  );

  const calculateScore = (session: StudentSession) => {
    const gradable = session.answers?.filter(a => a.question.type === 'MULTIPLE_CHOICE').length || 0;
    if (gradable === 0) return 100; // Açık uçlu sınavlar için varsayılan başarı oranı %100 veya nötr gösterilir
    const correctAnswers = session.answers.filter(a => a.option?.isCorrect).length;
    return Math.round((correctAnswers / gradable) * 100);
  };

  const getRiskLabel = (score: number) => {
    if (score >= 70) return { label: 'Yüksek', color: 'bg-rose-100 text-rose-700 border-rose-200' };
    if (score >= 40) return { label: 'Orta', color: 'bg-amber-100 text-amber-700 border-amber-200' };
    return { label: 'Düşük', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
  };

  const filteredSessions = sessions.filter(session => {
    const fullName = `${session.user.forename} ${session.user.surname}`.toLowerCase();
    const searchMatch = fullName.includes(searchQuery.toLowerCase()) || 
                        session.user.tc_kimlik.includes(searchQuery) ||
                        session.exam.title.toLowerCase().includes(searchQuery.toLowerCase());
    
    const examMatch = selectedExamId === 'all' || session.exam.id === selectedExamId;
    
    let riskMatch = true;
    if (riskFilter === 'high') riskMatch = session.riskScore >= 70;
    else if (riskFilter === 'medium') riskMatch = session.riskScore >= 40 && session.riskScore < 70;
    else if (riskFilter === 'low') riskMatch = session.riskScore < 40;

    return searchMatch && examMatch && riskMatch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Section */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm gap-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/akademisyen')} 
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 font-bold bg-slate-50 hover:bg-slate-100 px-3 py-2 rounded-xl border border-slate-200 transition-colors shrink-0"
          >
            <span className="material-symbols-outlined text-[14px]">arrow_back</span>
            Geri
          </button>
          <div>
            <h1 className="text-xl font-bold font-serif text-[#002147]">Öğrenci Sınav Sonuçları & Analizleri</h1>
            <p className="text-sm text-slate-500">Öğrencilerin sınav başarılarını ve yapay zeka kopya izleme raporlarını detaylı inceleyin.</p>
          </div>
        </div>
        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center border border-indigo-100 shrink-0 hidden sm:flex">
          <span className="material-symbols-outlined text-3xl">grading</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
          <input
            type="text"
            placeholder="Öğrenci Adı veya TC Kimlik..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 outline-none focus:border-indigo-500 text-sm"
          />
        </div>

        <div>
          <select
            value={selectedExamId}
            onChange={e => setSelectedExamId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            className="w-full px-4 py-2.5 rounded-lg border border-slate-200 outline-none focus:border-indigo-500 text-sm bg-white"
          >
            <option value="all">Tüm Sınavlar</option>
            {uniqueExams.map(exam => (
              <option key={exam.id} value={exam.id}>{exam.title}</option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={riskFilter}
            onChange={e => setRiskFilter(e.target.value as any)}
            className="w-full px-4 py-2.5 rounded-lg border border-slate-200 outline-none focus:border-indigo-500 text-sm bg-white"
          >
            <option value="all">Tüm Risk Seviyeleri</option>
            <option value="high">Yüksek Risk (&gt;= 70)</option>
            <option value="medium">Orta Risk (40 - 69)</option>
            <option value="low">Düşük Risk (&lt; 40)</option>
          </select>
        </div>

        <div className="flex items-center justify-end text-xs text-slate-500 font-bold">
          Bulunan Kayıt: {filteredSessions.length} / {sessions.length}
        </div>
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Table / List */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold border-b border-slate-200">
                <tr>
                  <th className="p-4">Öğrenci Bilgisi</th>
                  <th className="p-4">Sınav</th>
                  <th className="p-4 text-center">BaşarıSkor</th>
                  <th className="p-4 text-center">RiskSkor</th>
                  <th className="p-4 text-center">Durum</th>
                  <th className="p-4 text-right">Detay</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm text-slate-700">
                {filteredSessions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">Aranan kriterlere uygun sonuç bulunamadı.</td>
                  </tr>
                ) : (
                  filteredSessions.map(session => {
                    const score = calculateScore(session);
                    const risk = getRiskLabel(session.riskScore);
                    const isSelected = selectedSession?.id === session.id;

                    return (
                      <tr 
                        key={session.id} 
                        className={`hover:bg-slate-50 transition-colors cursor-pointer ${isSelected ? 'bg-indigo-50/50' : ''}`}
                        onClick={() => setSelectedSession(session)}
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold overflow-hidden">
                              {session.user.photo ? (
                                <img src={session.user.photo} alt="Avatar" className="w-full h-full object-cover" />
                              ) : (
                                <span>{(session.user.forename?.[0] || '?')}{(session.user.surname?.[0] || '')}</span>
                              )}
                            </div>
                            <div>
                              <div className="font-bold text-slate-800">{session.user.forename} {session.user.surname}</div>
                              <div className="text-[10px] text-slate-500 font-mono">{session.user.tc_kimlik}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 max-w-[200px] truncate">
                          <div className="font-medium text-slate-800">{session.exam.title}</div>
                          <div className="text-[10px] text-slate-400">
                            {new Date(session.startTime).toLocaleDateString('tr-TR')}
                          </div>
                        </td>
                        <td className="p-4 text-center font-bold text-slate-800">
                          <span className={`px-2 py-1 rounded text-xs ${
                            score >= 60 ? 'text-emerald-700 bg-emerald-50' :
                            score >= 45 ? 'text-amber-700 bg-amber-50' :
                            'text-rose-700 bg-rose-50'
                          }`}>
                            %{score}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${risk.color}`}>
                            {session.riskScore} ({risk.label})
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                            session.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                            session.status === 'ONGOING' ? 'bg-blue-100 text-blue-700 animate-pulse' :
                            'bg-slate-100 text-slate-500'
                          }`}>
                            {session.status === 'COMPLETED' ? 'Tamamlandı' : 'Devam Ediyor'}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <button 
                            className="text-indigo-600 hover:text-indigo-900 font-bold text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedSession(session);
                            }}
                          >
                            İncele
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Details Side Panel */}
        <div className="xl:col-span-1">
          {!selectedSession ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center h-full flex flex-col items-center justify-center text-slate-400">
              <span className="material-symbols-outlined text-5xl mb-2 text-slate-300">quick_reference_all</span>
              <p className="text-sm font-medium">Lütfen detaylarını incelemek istediğiniz öğrenci sınav oturumunu seçin.</p>
            </div>
          ) : (
            <div className="space-y-4">
              
              {/* Profile Card */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 relative overflow-hidden">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full border-2 border-indigo-100 overflow-hidden shrink-0">
                    {selectedSession.user.photo ? (
                      <img src={selectedSession.user.photo} alt="Student" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-500 text-lg font-bold">
                        {(selectedSession.user.forename?.[0] || '?')}{(selectedSession.user.surname?.[0] || '')}
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-base">{selectedSession.user.forename} {selectedSession.user.surname}</h3>
                    <p className="text-xs text-slate-500">{selectedSession.user.email}</p>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">TC: {selectedSession.user.tc_kimlik}</p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">Sınav Süresi</div>
                    <div className="text-sm font-bold text-slate-700">{selectedSession.exam.durationMin} dakika</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">Cevap Sayısı</div>
                    <div className="text-sm font-bold text-slate-700">{selectedSession.answers?.length || 0} soru</div>
                  </div>
                </div>
              </div>

              {/* Proctoring Violation Logs */}
              {selectedSession.exam.isSupervised && (
                <div className="bg-white rounded-2xl border border-rose-100 shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-rose-100 flex items-center justify-between">
                    <h3 className="font-bold text-rose-700 text-sm flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px]">policy</span>
                      AI Gözetmen İhlal Logları
                    </h3>
                    <span className="text-xs bg-rose-100 text-rose-700 font-bold px-2 py-0.5 rounded-full">
                      {selectedSession.logs?.length || 0} İhlal
                    </span>
                  </div>
                  <div className="divide-y divide-rose-50 max-h-60 overflow-y-auto">
                    {selectedSession.logs && selectedSession.logs.length > 0 ? (
                      selectedSession.logs.map(log => (
                        <div key={log.id} className="p-3 text-xs space-y-1 hover:bg-rose-50/30">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded text-[10px]">{log.type}</span>
                            <span className="text-slate-400 font-mono">{new Date(log.timestamp).toLocaleTimeString('tr-TR')}</span>
                          </div>
                          <p className="text-slate-600">{log.description || 'Açıklama belirtilmedi.'}</p>
                        </div>
                      ))
                    ) : (
                      <div className="p-6 text-center text-slate-400 text-xs">
                        Sınav süresince herhangi bir şüpheli davranış veya ihlal tespit edilmedi.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Answers details */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100">
                  <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">quiz</span>
                    Öğrencinin Verdiği Yanıtlar
                  </h3>
                </div>
                <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
                  {selectedSession.answers && selectedSession.answers.length > 0 ? (
                    selectedSession.answers.map((ans, idx) => {
                      const isCorrect = ans.option?.isCorrect;
                      const isOpenEnded = ans.question.type === 'OPEN_ENDED';
                      return (
                        <div key={ans.id} className="p-3.5 space-y-1 hover:bg-slate-50">
                          <div className="flex items-start gap-2">
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 mt-0.5 ${
                              isOpenEnded ? 'bg-blue-500' : isCorrect ? 'bg-emerald-500' : 'bg-rose-400'
                            }`}>
                              {idx + 1}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-slate-800 line-clamp-2">{ans.question.text}</p>
                              <div className="mt-1 text-[11px]">
                                <span className="text-slate-400">Verilen Cevap: </span>
                                <span className={`font-bold ${isOpenEnded ? 'text-blue-600' : isCorrect ? 'text-emerald-600' : 'text-rose-600'}`}>
                                  {ans.option?.text || ans.textAnswer || '—'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-6 text-center text-slate-400 text-xs">Öğrenci sınavı boş bırakmış veya yanıt kaydı bulunmuyor.</div>
                  )}
                </div>
              </div>

            </div>
          )}
        </div>

      </div>
    </div>
  );
}
