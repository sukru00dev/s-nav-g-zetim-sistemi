import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';

interface Exam {
  id: number;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  durationMin: number;
  isSupervised: boolean;
  branchName: string;
  teacher?: { forename: string; surname: string };
}

interface ExamSession {
  id: number;
  examId: number;
  status: string;
  exam: { title: string };
  startTime: string;
}

export default function StudentOverview() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [exams, setExams] = useState<Exam[]>([]);
  const [pastSessions, setPastSessions] = useState<ExamSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState<number | null>(null);
  
  // Branch Filter State
  const [selectedBranch, setSelectedBranch] = useState<string>('all');

  useEffect(() => {
    Promise.all([
      api.get<Exam[]>('/users/me/exams', token),
      api.get<ExamSession[]>('/users/me/sessions', token).catch(() => [] as ExamSession[])
    ]).then(([examData, sessionData]) => {
      setExams(examData);
      setPastSessions(sessionData);
      setLoading(false);
    }).catch(err => { 
      console.error(err); 
      setLoading(false); 
    });
  }, [token]);

  const handleJoinExam = async (examId: number) => {
    setStarting(examId);
    try {
      const data = await api.post<{ session: { id: number } }>(
        `/exams/${examId}/session/start`,
        {},
        token
      );
      navigate(`/exam/${data.session.id}`);
    } catch (err: any) {
      console.error('Sınav başlatılamadı:', err);
      alert(err.message || 'Sınav başlatılamadı. Sınav süresi dışında veya zaten bitirmiş olabilirsiniz.');
    } finally {
      setStarting(null);
    }
  };

  const now = new Date();

  // Filter exams based on selected branch
  const filteredExams = selectedBranch === 'all' 
    ? exams 
    : exams.filter(e => e.branchName === selectedBranch);

  const activeExams = filteredExams.filter(e => {
    const start = new Date(e.startTime);
    const end = new Date(e.endTime);
    return now >= start && now <= end;
  });

  const upcomingExams = filteredExams.filter(e => new Date(e.startTime) > now);
  const completedSessions = pastSessions.filter(s => s.status === 'COMPLETED');

  // Extract unique branches student has exams in
  const uniqueBranches = Array.from(new Set(exams.map(e => e.branchName)));

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#002147] via-[#00306e] to-[#1c478c] rounded-2xl p-8 text-white relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="relative z-10">
          <p className="text-indigo-200 text-sm font-medium mb-1">Harran Üniversitesi Sınav Merkezi</p>
          <h1 className="text-3xl font-bold mb-2">{user?.forename} {user?.surname}</h1>
          <p className="text-slate-300 text-sm">Kayıtlı olduğunuz sınav programınızı buradan takip edebilirsiniz.</p>
        </div>
        <div className="grid grid-cols-3 gap-3 sm:gap-6 mt-6 relative z-10">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4 text-center border border-white/15">
            <div className="text-2xl sm:text-3xl font-bold text-[#fcd400]">{activeExams.length}</div>
            <div className="text-[9px] sm:text-[10px] text-indigo-200 uppercase font-bold tracking-wider mt-1">Aktif Sınav</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4 text-center border border-white/15">
            <div className="text-2xl sm:text-3xl font-bold text-amber-300">{upcomingExams.length}</div>
            <div className="text-[9px] sm:text-[10px] text-indigo-200 uppercase font-bold tracking-wider mt-1">Yaklaşan</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4 text-center border border-white/15">
            <div className="text-2xl sm:text-3xl font-bold text-emerald-300">{completedSessions.length}</div>
            <div className="text-[9px] sm:text-[10px] text-indigo-200 uppercase font-bold tracking-wider mt-1">Tamamlandı</div>
          </div>
        </div>
      </div>

      {/* Branch & Class Filtering Section */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
          <span className="material-symbols-outlined text-indigo-600">filter_alt</span>
          Ders & Şube Filtreleme
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedBranch('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
              selectedBranch === 'all'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-100'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            Tüm Dersler
          </button>
          {uniqueBranches.map(branch => (
            <button
              key={branch}
              onClick={() => setSelectedBranch(branch)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                selectedBranch === branch
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-100'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {branch}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Active Exams */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-bold text-slate-800 flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                Aktif Sınavlar
              </h2>
              <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-full">
                {activeExams.length} Adet
              </span>
            </div>
            <div className="divide-y divide-slate-100">
              {activeExams.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-sm">Seçili şubede şu anda aktif sınav bulunmamaktadır.</div>
              ) : activeExams.map(exam => {
                // Check if already completed
                const isCompleted = pastSessions.some(s => s.examId === exam.id && s.status === 'COMPLETED');
                return (
                  <div key={exam.id} className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-slate-800 truncate">{exam.title}</h3>
                        <p className="text-xs text-slate-500 mt-1">{exam.branchName}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="flex items-center gap-1 text-xs text-slate-500">
                            <span className="material-symbols-outlined text-[14px]">schedule</span>
                            {exam.durationMin} dk
                          </span>
                          {exam.isSupervised && (
                            <span className="flex items-center gap-1 text-xs text-rose-600 font-medium bg-rose-50 px-2 py-0.5 rounded-full">
                              <span className="material-symbols-outlined text-[14px]">videocam</span>
                              Gözetimli
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {isCompleted ? (
                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
                          Sınav Tamamlandı
                        </span>
                      ) : (
                        <button
                          onClick={() => handleJoinExam(exam.id)}
                          disabled={starting === exam.id}
                          className="shrink-0 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors flex items-center gap-2 shadow-md shadow-indigo-200"
                        >
                          {starting === exam.id ? (
                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <span className="material-symbols-outlined text-[18px]">play_circle</span>
                          )}
                          Sınava Gir
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Upcoming Exams */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-bold text-slate-800 flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-500 text-[18px]">event_upcoming</span>
                Yaklaşan Sınavlar
              </h2>
            </div>
            <div className="divide-y divide-slate-100">
              {upcomingExams.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-sm">Seçili şubede yaklaşan sınav bulunmuyor.</div>
              ) : upcomingExams.slice(0, 4).map(exam => (
                <div key={exam.id} className="p-5 flex items-center gap-4">
                  <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[18px]">quiz</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-800 text-sm truncate">{exam.title}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {new Date(exam.startTime).toLocaleString('tr-TR', { day:'numeric', month:'long', hour:'2-digit', minute:'2-digit' })}
                    </p>
                  </div>
                  <span className="text-xs text-slate-400">{exam.durationMin} dk</span>
                </div>
              ))}
            </div>
          </div>

          {/* Past/Completed Exams */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden lg:col-span-2">
            <div className="p-5 border-b border-slate-100">
              <h2 className="font-bold text-slate-800 flex items-center gap-2">
                <span className="material-symbols-outlined text-slate-400 text-[18px]">history</span>
                Sınav Geçmişim
              </h2>
            </div>
            <div className="divide-y divide-slate-100">
              {completedSessions.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm">
                  Henüz tamamlanmış bir sınav oturumunuz bulunmuyor.
                </div>
              ) : completedSessions.map(session => (
                <div key={session.id} className="p-5 flex items-center gap-4">
                  <div className="w-10 h-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[18px]">check_circle</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-800 text-sm">{session.exam.title}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {new Date(session.startTime).toLocaleString('tr-TR')}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full">Tamamlandı</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
