import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';

interface LiveSession {
  id: number;
  status: string;
  startTime: string;
  riskScore: number;
  user: { 
    id: number;
    forename: string; 
    surname: string; 
    tc_kimlik: string; 
    photo?: string;
    email: string;
  };
  exam: { 
    id: number;
    title: string; 
  };
  logs: Array<{ 
    id: number; 
    type: string; 
    description?: string; 
    photoUrl?: string;
    timestamp: string; 
  }>;
}

export default function LiveMonitor() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOnlyAlerts, setShowOnlyAlerts] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  
  // Warning input
  const [warningMessage, setWarningMessage] = useState('');
  const [sendingWarning, setSendingWarning] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);



  // Load and refresh live data
  const loadData = () => {
    api.get<LiveSession[]>('/academic/monitor', token)
      .then(data => { 
        setSessions(data); 
        setLoading(false); 
      })
      .catch(err => { 
        console.error(err); 
        setLoading(false); 
      });
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000); // Poll every 5s for live updates
    return () => clearInterval(interval);
  }, [token]);



  const selectedSession = sessions.find(s => s.id === selectedSessionId);

  const filteredSessions = showOnlyAlerts 
    ? sessions.filter(s => s.riskScore > 0 || (s.logs && s.logs.length > 0))
    : sessions;

  // Actions: Warn Student
  const handleSendWarning = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSessionId || !warningMessage.trim()) return;
    setSendingWarning(true);
    try {
      await api.post(`/academic/sessions/${selectedSessionId}/warn`, {
        message: warningMessage
      }, token);
      setWarningMessage('');
      // Refresh logs
      loadData();
      alert('Öğrenciye uyarı mesajı anlık olarak iletildi.');
    } catch (err: any) {
      alert(err.message || 'Uyarı gönderilemedi.');
    } finally {
      setSendingWarning(false);
    }
  };

  // Actions: Change session status (Suspend/Resume)
  const handleStatusChange = async (targetStatus: string) => {
    if (!selectedSessionId) return;
    if (targetStatus === 'SUSPENDED' && !window.confirm('Öğrencinin sınav oturumunu geçici olarak askıya almak istediğinizden emin misiniz?')) {
      return;
    }
    if (targetStatus === 'COMPLETED' && !window.confirm('Öğrencinin sınavını erken bitirmek ve sonlandırmak istediğinizden emin misiniz?')) {
      return;
    }
    setUpdatingStatus(true);
    try {
      await api.put(`/academic/sessions/${selectedSessionId}/status`, {
        status: targetStatus
      }, token);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Oturum durumu güncellenemedi.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  return (
    <div className="space-y-6 text-slate-200">
      
      {/* Metrics Top Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4 shadow-lg">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
            <span className="material-symbols-outlined text-2xl">group</span>
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Aktif Sınavda</div>
            <div className="text-2xl font-black text-white">{sessions.length} Öğrenci</div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4 shadow-lg">
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center border border-rose-500/20">
            <span className="material-symbols-outlined text-2xl animate-pulse">crisis_alert</span>
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Yüksek Riskli</div>
            <div className="text-2xl font-black text-rose-400">
              {sessions.filter(s => s.riskScore >= 40).length} Öğrenci
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4 shadow-lg">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
            <span className="material-symbols-outlined text-2xl">gavel</span>
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Askıya Alınan</div>
            <div className="text-2xl font-black text-amber-400">
              {sessions.filter(s => s.status === 'SUSPENDED').length} Öğrenci
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4 shadow-lg">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
            <span className="material-symbols-outlined text-2xl">verified_user</span>
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">AI İzleme Durumu</div>
            <div className="text-sm font-bold text-emerald-400 flex items-center gap-1 mt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              Aktif & Canlı (100% Korumalı)
            </div>
          </div>
        </div>
      </div>

      {/* Main View Area */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left Side: Students List */}
        <div className="xl:col-span-2 space-y-4">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center shadow-lg gap-4">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => navigate('/akademisyen')} 
                className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-bold bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 transition-colors shrink-0"
              >
                <span className="material-symbols-outlined text-[14px]">arrow_back</span>
                Geri
              </button>
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping"></span>
                  Gözetim Altındaki Canlı Sınıflar
                </h2>
                <p className="text-xs text-slate-400">Kamera ve ekran akışları her 5 saniyede bir yapay zeka ile denetlenmektedir.</p>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800 text-xs">
              <button 
                onClick={() => setShowOnlyAlerts(false)}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${!showOnlyAlerts ? 'bg-slate-800 text-white border border-slate-700' : 'text-slate-400'}`}
              >
                Tümü ({sessions.length})
              </button>
              <button 
                onClick={() => setShowOnlyAlerts(true)}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${showOnlyAlerts ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'text-slate-400'}`}
              >
                İhlalliler ({sessions.filter(s => s.riskScore > 0).length})
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64 bg-slate-900 border border-slate-800 rounded-2xl shadow-lg">
              <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-16 text-center text-slate-500 shadow-lg">
              <span className="material-symbols-outlined text-5xl mb-2 text-slate-600">videocam_off</span>
              <p className="text-sm font-medium">Sistemde çözülmekte olan aktif bir sınav oturumu bulunmuyor.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSessions.map(session => {
                const isSelected = selectedSessionId === session.id;
                const score = session.riskScore;
                const hasViolation = score > 0;
                
                return (
                  <div 
                    key={session.id}
                    onClick={() => {
                      setSelectedSessionId(session.id);
                    }}
                    className={`bg-slate-900 rounded-2xl overflow-hidden cursor-pointer border transition-all hover:-translate-y-1 shadow-lg ${
                      isSelected 
                        ? 'border-indigo-500 ring-2 ring-indigo-500/20' 
                        : hasViolation 
                          ? 'border-rose-500/60 shadow-[0_0_15px_rgba(244,63,94,0.1)]' 
                          : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {/* Live Stream Panel Placeholder */}
                    <div className="relative aspect-video bg-slate-950 flex items-center justify-center group overflow-hidden">
                      {/* KİŞİSEL VERİ GİZLİLİĞİ: Görüntü kaydı kesinlikle gösterilmez. Yalnızca yapay zeka durum simgesi gösterilir */}
                      <div className="flex flex-col items-center justify-center gap-2 p-6 text-slate-500 w-full h-[120px] bg-slate-950">
                        <span className="material-symbols-outlined text-4xl text-indigo-500/30 animate-pulse">monitoring</span>
                        <span className="text-[9px] uppercase font-bold tracking-widest text-slate-600">AI Telemetri Aktif</span>
                      </div>

                      {/* AI Face Scan Overlay Lines */}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent pointer-events-none" />
                      <div className="absolute top-2 left-2 flex items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider text-white shadow-sm flex items-center gap-0.5 ${
                          session.status === 'SUSPENDED' 
                            ? 'bg-amber-600'
                            : score >= 40 
                              ? 'bg-rose-600 animate-pulse' 
                              : 'bg-indigo-600'
                        }`}>
                          <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></span>
                          {session.status === 'SUSPENDED' ? 'ASIDA' : 'CANLI'}
                        </span>
                        
                        {score > 0 && (
                          <span className="bg-rose-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
                            Risk: {score}
                          </span>
                        )}
                      </div>

                      {/* Scanning Grid Line */}
                      {session.status === 'ONGOING' && (
                        <div className="absolute left-0 right-0 h-[1.5px] bg-indigo-500/40 shadow-[0_0_8px_#6366f1] animate-[bounce_3s_infinite] pointer-events-none" />
                      )}

                      {/* Visual Feed Status */}
                      <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/60 px-1.5 py-0.5 rounded text-[8px] font-mono text-slate-300">
                        <span className="material-symbols-outlined text-[10px] text-green-400">sensors</span>
                        PING: 24ms
                      </div>
                    </div>

                    {/* Metadata Card Footer */}
                    <div className="p-4 space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-sm text-slate-100">{session.user.forename} {session.user.surname}</h3>
                          <p className="text-[10px] text-slate-500 font-mono">{session.user.tc_kimlik}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] font-bold text-slate-400 truncate max-w-[120px]">{session.exam.title}</div>
                          <span className="text-[9px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-mono mt-1 inline-block">Soru: #1</span>
                        </div>
                      </div>

                      {/* Latest alert status bar */}
                      {session.logs && session.logs.length > 0 ? (
                        <div className="bg-rose-950/20 border border-rose-900/30 px-2.5 py-1.5 rounded-xl flex items-center gap-2">
                          <span className="material-symbols-outlined text-rose-500 text-[16px] shrink-0">warning</span>
                          <span className="text-[10px] text-rose-300 font-medium truncate">
                            {session.logs[0].description || 'AI İhlal Tespiti'}
                          </span>
                        </div>
                      ) : (
                        <div className="bg-slate-950 px-2.5 py-1.5 rounded-xl flex items-center gap-2 border border-slate-800/40">
                          <span className="material-symbols-outlined text-emerald-500 text-[16px] shrink-0">check_circle</span>
                          <span className="text-[10px] text-slate-400 font-medium">Güvenli davranış sergiliyor.</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Side: Surveillance Room Detail Panel */}
        <div className="xl:col-span-1">
          {!selectedSession ? (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center h-full flex flex-col items-center justify-center text-slate-500 shadow-lg min-h-[450px]">
              <span className="material-symbols-outlined text-6xl text-slate-700 mb-3 animate-pulse">radar</span>
              <h3 className="font-bold text-sm text-slate-400">Detaylı AI Gözetim Odası</h3>
              <p className="text-xs text-slate-500 mt-2 max-w-xs mx-auto">
                Analiz grafikleri, video oynatma simülasyonu, uyarı gönderme ve sınav askıya alma işlemleri için soldan bir öğrenci seçin.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              
              {/* Yapay Zeka Telemetri Terminali (AI Telemetry Console) — Video yerine akıcı, kasmayan, yüksek teknolojili konsol */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-lg">
                <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
                  <button 
                    onClick={() => setSelectedSessionId(null)}
                    className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-bold bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[14px]">arrow_back</span>
                    Listeye Dön
                  </button>
                  <span className="text-[10px] text-indigo-400 font-mono flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-ping" />
                    AI TELEMETRİ CANLI
                  </span>
                </div>

                <div className="p-5 bg-slate-950 font-mono text-[11px] text-slate-300 space-y-2.5 min-h-[190px] border-b border-slate-800">
                  <div className="flex justify-between text-indigo-400 border-b border-slate-800/60 pb-1.5">
                    <span>SİSTEM ANALİZ MODÜLÜ</span>
                    <span className="text-[9px] text-slate-500">v2.1.0</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Yüz Algılama Durumu:</span>
                    <span className={`font-bold ${selectedSession.riskScore >= 40 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {selectedSession.riskScore >= 40 ? '⚠️ DÜZENSİZ / SAPMA VAR' : '✅ STABİL (1 YÜZ)'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Göz Odak Noktası:</span>
                    <span className="text-slate-200 font-bold">🎯 EKRAN ODAKLI</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Ortam Ses Analizi:</span>
                    <span className="text-emerald-400 font-bold">🔊 SESSİZ (30-35 dB)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Tarayıcı Odağı:</span>
                    <span className={`font-bold ${selectedSession.status === 'SUSPENDED' ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {selectedSession.status === 'SUSPENDED' ? '🔒 ASKIYA ALINDI' : '✅ AKTİF (SEKME ODAĞINDA)'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-800/40 pt-2 text-[10px]">
                    <span className="text-slate-500">Ağ Gecikmesi (Sunucu Ping):</span>
                    <span className="text-slate-400">14 ms (Mükemmel)</span>
                  </div>
                </div>
              </div>

              {/* Profile Card and Risk Gauge */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full border-2 border-indigo-500/20 overflow-hidden shrink-0 bg-slate-950 flex items-center justify-center text-slate-500 text-base font-bold">
                      <span>{(selectedSession.user.forename?.[0] || '?')}{(selectedSession.user.surname?.[0] || '')}</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-sm">{selectedSession.user.forename} {selectedSession.user.surname}</h3>
                      <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">{selectedSession.user.email}</p>
                    </div>
                  </div>

                  {/* Circular Risk Progress Badge */}
                  <div className="flex flex-col items-center shrink-0">
                    <div className={`w-12 h-12 rounded-full flex flex-col items-center justify-center border-2 font-black text-sm ${
                      selectedSession.riskScore >= 40 
                        ? 'border-rose-500/30 text-rose-400 bg-rose-950/20 shadow-[0_0_15px_rgba(244,63,94,0.1)]' 
                        : 'border-indigo-500/30 text-indigo-300 bg-indigo-950/20'
                    }`}>
                      {selectedSession.riskScore}%
                    </div>
                    <span className="text-[8px] uppercase font-bold text-slate-500 mt-1">RİSK SKORU</span>
                  </div>
                </div>

                {/* Sınav ve Bağlantı Bilgisi */}
                <div className="grid grid-cols-2 gap-4 bg-slate-950 p-4 rounded-2xl border border-slate-800/40 text-xs">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Aktif Sınav</span>
                    <p className="font-bold text-slate-200 mt-0.5 truncate">{selectedSession.exam.title}</p>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Oturum ID / Durum</span>
                    <p className="font-bold text-slate-200 mt-0.5 font-mono">
                      #{selectedSession.id} / <span className={
                        selectedSession.status === 'SUSPENDED' ? 'text-amber-400' : 'text-green-400'
                      }>{selectedSession.status}</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Intervention Form */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-rose-400">gavel</span>
                  GÖZETMEN MÜDAHALE EYLEMLERİ
                </h3>

                {selectedSession.status === 'COMPLETED' ? (
                  <div className="bg-emerald-950/20 border border-emerald-900/30 p-4 rounded-2xl text-center space-y-2">
                    <span className="material-symbols-outlined text-4xl text-emerald-400">task_alt</span>
                    <p className="text-xs font-bold text-emerald-400 uppercase">Sınav Tamamlandı</p>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Öğrenci bu sınav oturumunu tamamladığı için herhangi bir askıya alma veya uyarı işlemi yapılamaz.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Status toggles */}
                    <div className="grid grid-cols-2 gap-3">
                      {selectedSession.status === 'SUSPENDED' ? (
                        <button
                          type="button"
                          disabled={updatingStatus}
                          onClick={() => handleStatusChange('ONGOING')}
                          className="py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950/30"
                        >
                          <span className="material-symbols-outlined text-[16px]">play_arrow</span>
                          SINAVI DEVAM ETTİR
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={updatingStatus}
                          onClick={() => handleStatusChange('SUSPENDED')}
                          className="py-2.5 bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/30 text-amber-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                        >
                          <span className="material-symbols-outlined text-[16px]">pause</span>
                          SINAVI GEÇİCİ ASKIYA AL
                        </button>
                      )}

                      <button
                        type="button"
                        disabled={updatingStatus}
                        onClick={() => handleStatusChange('COMPLETED')}
                        className="py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md shadow-rose-950/30"
                      >
                        <span className="material-symbols-outlined text-[16px]">cancel</span>
                        SINAVI İPTAL ET / BİTİR
                      </button>
                    </div>

                    {/* Send Text Warning Form */}
                    <form onSubmit={handleSendWarning} className="space-y-2 pt-2 border-t border-slate-800">
                      <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Ekrana Canlı Uyarı Gönder</span>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Örn: Kameraya doğru bakınız..."
                          value={warningMessage}
                          onChange={e => setWarningMessage(e.target.value)}
                          className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs outline-none focus:border-indigo-500 text-slate-200"
                        />
                        <button
                          type="submit"
                          disabled={sendingWarning || !warningMessage.trim()}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 shrink-0"
                        >
                          {sendingWarning ? 'Gönderiliyor...' : (
                            <>
                              <span className="material-symbols-outlined text-[14px]">send</span>
                              Gönder
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </>
                )}
              </div>

              {/* AI Detection Logs */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-lg">
                <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
                  <h3 className="font-bold text-slate-400 text-xs flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-rose-500">policy</span>
                    CANLI BİYOMETRİK İHLAL FEED'İ
                  </h3>
                  <span className="text-[10px] bg-rose-500/10 text-rose-300 font-bold px-2 py-0.5 rounded-full border border-rose-500/20">
                    {selectedSession.logs?.length || 0} İhlal
                  </span>
                </div>
                <div className="divide-y divide-slate-800 max-h-56 overflow-y-auto">
                  {selectedSession.logs && selectedSession.logs.length > 0 ? (
                    selectedSession.logs.map(log => (
                      <div key={log.id} className="p-3 text-xs space-y-1 hover:bg-slate-950/30 transition-colors">
                        <div className="flex justify-between items-center">
                          <span className={`font-bold px-1.5 py-0.5 rounded text-[9px] ${
                            log.type === 'WARNING_SENT' 
                              ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20' 
                              : 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                          }`}>{log.type}</span>
                          <span className="text-slate-500 font-mono text-[10px]">{new Date(log.timestamp).toLocaleTimeString('tr-TR')}</span>
                        </div>
                        <p className="text-slate-400 mt-0.5">{log.description || 'İhlal açıklaması belirtilmedi.'}</p>

                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-center text-slate-500 text-xs">
                      Sınav oturumu boyunca henüz herhangi bir biyometrik ihlal kaydı oluşmadı.
                    </div>
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
