import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';

interface AcademicStats {
  totalExams: number;
  activeSessions: number;
  recentLogs: number;
}

interface Exam {
  id: number;
  title: string;
  startTime: string;
  endTime: string;
  durationMin: number;
  isSupervised: boolean;
  examSessions: Array<{ id: number; status: string }>;
  branch?: { name: string; course?: { code: string } };
}

interface LiveSession {
  id: number;
  user: { forename: string; surname: string; photo?: string };
  exam: { title: string };
  logs: Array<{ id: number; type: string }>;
}

export default function AcademicOverview() {
  const [stats, setStats] = useState<AcademicStats | null>(null);
  const [exams, setExams] = useState<Exam[]>([]);
  const [liveSessions, setLiveSessions] = useState<LiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const { token, user } = useAuth();

  const now = new Date();

  const load = useCallback(async () => {
    try {
      const [statsData, examsData, liveData] = await Promise.all([
        api.get<AcademicStats>('/academic/dashboard', token),
        api.get<Exam[]>('/exams', token),
        api.get<LiveSession[]>('/academic/monitor', token).catch(() => [] as LiveSession[])
      ]);
      setStats(statsData);
      setExams(examsData);
      setLiveSessions(liveData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 20000);
    return () => clearInterval(interval);
  }, [load]);

  const activeExams = exams.filter(e => new Date(e.startTime) <= now && new Date(e.endTime) >= now);
  const upcomingExams = exams.filter(e => new Date(e.startTime) > now).slice(0, 4);
  const pastExams = exams.filter(e => new Date(e.endTime) < now).slice(0, 3);

  const alertSessions = liveSessions.filter(s => s.logs && s.logs.length > 0);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#002147] via-[#00306e] to-[#0a4a8c] rounded-2xl p-7 text-white relative overflow-hidden shadow-xl">
        <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full translate-x-1/3 -translate-y-1/3 pointer-events-none" />
        <div className="absolute right-24 bottom-0 w-40 h-40 bg-amber-400/10 rounded-full translate-y-1/2 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <p className="text-indigo-300 text-sm font-medium mb-1 flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              Sistem Aktif
            </p>
            <h1 className="text-3xl font-bold mb-1">Hoş Geldiniz, {user?.forename} {user?.surname}</h1>
            <p className="text-indigo-200 text-sm">
              {new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              to="/akademisyen/exams"
              className="flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-[#002147] font-bold px-5 py-3 rounded-xl transition-all shadow-lg shadow-amber-900/30 text-sm"
            >
              <span className="material-symbols-outlined text-[18px]">add_circle</span>
              Yeni Sınav
            </Link>
            <Link
              to="/akademisyen/monitor"
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold px-5 py-3 rounded-xl transition-all border border-white/15 text-sm"
            >
              <span className="material-symbols-outlined text-[18px]">sensors</span>
              Canlı İzle
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Toplam Sınavım', value: loading ? '—' : (stats?.totalExams ?? 0), icon: 'quiz', color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100' },
          { label: 'Aktif Oturum', value: loading ? '—' : (stats?.activeSessions ?? 0), icon: 'sensors', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
          { label: 'Son 24s İhlal', value: loading ? '—' : (stats?.recentLogs ?? 0), icon: 'policy', color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100' },
          { label: 'Uyarılı Öğrenci', value: loading ? '—' : alertSessions.length, icon: 'warning', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
        ].map(card => (
          <div key={card.label} className={`bg-white rounded-2xl border ${card.border} shadow-sm p-5 flex items-center gap-4`}>
            <div className={`w-12 h-12 ${card.bg} ${card.color} rounded-xl flex items-center justify-center shrink-0`}>
              <span className="material-symbols-outlined text-2xl">{card.icon}</span>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">{card.label}</p>
              <h3 className={`text-3xl font-bold ${card.color} mt-0.5`}>{card.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Active Exams */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-slate-800 flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
              Şu An Aktif Sınavlar
              <span className="text-xs bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-full ml-1">{activeExams.length}</span>
            </h2>
            <Link to="/akademisyen/monitor" className="text-xs text-indigo-600 font-bold hover:underline flex items-center gap-1">
              Gözetim Sınıfı <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </Link>
          </div>
          {activeExams.length === 0 ? (
            <div className="p-10 text-center text-slate-400">
              <span className="material-symbols-outlined text-4xl block mb-2 text-slate-300">event_busy</span>
              <p className="text-sm">Şu an aktif sınav yok.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {activeExams.map(exam => {
                const ongoing = exam.examSessions?.filter(s => s.status === 'ONGOING').length || 0;
                const total = exam.examSessions?.length || 0;
                return (
                  <div key={exam.id} className="p-5 flex items-center gap-4">
                    <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[20px]">assignment</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-slate-800 truncate">{exam.title}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-slate-500">{exam.branch?.course?.code || exam.branch?.name || 'Genel'}</span>
                        <span className="text-xs text-slate-400">·</span>
                        <span className="text-xs text-slate-500">{exam.durationMin} dk</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-bold text-emerald-600">{ongoing} aktif</div>
                      <div className="text-xs text-slate-400">{total} toplam</div>
                    </div>
                    <Link
                      to="/akademisyen/monitor"
                      className="shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[14px]">visibility</span>
                      İzle
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Alert Panel */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-slate-800 flex items-center gap-2">
              <span className="material-symbols-outlined text-rose-500 text-[18px]">notifications_active</span>
              Uyarılar
            </h2>
            {alertSessions.length > 0 && (
              <span className="text-xs bg-rose-100 text-rose-700 font-bold px-2 py-0.5 rounded-full">{alertSessions.length}</span>
            )}
          </div>
          {alertSessions.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <span className="material-symbols-outlined text-4xl block mb-2 text-slate-300">check_circle</span>
              <p className="text-sm">Şu an ihlal yok.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
              {alertSessions.map(session => (
                <div key={session.id} className="p-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-rose-600 text-[16px]">person</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">{session.user.forename} {session.user.surname}</p>
                    <p className="text-xs text-rose-600 font-medium">{session.logs[0]?.type || 'İhlal'}</p>
                  </div>
                  <span className="text-xs bg-rose-50 text-rose-600 font-bold px-2 py-0.5 rounded-full border border-rose-100">
                    {session.logs.length}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Upcoming & Past Exams */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-slate-800 flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-500 text-[18px]">calendar_clock</span>
              Yaklaşan Sınavlar
            </h2>
            <Link to="/akademisyen/exams" className="text-xs text-indigo-600 font-bold hover:underline">Tümü →</Link>
          </div>
          <div className="divide-y divide-slate-100">
            {upcomingExams.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">Yaklaşan sınav yok.</div>
            ) : upcomingExams.map(exam => {
              const daysLeft = Math.ceil((new Date(exam.startTime).getTime() - now.getTime()) / 86400000);
              return (
                <div key={exam.id} className="p-4 flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm ${
                    daysLeft <= 1 ? 'bg-rose-100 text-rose-700' :
                    daysLeft <= 3 ? 'bg-amber-100 text-amber-700' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {daysLeft === 0 ? 'BU' : daysLeft}
                    {daysLeft > 0 && <span className="text-[8px] block -mt-0.5">GÜN</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-slate-800 truncate">{exam.title}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {new Date(exam.startTime).toLocaleString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  {exam.isSupervised && (
                    <span className="text-[10px] bg-indigo-50 text-indigo-600 font-bold px-2 py-0.5 rounded-full border border-indigo-100">AI</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Past Exams */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-slate-800 flex items-center gap-2">
              <span className="material-symbols-outlined text-slate-400 text-[18px]">history</span>
              Son Tamamlanan Sınavlar
            </h2>
            <Link to="/akademisyen/exams" className="text-xs text-indigo-600 font-bold hover:underline">Tümü →</Link>
          </div>
          <div className="divide-y divide-slate-100">
            {pastExams.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">Geçmiş sınav yok.</div>
            ) : pastExams.map(exam => {
              const completed = exam.examSessions?.filter(s => s.status === 'COMPLETED').length || 0;
              return (
                <div key={exam.id} className="p-4 flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-100 text-slate-500 rounded-xl flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[20px]">task_alt</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-slate-700 truncate">{exam.title}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {new Date(exam.endTime).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-bold text-slate-600">{completed}</div>
                    <div className="text-[10px] text-slate-400">katıldı</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h2 className="font-bold text-slate-800 mb-4">Hızlı İşlemler</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { to: '/akademisyen/exams', icon: 'add_box', label: 'Yeni Sınav Oluştur', color: 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100' },
            { to: '/akademisyen/monitor', icon: 'sensors', label: 'Gözetim Sınıfı', color: 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100' },
            { to: '/akademisyen/results', icon: 'bar_chart', label: 'Öğrenci Sonuçları', color: 'text-amber-600 bg-amber-50 hover:bg-amber-100' },
            { to: '/akademisyen/students', icon: 'group', label: 'Öğrencilerim', color: 'text-purple-600 bg-purple-50 hover:bg-purple-100' },
          ].map(action => (
            <Link
              key={action.to}
              to={action.to}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-all text-center group ${action.color}`}
            >
              <span className="material-symbols-outlined text-3xl group-hover:scale-110 transition-transform">{action.icon}</span>
              <span className="text-xs font-bold leading-tight">{action.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
