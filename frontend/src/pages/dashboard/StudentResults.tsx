import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';

interface SessionResult {
  id: number;
  status: string;
  startTime: string;
  endTime?: string;
  riskScore: number;
  exam: {
    id: number;
    title: string;
    durationMin: number;
    isSupervised: boolean;
    branch?: { name: string };
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

export default function StudentResults() {
  const { token } = useAuth();
  const [sessions, setSessions] = useState<SessionResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<SessionResult | null>(null);

  useEffect(() => {
    api.get<SessionResult[]>('/users/me/sessions', token)
      .then(data => {
        setSessions(data);
        setLoading(false);
      })
      .catch(err => { console.error(err); setLoading(false); });
  }, [token]);

  const completedSessions = sessions.filter(s => s.status === 'COMPLETED');
  const totalCorrect = (s: SessionResult) =>
    s.answers?.filter(a => a.option?.isCorrect).length || 0;
  const totalAnswered = (s: SessionResult) => s.answers?.length || 0;
  const totalGradable = (s: SessionResult) =>
    s.answers?.filter(a => a.question.type === 'MULTIPLE_CHOICE').length || 0;

  const scorePercent = (s: SessionResult) => {
    const gradable = totalGradable(s);
    if (!gradable) return 100; // Açık uçlu sınavlar için varsayılan başarı oranı %100 veya nötr gösterilir
    return Math.round((totalCorrect(s) / gradable) * 100);
  };

  const getRiskBadge = (score: number) => {
    if (score >= 70) return { label: 'Yüksek Risk', color: 'bg-rose-100 text-rose-700 border-rose-200' };
    if (score >= 40) return { label: 'Orta Risk', color: 'bg-amber-100 text-amber-700 border-amber-200' };
    return { label: 'Düşük Risk', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#002147] to-[#1c478c] rounded-2xl p-6 text-white flex items-center justify-between shadow-xl">
        <div>
          <h1 className="text-2xl font-bold mb-1">Sınav Sonuçlarım</h1>
          <p className="text-indigo-200 text-sm">Tamamladığınız sınavların detaylı analizi</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-white/10 rounded-xl p-4 text-center min-w-[90px] border border-white/15">
            <div className="text-2xl font-bold text-emerald-300">{completedSessions.length}</div>
            <div className="text-[10px] text-indigo-200 uppercase font-bold tracking-wider mt-1">Tamamlanan</div>
          </div>
          <div className="bg-white/10 rounded-xl p-4 text-center min-w-[90px] border border-white/15">
            <div className="text-2xl font-bold text-amber-300">
              {completedSessions.length > 0
                ? Math.round(completedSessions.reduce((acc, s) => acc + scorePercent(s), 0) / completedSessions.length)
                : 0}%
            </div>
            <div className="text-[10px] text-indigo-200 uppercase font-bold tracking-wider mt-1">Ort. Başarı</div>
          </div>
        </div>
      </div>

      {completedSessions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-16 text-center">
          <span className="material-symbols-outlined text-6xl text-slate-300 mb-4 block">assignment</span>
          <h3 className="text-lg font-bold text-slate-600 mb-2">Henüz Tamamlanan Sınav Yok</h3>
          <p className="text-slate-400 text-sm">Sınavlarınızı tamamladıktan sonra sonuçlarınız burada görünecek.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Session List */}
          <div className="lg:col-span-1 space-y-3">
            <h2 className="font-bold text-slate-700 text-sm uppercase tracking-wider px-1">Sınavlarım</h2>
            {completedSessions.map(session => {
              const risk = getRiskBadge(session.riskScore || 0);
              const score = scorePercent(session);
              const isSelected = selectedSession?.id === session.id;
              return (
                <button
                  key={session.id}
                  onClick={() => setSelectedSession(session)}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    isSelected
                      ? 'bg-indigo-50 border-indigo-300 shadow-md shadow-indigo-100'
                      : 'bg-white border-slate-200 hover:border-indigo-200 hover:shadow-sm'
                  }`}
                >
                  <h3 className="font-bold text-slate-800 text-sm truncate mb-1">{session.exam.title}</h3>
                  <p className="text-xs text-slate-500 mb-2">
                    {new Date(session.startTime).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${score >= 60 ? 'bg-emerald-500' : score >= 40 ? 'bg-amber-500' : 'bg-rose-500'}`}
                          style={{ width: `${score}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-slate-700">{score}%</span>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${risk.color}`}>
                      {risk.label}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Session Detail */}
          <div className="lg:col-span-2">
            {!selectedSession ? (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm h-full flex items-center justify-center p-12 text-center">
                <div>
                  <span className="material-symbols-outlined text-5xl text-slate-300 mb-3 block">touch_app</span>
                  <p className="text-slate-500 font-medium">Detay görüntülemek için soldaki listeden bir sınav seçin</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Exam Header */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-bold text-slate-800 mb-1">{selectedSession.exam.title}</h2>
                      <p className="text-sm text-slate-500">
                        {new Date(selectedSession.startTime).toLocaleString('tr-TR')}
                        {selectedSession.endTime && ` — ${new Date(selectedSession.endTime).toLocaleString('tr-TR')}`}
                      </p>
                    </div>
                    {selectedSession.exam.isSupervised && (
                      <span className="flex items-center gap-1 text-xs font-bold bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-full border border-indigo-100">
                        <span className="material-symbols-outlined text-[14px]">videocam</span>
                        AI Gözetimli
                      </span>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-4 gap-3 mt-5">
                    <div className="bg-emerald-50 rounded-xl p-3 text-center border border-emerald-100">
                      <div className="text-2xl font-bold text-emerald-600">{scorePercent(selectedSession)}%</div>
                      <div className="text-[10px] text-emerald-700 uppercase font-bold tracking-wider mt-0.5">Başarı</div>
                    </div>
                    <div className="bg-indigo-50 rounded-xl p-3 text-center border border-indigo-100">
                      <div className="text-2xl font-bold text-indigo-600">{totalCorrect(selectedSession)}</div>
                      <div className="text-[10px] text-indigo-700 uppercase font-bold tracking-wider mt-0.5">Doğru</div>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3 text-center border border-slate-200">
                      <div className="text-2xl font-bold text-slate-600">{totalAnswered(selectedSession)}</div>
                      <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mt-0.5">Toplam</div>
                    </div>
                    <div className={`rounded-xl p-3 text-center border ${getRiskBadge(selectedSession.riskScore || 0).color}`}>
                      <div className="text-2xl font-bold">{selectedSession.riskScore || 0}</div>
                      <div className="text-[10px] uppercase font-bold tracking-wider mt-0.5">Risk Puan</div>
                    </div>
                  </div>
                </div>

                {/* Answers */}
                {selectedSession.answers && selectedSession.answers.length > 0 && (
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-slate-100">
                      <h3 className="font-bold text-slate-700">Yanıt Detayları</h3>
                    </div>
                    <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                      {selectedSession.answers.map((answer, i) => {
                        const isOpenEnded = answer.question.type === 'OPEN_ENDED';
                        return (
                          <div key={answer.id} className="p-4 flex items-start gap-3">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-white text-xs font-bold ${
                              isOpenEnded
                                ? 'bg-blue-500'
                                : answer.option?.isCorrect ? 'bg-emerald-500' : 'bg-rose-400'
                            }`}>
                              {isOpenEnded
                                ? <span className="material-symbols-outlined text-[14px]">rate_review</span>
                                : answer.option?.isCorrect
                                  ? <span className="material-symbols-outlined text-[14px]">check</span>
                                  : <span className="material-symbols-outlined text-[14px]">close</span>}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-slate-700 font-medium truncate">S{i + 1}: {answer.question.text}</p>
                              <p className="text-xs text-slate-500 mt-0.5">
                                Cevabınız: {answer.option?.text || answer.textAnswer || '—'}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Violation Logs */}
                {selectedSession.logs && selectedSession.logs.length > 0 && (
                  <div className="bg-white rounded-2xl border border-rose-100 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-rose-100 flex items-center gap-2">
                      <span className="material-symbols-outlined text-rose-500 text-[18px]">warning</span>
                      <h3 className="font-bold text-rose-700 text-sm">Tespit Edilen İhlaller</h3>
                      <span className="ml-auto text-xs bg-rose-100 text-rose-600 font-bold px-2 py-0.5 rounded-full">
                        {selectedSession.logs.length} adet
                      </span>
                    </div>
                    <div className="divide-y divide-rose-50">
                      {selectedSession.logs.slice(0, 5).map(log => (
                        <div key={log.id} className="p-3 flex items-center gap-3 text-sm">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            log.type === 'NO_FACE' ? 'bg-red-100 text-red-700' :
                            log.type === 'MULTIPLE_FACES' ? 'bg-orange-100 text-orange-700' :
                            log.type === 'TAB_SWITCH' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-slate-100 text-slate-600'
                          }`}>{log.type}</span>
                          <span className="text-slate-500 text-xs flex-1">{log.description || '—'}</span>
                          <span className="text-slate-400 text-[10px]">{new Date(log.timestamp).toLocaleTimeString('tr-TR')}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
