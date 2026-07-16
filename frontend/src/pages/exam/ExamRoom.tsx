import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Webcam from 'react-webcam';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';

// ──────────────────────────────────────────────
// MediaPipe Globals Declarations for TypeScript
// ──────────────────────────────────────────────
declare global {
  interface Window {
    FaceMesh: any;
    Camera: any;
    drawConnectors: any;
    FACEMESH_TESSELATION: any;
    FACEMESH_IRISES: any;
  }
}
import ConditionalQuestion from '../../components/exam/ConditionalQuestion';

// ──────────────────────────────────────────────
// Tipler
// ──────────────────────────────────────────────
interface Option { id: number; text: string; isCorrect?: boolean }
interface Question {
  id: number;
  text: string;
  type: 'MULTIPLE_CHOICE' | 'OPEN_ENDED' | 'CONDITIONAL';
  options: Option[];
}
interface ExamData {
  id: number;
  title: string;
  durationMin: number;
  isSupervised: boolean;
  questions: Question[];
}

type Status = 'loading-models' | 'ready' | 'in-progress' | 'finished' | 'error';

// ──────────────────────────────────────────────
// Yardımcı: Kalan süre hook'u
// ──────────────────────────────────────────────
function useCountdown(totalSeconds: number, onEnd: () => void) {
  const [remaining, setRemaining] = useState(totalSeconds);
  const remainingRef = useRef(totalSeconds);
  remainingRef.current = remaining;

  useEffect(() => {
    if (totalSeconds <= 0) return;
    // Her yeniden başlatmada sayacı sıfırla
    setRemaining(totalSeconds);
    remainingRef.current = totalSeconds;

    const t = setInterval(() => {
      const next = remainingRef.current - 1;
      setRemaining(next);
      remainingRef.current = next;
      if (next <= 0) { clearInterval(t); onEnd(); }
    }, 1000);
    return () => clearInterval(t);
  // onEnd referansı değişmemeli (useCallback ile tanımlanmalı), totalSeconds değişince yeniden başlat
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalSeconds]);

  const m = String(Math.floor(remaining / 60)).padStart(2, '0');
  const s = String(remaining % 60).padStart(2, '0');
  return { remaining, display: `${m}:${s}` };
}

// ──────────────────────────────────────────────
// Ana Bileşen
// ──────────────────────────────────────────────
export default function ExamRoom() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { token } = useAuth();

  // Sınav verisi
  const [examData, setExamData]           = useState<ExamData | null>(null);
  const [examId, setExamId]               = useState<number | null>(null);
  const [currentIndex, setCurrentIndex]   = useState(0);
  const [answers, setAnswers]             = useState<Record<number, number | string>>({});
  
  // Canlı durum ve Akademisyen Uyarı Takibi
  const [sessionStatus, setSessionStatus] = useState<string>('ONGOING');
  const [latestWarning, setLatestWarning] = useState<string | null>(null);
  const [showWarningModal, setShowWarningModal] = useState(false);

  // Gözetim
  const webcamRef    = useRef<Webcam>(null);
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const faceMeshRef  = useRef<any>(null);
  const cameraInstanceRef = useRef<any>(null);

  // Zaman Tabanlı İhlal Zamanlayıcı Refs
  const faceLostStartRef = useRef<number | null>(null);
  const multipleFacesStartRef = useRef<number | null>(null);
  const headTurnedStartRef = useRef<number | null>(null);
  const eyeWanderedStartRef = useRef<number | null>(null);

  // Kimlik Doğrulama Aşaması
  const [isIdentityVerified, setIsIdentityVerified] = useState(false);
  const isIdentityVerifiedRef = useRef(isIdentityVerified);
  useEffect(() => {
    isIdentityVerifiedRef.current = isIdentityVerified;
  }, [isIdentityVerified]);
  const [verificationProgress, setVerificationProgress] = useState(0);

  const [status, setStatus]               = useState<Status>('loading-models');
  const [warnings, setWarnings]           = useState<string[]>([]);
  const [faceOk, setFaceOk]              = useState(true);
  const [modelsLoaded, setModelsLoaded]   = useState(false);

  // Sınav bitirme
  const [finishing, setFinishing]         = useState(false);

  // Preflight Kontrolleri
  const [preflightCam, setPreflightCam]   = useState<'pending' | 'success' | 'failed'>('pending');
  const [preflightMic, setPreflightMic]   = useState<'pending' | 'success' | 'failed'>('pending');
  const [preflightPing, setPreflightPing] = useState<'pending' | 'success' | 'failed'>('pending');
  const [preflightVM, setPreflightVM]     = useState<'pending' | 'success' | 'failed'>('pending');
  const [pingVal, setPingVal]             = useState<number | null>(null);
  const [checking, setChecking]           = useState(false);

  // ── logEvent ve logEventRef Tanımlamaları (React Hoisting & Stale Closure Çözümü) ──
  const logEvent = useCallback(async (type: string, evStatus: string) => {
    if (!sessionId || !examData || !examData.questions || examData.questions.length === 0) return;
    const q = examData.questions[currentIndex] || examData.questions[0];
    if (!q || !q.id) return;

    // KİŞİSEL VERİ GÜVENLİĞİ: Görüntü kaydı kesinlikle alınmaz
    const photoUrl = null;

    try {
      await api.post('/biometrics/log', {
        sessionId: parseInt(sessionId),
        questionId: q.id,
        type,
        status: evStatus,
        photoUrl,
        screenshotUrl: photoUrl
      }, token);
    } catch { /* sessizce devam */ }
  }, [sessionId, examData, currentIndex, token]);

  const logEventRef = useRef(logEvent);
  useEffect(() => {
    logEventRef.current = logEvent;
  }, [logEvent]);

  const startPreflightCheck = async () => {
    setChecking(true);
    setPreflightCam('pending');
    setPreflightMic('pending');
    setPreflightPing('pending');
    setPreflightVM('pending');

    // 1. Kamera Kontrolü
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(t => t.stop());
      setPreflightCam('success');
    } catch {
      setPreflightCam('failed');
    }

    // 2. Mikrofon Kontrolü
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(t => t.stop());
      setPreflightMic('success');
    } catch {
      setPreflightMic('failed');
    }

    // 3. Ping Kontrolü — /ping endpoint'i kullan
    const t0 = performance.now();
    try {
      await api.get('/ping', null);
      const diff = Math.round(performance.now() - t0);
      setPingVal(diff);
      setPreflightPing('success');
    } catch {
      setPreflightPing('failed');
    }

    // 4. Sanal Makine (VM) & Otomasyon Tespiti (Hedef 2: Sınav Güvenliği)
    try {
      // 4a. Webdriver Kontrolü (Selenium, Puppeteer vb.)
      if (navigator.webdriver) {
        setPreflightVM('failed');
        setChecking(false);
        return;
      }

      // 4b. WebGL Renderer Analizi
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (gl) {
        const debugInfo = (gl as WebGLRenderingContext).getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
          const renderer = (gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL).toLowerCase();
          const vendor = (gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_VENDOR_WEBGL).toLowerCase();
          
          const vmKeywords = ['virtualbox', 'vmware', 'qemu', 'parallels', 'virtual', 'citrix', 'hyper-v'];
          const isVM = vmKeywords.some(keyword => renderer.includes(keyword) || vendor.includes(keyword));
          
          if (isVM) {
            setPreflightVM('failed');
            setChecking(false);
            return;
          }
        }
      }
      setPreflightVM('success');
    } catch {
      setPreflightVM('failed');
    }

    setChecking(false);
  };


  // ── Sınav verisini ve oturum bilgisini çek ──────────────────
  useEffect(() => {
    if (!sessionId) return;
    api.get<{ examId: number; status: string }>(`/exams/session/${sessionId}`, token)
      .then(session => {
        setExamId(session.examId);
        return api.get<ExamData>(`/exams/${session.examId}`, token);
      })
      .then(exam => {
        setExamData(exam);
        setStatus(exam.isSupervised ? 'loading-models' : 'ready');
      })
      .catch(err => {
        console.error('Sınav yüklenemedi:', err);
        setStatus('error');
      });
  }, [sessionId, token]);

  // ── MediaPipe Kütüphanelerinin Hazır Olmasını Bekle ─────────────────────────────
  useEffect(() => {
    if (!examData?.isSupervised) return;
    if (window.FaceMesh) {
      setModelsLoaded(true);
      setStatus('ready');
    } else {
      const checkInterval = setInterval(() => {
        if (window.FaceMesh) {
          setModelsLoaded(true);
          setStatus('ready');
          clearInterval(checkInterval);
        }
      }, 500);
      return () => clearInterval(checkInterval);
    }
  }, [examData?.isSupervised]);

  // ── Canlı oturum durumu ve uyarı takibi (Poller) ────────────
  useEffect(() => {
    if (status !== 'in-progress' || !sessionId) return;

    const pollSession = () => {
      api.get<{ status: string; logs: Array<{ id: number; description: string; timestamp: string }> }>(
        `/exams/session/${sessionId}`,
        token
      )
        .then(res => {
          setSessionStatus(res.status);
          if (res.logs && res.logs.length > 0) {
            const warning = res.logs[0];
            const storedWarningId = sessionStorage.getItem(`last-warning-${sessionId}`);
            if (storedWarningId !== String(warning.id)) {
              sessionStorage.setItem(`last-warning-${sessionId}`, String(warning.id));
              setLatestWarning(warning.description);
              setShowWarningModal(true);
            }
          }
        })
        .catch(err => console.error('Session polling error:', err));
    };

    pollSession();
    const interval = setInterval(pollSession, 4000);
    return () => clearInterval(interval);
  }, [status, sessionId, token]);



  // ── MediaPipe FaceMesh analiz döngüsü ───────────────────────────────────
  useEffect(() => {
    if (!modelsLoaded || status !== 'in-progress') return;

    const canvasElement = canvasRef.current;
    const canvasCtx = canvasElement?.getContext('2d');

    const onResults = (results: any) => {
      if (!canvasCtx || !canvasElement) return;

      canvasCtx.save();
      canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
      
      // Çizim işlemi (Ayna efekti olduğu için yatayda ters çevirip çizelim)
      canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

      try {
        const faceCount = results.multiFaceLandmarks ? results.multiFaceLandmarks.length : 0;

        // 1. Çoklu Yüz Kontrolü (Zaman tabanlı)
        if (faceCount > 1) {
          if (!multipleFacesStartRef.current) {
            multipleFacesStartRef.current = Date.now();
          } else if (Date.now() - multipleFacesStartRef.current >= 1000) {
            setFaceOk(false);
            addWarning('⚠️ Kamerada birden fazla kişi tespit edildi!');
            logEventRef.current('FACE', 'MULTIPLE_FACES');
            multipleFacesStartRef.current = Date.now(); // Tekrar log yağmurunu engellemek için zamanı güncelle
          }
        } else {
          multipleFacesStartRef.current = null;
        }

        // 2. Yüz Kaybolma Kontrolü (Zaman tabanlı)
        if (faceCount === 0) {
          if (!faceLostStartRef.current) {
            faceLostStartRef.current = Date.now();
          } else if (Date.now() - faceLostStartRef.current >= 2000) {
            setFaceOk(false);
            addWarning('⚠️ Yüzünüz kamerada görünmüyor!');
            logEventRef.current('FACE', 'NO_FACE');
            faceLostStartRef.current = Date.now(); // Zamanı güncelle
          }
        } else {
          faceLostStartRef.current = null;
        }

        // 3. Tek kişi varsa ve normal durumdaysa faceOk set edelim
        if (faceCount === 1) {
          setFaceOk(true);
        }

        // 4. Kimlik Doğrulama Aşaması
        if (!isIdentityVerifiedRef.current) {
          if (faceCount === 1) {
            setVerificationProgress(prev => {
              const next = prev + 2.5; // Yaklaşık 1.3-1.5 saniyede doğrulamayı tamamlar
              if (next >= 100) {
                setIsIdentityVerified(true);
                return 100;
              }
              return next;
            });
          }
          canvasCtx.restore();
          return;
        }

        // 5. Kafa ve Göz Takibi (Sadece tek kişi varken çalışsın)
        if (faceCount === 1) {
          const face = results.multiFaceLandmarks[0];

          // FaceMesh Çizimi (Yüz Ağı)
          if (window.drawConnectors) {
            if (window.FACEMESH_TESSELATION) {
              window.drawConnectors(canvasCtx, face, window.FACEMESH_TESSELATION, { 
                color: '#00FF0020', 
                lineWidth: 1 
              });
            }
            if (window.FACEMESH_IRISES) {
              window.drawConnectors(canvasCtx, face, window.FACEMESH_IRISES, { 
                color: '#FF0000', 
                lineWidth: 2 
              });
            }
          }

          // KAFA HAREKETİ HESAPLAMA (Burun - Yanak mesafeleri)
          const nose = face[1];
          const leftCheek = face[234];
          const rightCheek = face[454];
          const headRatio = Math.abs(rightCheek.x - nose.x) / (Math.abs(nose.x - leftCheek.x) + 0.0001);

          let isHeadTurned = false;
          let headDirection = "";

          if (headRatio > 1.5) {
            isHeadTurned = true;
            headDirection = "SOLA";
          } else if (headRatio < 0.6) {
            isHeadTurned = true;
            headDirection = "SAĞA";
          }

          if (isHeadTurned) {
            if (!headTurnedStartRef.current) {
              headTurnedStartRef.current = Date.now();
            } else if (Date.now() - headTurnedStartRef.current >= 1000) {
              addWarning(`⚠️ Başınızı çok fazla ${headDirection} yönüne çevirdiniz!`);
              logEventRef.current('EYE', 'LOOKING_AWAY');
              headTurnedStartRef.current = Date.now();
            }
          } else {
            headTurnedStartRef.current = null;
          }

          // GÖZ BAKMA HESAPLAMA (İris - Göz pınarı mesafesi)
          if (!isHeadTurned) {
            const leftEyeInner = face[133];
            const leftEyeOuter = face[33];
            const iris = face[468];
            const eyeWidth = Math.abs(leftEyeInner.x - leftEyeOuter.x);
            const irisPosition = Math.abs(iris.x - leftEyeOuter.x) / (eyeWidth + 0.0001);

            let isEyeWandering = false;
            let eyeDirection = "";

            if (irisPosition > 0.55) {
              isEyeWandering = true;
              eyeDirection = "SAĞA DIŞARI";
            } else if (irisPosition < 0.45) {
              isEyeWandering = true;
              eyeDirection = "SOLA DIŞARI";
            }

            if (isEyeWandering) {
              if (!eyeWanderedStartRef.current) {
                eyeWanderedStartRef.current = Date.now();
              } else if (Date.now() - eyeWanderedStartRef.current >= 1000) {
                addWarning(`⚠️ Göz odağınız ekran dışına (${eyeDirection}) kaydı!`);
                logEventRef.current('EYE', 'LOOKING_AWAY');
                eyeWanderedStartRef.current = Date.now();
              }
            } else {
              eyeWanderedStartRef.current = null;
            }
          } else {
            eyeWanderedStartRef.current = null;
          }
        }
      } catch (err) {
        console.warn("Yapay zeka analiz hatası:", err);
      }

      canvasCtx.restore();
    };

    // FaceMesh Modelini Kur
    const faceMesh = new window.FaceMesh({
      locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
    });

    faceMesh.setOptions({
      maxNumFaces: 2,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    faceMesh.onResults(onResults);
    faceMeshRef.current = faceMesh;

    // Kamera akışını bağla
    let camera: any = null;
    if (webcamRef.current?.video) {
      camera = new window.Camera(webcamRef.current.video, {
        onFrame: async () => {
          if (webcamRef.current?.video) {
            if (canvasElement && webcamRef.current.video.videoWidth) {
              canvasElement.width = webcamRef.current.video.videoWidth;
              canvasElement.height = webcamRef.current.video.videoHeight;
            }
            try {
              await faceMesh.send({ image: webcamRef.current.video });
            } catch (err) {
              // Hata yok sayılır
            }
          }
        },
        width: 640,
        height: 480
      });
      camera.start().catch((err: any) => {
        console.error("MediaPipe Kamera başlatılamadı:", err);
      });
      cameraInstanceRef.current = camera;
    }

    return () => {
      if (cameraInstanceRef.current) {
        try { cameraInstanceRef.current.stop(); } catch (e) {}
      }
      if (faceMeshRef.current) {
        try { faceMeshRef.current.close(); } catch (e) {}
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modelsLoaded, status]);

  // ── Web Audio API mikrofon analiz döngüsü (Ses Tespiti) ───────
  useEffect(() => {
    if (!examData?.isSupervised || status !== 'in-progress') return;

    let audioContext: AudioContext | null = null;
    let mediaStream: MediaStream | null = null;
    let interval: any = null;

    const startAudioAnalysis = async () => {
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        const source = audioContext.createMediaStreamSource(mediaStream);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 512;
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        let highAudioCounter = 0;

        interval = setInterval(() => {
          analyser.getByteTimeDomainData(dataArray);
          
          // RMS (Root Mean Square) genlik hesabı
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            const dev = (dataArray[i] - 128) / 128;
            sum += dev * dev;
          }
          const rms = Math.sqrt(sum / dataArray.length);

          // Eşik değeri 0.15'i aşarsa sayacı artır
          if (rms > 0.15) {
            highAudioCounter++;
            if (highAudioCounter >= 3) { // Ardışık 3 saniye yüksek ses
              addWarning('⚠️ Ortamda yüksek ses veya konuşma tespit edildi!');
              logEventRef.current('VOICE', 'VOICE_DETECTED');
              highAudioCounter = 0; // Sayacı sıfırla
            }
          } else {
            highAudioCounter = Math.max(0, highAudioCounter - 1);
          }
        }, 1000);

      } catch (err) {
        console.error('Mikrofon analizi başlatılamadı:', err);
      }
    };

    startAudioAnalysis();

    return () => {
      if (interval) clearInterval(interval);
      if (mediaStream) mediaStream.getTracks().forEach(track => track.stop());
      if (audioContext) audioContext.close();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, examData?.isSupervised]);


  // ── Sekme/pencere değiştirme ve Browser Lockdown tespiti ───────────────────
  useEffect(() => {
    if (status !== 'in-progress') return;

    const onVisibility = () => {
      if (document.hidden) {
        addWarning('⚠️ Sınav sekmesini terk ettiniz! Bu hareket kaydedildi.');
        logEventRef.current('SCREEN', 'TAB_SWITCH');
      }
    };

    const onContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      addWarning('⚠️ Sağ tık menüsü bu sınavda engellenmiştir!');
      logEventRef.current('SCREEN', 'LOCKDOWN_VIOLATION');
    };

    const onClipboard = (e: ClipboardEvent) => {
      e.preventDefault();
      addWarning('⚠️ Kopyalama, kesme ve yapıştırma işlemleri engellenmiştir!');
      logEventRef.current('SCREEN', 'LOCKDOWN_VIOLATION');
    };

    const onKeyDown = (e: KeyboardEvent) => {
      // F12 tuşu
      if (e.key === 'F12') {
        e.preventDefault();
        addWarning('⚠️ Geliştirici araçlarını açmak yasaktır!');
        logEventRef.current('SCREEN', 'LOCKDOWN_VIOLATION');
      }
      // Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C (Geliştirici konsolu kısayolları)
      if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) {
        e.preventDefault();
        addWarning('⚠️ Geliştirici araçlarını açmak yasaktır!');
        logEventRef.current('SCREEN', 'LOCKDOWN_VIOLATION');
      }
      // Ctrl+U (Sayfa kaynağını görüntüleme)
      if (e.ctrlKey && e.key === 'u') {
        e.preventDefault();
        addWarning('⚠️ Sayfa kaynağını görüntülemek yasaktır!');
        logEventRef.current('SCREEN', 'LOCKDOWN_VIOLATION');
      }
    };

    document.addEventListener('visibilitychange', onVisibility);
    document.addEventListener('contextmenu', onContextMenu);
    document.addEventListener('copy', onClipboard);
    document.addEventListener('cut', onClipboard);
    document.addEventListener('paste', onClipboard);
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      document.removeEventListener('contextmenu', onContextMenu);
      document.removeEventListener('copy', onClipboard);
      document.removeEventListener('cut', onClipboard);
      document.removeEventListener('paste', onClipboard);
      document.removeEventListener('keydown', onKeyDown);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  // ── Tek Giriş Sınırı: Ekranı Terk Etme ve Sonlandırma ───────────────────
  useEffect(() => {
    const handleUnload = () => {
      if (status === 'in-progress' && examId && sessionId) {
        const url = `${import.meta.env.VITE_API_URL ?? '/api'}/exams/${examId}/session/end`;
        const headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        };
        fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify({}),
          keepalive: true
        }).catch(() => {});
      }
    };

    window.addEventListener('beforeunload', handleUnload);
    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      if (status === 'in-progress') {
        handleUnload();
      }
    };
  }, [status, examId, sessionId, token]);

  // ── Yardımcı fonksiyonlar ───────────────────────────────────
  const addWarning = (msg: string) => setWarnings(prev => [msg, ...prev].slice(0, 10));

  // ── Yanıt kaydetme ─────────────────────────────────────────
  const handleAnswer = useCallback(async (questionId: number, value: number | string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
    if (!examId || !sessionId) return;
    try {
      await api.post(`/exams/${examId}/session/answer`, {
        questionId,
        examId,
        optionId: typeof value === 'number' ? value : undefined,
        textAnswer: typeof value === 'string' ? value : undefined,
      }, token);
    } catch (err) { console.error('Yanıt kaydedilemedi:', err); }
  }, [examId, sessionId, token]);

  // ── Sınavı bitir ───────────────────────────────────────────
  const handleFinish = useCallback(async () => {
    if (finishing || !examId) return;
    setFinishing(true);
    try {
      await api.post(`/exams/${examId}/session/end`, {}, token);
      setStatus('finished');
    } catch (err) {
      console.error('Sınav bitirilemedi:', err);
    } finally {
      setFinishing(false);
    }
  }, [finishing, examId, token]);

  // ── Zamanlayıcı: Sadece in-progress ve examData yüklenince başlat ─────
  // examData null iken hook çalışırsa 60 dk ile başlar — bunu önle
  const examDurationSeconds = status === 'in-progress' && examData ? examData.durationMin * 60 : 0;
  const { display: timeDisplay, remaining } = useCountdown(
    examDurationSeconds,
    handleFinish
  );

  // ──────────────────────────────────────────────────────────
  // RENDER: Askıya Alındı (Suspended)
  // ──────────────────────────────────────────────────────────
  if (sessionStatus === 'SUSPENDED') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-6">
        <div className="bg-slate-900 border border-amber-500 rounded-3xl p-10 max-w-md w-full text-center shadow-2xl space-y-4">
          <span className="material-symbols-outlined text-6xl text-amber-500 animate-pulse">pause_circle</span>
          <h1 className="text-2xl font-bold text-white">Sınavınız Duraklatıldı</h1>
          <p className="text-slate-400 text-sm">
            Sınav gözetmeniniz tarafından bu oturum askıya alınmıştır. Lütfen yönergelere uyunuz.
          </p>
          <div className="text-xs text-amber-400/80 font-mono bg-amber-950/20 border border-amber-900/30 p-3 rounded-xl">
            Durum: SUSPENDED (Geçici Askı)
          </div>
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────
  // RENDER: Yükleniyor
  // ──────────────────────────────────────────────────────────
  if (status === 'loading-models') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white gap-6">
        <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2">Gözetim Sistemi Başlatılıyor</h2>
          <p className="text-slate-400 text-sm">Yapay zeka modelleri yükleniyor, lütfen bekleyin...</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <div className="text-center">
          <span className="material-symbols-outlined text-6xl text-rose-500 mb-4 block">error</span>
          <h2 className="text-xl font-bold mb-2">Sınav yüklenemedi</h2>
          <button onClick={() => navigate('/ogrenci')} className="mt-4 px-6 py-2 bg-indigo-600 rounded-xl">
            Geri Dön
          </button>
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────
  // RENDER: Hazırlık & Pre-Flight Kontrol Ekranı
  // ──────────────────────────────────────────────────────────
  if (status === 'ready') {
    const isPreflightPassed = 
      !examData?.isSupervised || 
      (preflightCam === 'success' && preflightMic === 'success' && preflightPing === 'success' && preflightVM === 'success');

    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-700/60 rounded-3xl p-8 max-w-xl w-full shadow-2xl space-y-6">
          <div className="text-center">
            <span className="material-symbols-outlined text-5xl text-indigo-400 mb-2">fact_check</span>
            <h1 className="text-2xl font-bold text-white">{examData?.title}</h1>
            <p className="text-slate-400 text-sm mt-1">
              Süre: <span className="text-white font-bold">{examData?.durationMin} dakika</span>
              {examData?.isSupervised && ' · Gözetimli Oturum'}
            </p>
          </div>

          {examData?.isSupervised && (
            <>
              {/* Sistem / Donanım Kontrolü */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 space-y-4">
                <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px]">build</span>
                  Sınav Öncesi Donanım & Bağlantı Kontrolü
                </h3>

                <div className="space-y-3">
                  {/* Kamera */}
                  <div className="flex items-center justify-between bg-slate-900/40 p-3 rounded-xl border border-slate-800">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-slate-400 text-[20px]">videocam</span>
                      <span className="text-xs font-medium text-slate-300">Web Kamera Erişimi</span>
                    </div>
                    <div>
                      {preflightCam === 'success' && <span className="text-xs font-bold text-green-400 flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">check_circle</span>Hazır</span>}
                      {preflightCam === 'failed' && <span className="text-xs font-bold text-rose-400 flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">cancel</span>Hata</span>}
                      {preflightCam === 'pending' && <span className="text-xs font-bold text-slate-500">Bekleniyor</span>}
                    </div>
                  </div>

                  {/* Mikrofon */}
                  <div className="flex items-center justify-between bg-slate-900/40 p-3 rounded-xl border border-slate-800">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-slate-400 text-[20px]">mic</span>
                      <span className="text-xs font-medium text-slate-300">Ses Kayıt & Mikrofon</span>
                    </div>
                    <div>
                      {preflightMic === 'success' && <span className="text-xs font-bold text-green-400 flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">check_circle</span>Hazır</span>}
                      {preflightMic === 'failed' && <span className="text-xs font-bold text-rose-400 flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">cancel</span>Hata</span>}
                      {preflightMic === 'pending' && <span className="text-xs font-bold text-slate-500">Bekleniyor</span>}
                    </div>
                  </div>

                  {/* Ping / Sunucu */}
                  <div className="flex items-center justify-between bg-slate-900/40 p-3 rounded-xl border border-slate-800">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-slate-400 text-[20px]">wifi</span>
                      <span className="text-xs font-medium text-slate-300">Ağ Gecikmesi (Ping)</span>
                    </div>
                    <div>
                      {preflightPing === 'success' && <span className="text-xs font-bold text-green-400 flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">check_circle</span>{pingVal} ms</span>}
                      {preflightPing === 'failed' && <span className="text-xs font-bold text-rose-400 flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">cancel</span>Bağlanamadı</span>}
                      {preflightPing === 'pending' && <span className="text-xs font-bold text-slate-500">Bekleniyor</span>}
                    </div>
                  </div>

                  {/* Cihaz Güvenliği (Sanal Makine & Otomasyon Kontrolü) */}
                  <div className="flex items-center justify-between bg-slate-900/40 p-3 rounded-xl border border-slate-800">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-slate-400 text-[20px]">shield_person</span>
                      <span className="text-xs font-medium text-slate-300">Cihaz & İşletim Sistemi Güvenliği</span>
                    </div>
                    <div>
                      {preflightVM === 'success' && <span className="text-xs font-bold text-green-400 flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">verified_user</span>Güvenli</span>}
                      {preflightVM === 'failed' && <span className="text-xs font-bold text-rose-400 flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">gpp_bad</span>VM/Otomasyon Tespiti!</span>}
                      {preflightVM === 'pending' && <span className="text-xs font-bold text-slate-500">Bekleniyor</span>}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={startPreflightCheck}
                  disabled={checking}
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 rounded-xl text-xs font-bold transition-all border border-slate-700/60"
                >
                  {checking ? 'Donanımlar Test Ediliyor...' : 'Sistem Kontrolünü Başlat'}
                </button>
              </div>

              {/* Kurallar */}
              <div className="bg-rose-950/20 border border-rose-900/30 rounded-2xl p-5 text-left space-y-2.5">
                <p className="font-bold text-xs text-rose-400 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">security</span>
                  Gözetim & Güvenlik Politikası
                </p>
                <ul className="list-disc list-inside space-y-1 text-[11px] text-rose-300/80">
                  <li>Oturum süresince kameranız ve mikrofonunuz açık kalacaktır.</li>
                  <li>Sekme değiştirdiğinizde veya pencereyi küçülttüğünüzde ihlal kaydı oluşturulur.</li>
                  <li>Yapay zeka gözetimi yüz durumunuzu anlık analiz eder.</li>
                  <li>Sanal makine (VM) veya tarayıcı otomasyon araçları kullanılamaz.</li>
                </ul>
              </div>
            </>
          )}

          <button
            onClick={() => setStatus('in-progress')}
            disabled={!isPreflightPassed}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl text-sm transition-all shadow-lg shadow-indigo-900/40"
          >
            {isPreflightPassed ? 'Sınava Başla' : 'Lütfen Önce Donanım Kontrolünü Tamamlayın'}
          </button>
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────
  // RENDER: Sınav Tamamlandı
  // ──────────────────────────────────────────────────────────
  if (status === 'finished') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-700 rounded-3xl p-10 max-w-md w-full text-center shadow-2xl">
          <span className="material-symbols-outlined text-6xl text-green-400 mb-4 block">task_alt</span>
          <h1 className="text-2xl font-bold text-white mb-2">Sınav Tamamlandı!</h1>
          <p className="text-slate-400 text-sm mb-4">
            {Object.keys(answers).length}/{examData?.questions.length ?? 0} soruyu yanıtladınız.
          </p>
          <button onClick={() => navigate('/ogrenci')} className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl transition-colors">
            Panele Dön
          </button>
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────
  // RENDER: Sınav Aktif
  // ──────────────────────────────────────────────────────────
  const questions = examData?.questions ?? [];
  const currentQ  = questions[currentIndex];
  const totalQ    = questions.length;
  const progress  = totalQ > 0 ? ((currentIndex + 1) / totalQ) * 100 : 0;
  const isLast    = currentIndex === totalQ - 1;


  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Top Bar */}
      <header className="bg-slate-900 border-b border-slate-800 px-4 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="material-symbols-outlined text-indigo-400 text-[20px] sm:text-[24px]">quiz</span>
          <span className="font-bold text-xs sm:text-sm truncate max-w-[120px] sm:max-w-[200px]">{examData?.title}</span>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          {/* Soru sayacı */}
          <span className="text-xs text-slate-400 hidden sm:block">
            {currentIndex + 1} / {totalQ}
          </span>

          {/* Timer */}
          <div className={`flex items-center gap-1.5 sm:gap-2 font-mono font-bold text-sm sm:text-lg px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-lg sm:rounded-xl border ${
            remaining < 300 ? 'text-rose-400 border-rose-800 bg-rose-950/40 animate-pulse' : 'text-indigo-300 border-slate-700 bg-slate-800'
          }`}>
            <span className="material-symbols-outlined text-[16px] sm:text-[18px]">timer</span>
            {timeDisplay}
          </div>

          {/* Yüz durumu */}
          {examData?.isSupervised && (
            <div className={`flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs font-medium px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border ${
              faceOk ? 'text-green-400 border-green-800 bg-green-950/30' : 'text-rose-400 border-rose-800 bg-rose-950/30 animate-pulse'
            }`}>
              <span className="material-symbols-outlined text-[12px] sm:text-[14px]">{faceOk ? 'face' : 'face_retouching_off'}</span>
              <span className="hidden sm:inline">{faceOk ? 'Normal' : 'YÜZ YOK'}</span>
            </div>
          )}
        </div>
      </header>

      {/* Progress bar */}
      <div className="h-1 bg-slate-800">
        <div className="h-1 bg-indigo-500 transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>

      <div className="max-w-6xl mx-auto p-4 lg:p-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sol: Soru Alanı */}
        <div className="lg:col-span-2 space-y-4">
          {/* Soru Navigasyon Pills */}
          <div className="flex flex-wrap gap-2">
            {questions.map((q, i) => (
              <button
                key={q.id}
                onClick={() => setCurrentIndex(i)}
                className={`w-9 h-9 rounded-lg text-xs font-bold transition-all ${
                  i === currentIndex ? 'bg-indigo-600 text-white scale-110 shadow-lg shadow-indigo-900' :
                  answers[q.id] !== undefined ? 'bg-green-800 text-green-300 border border-green-700' :
                  'bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-700'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>

          {/* Soru Kartı */}
          {currentQ && (
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-lg">
              <div className="flex items-start gap-3 mb-6">
                <span className="bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full shrink-0">
                  {currentIndex + 1}
                </span>
                <p className="text-slate-100 font-medium leading-relaxed">{currentQ.text}</p>
              </div>

              {/* ÇOKTAN SEÇMELİ */}
              {currentQ.type === 'MULTIPLE_CHOICE' && (
                <div className="space-y-3">
                  {currentQ.options.map((opt, idx) => {
                    const selected = answers[currentQ.id] === opt.id;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => handleAnswer(currentQ.id, opt.id)}
                        className={`w-full text-left p-4 rounded-xl border transition-all ${
                          selected
                            ? 'border-indigo-500 bg-indigo-950/60 text-indigo-200 shadow-md shadow-indigo-900/40'
                            : 'border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-500 hover:bg-slate-750'
                        }`}
                      >
                        <span className={`font-bold mr-3 ${selected ? 'text-indigo-400' : 'text-slate-500'}`}>
                          {String.fromCharCode(65 + idx)})
                        </span>
                        {opt.text}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* AÇIK UÇLU */}
              {currentQ.type === 'OPEN_ENDED' && (
                <textarea
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-slate-200 placeholder-slate-500 resize-none outline-none focus:border-indigo-500 transition-colors min-h-[160px]"
                  placeholder="Yanıtınızı buraya yazın..."
                  value={typeof answers[currentQ.id] === 'string' ? answers[currentQ.id] as string : ''}
                  onChange={e => handleAnswer(currentQ.id, e.target.value)}
                />
              )}

              {/* ŞARTLI UÇLU */}
              {currentQ.type === 'CONDITIONAL' && (
                <div className="border border-slate-700 rounded-xl overflow-hidden">
                  <ConditionalQuestion
                    questionId={currentQ.id}
                    questionText={currentQ.text}
                    options={currentQ.options}
                    initialOptionId={typeof answers[currentQ.id] === 'number' ? answers[currentQ.id] as number : null}
                    onAnswer={(qId, optId) => handleAnswer(qId, optId)}
                  />
                </div>
              )}
            </div>
          )}

          {/* Navigasyon Butonları */}
          <div className="flex justify-between items-center pt-2">
            <button
              onClick={() => setCurrentIndex(i => Math.max(0, i - 1))}
              disabled={currentIndex === 0}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 rounded-xl border border-slate-700 font-medium transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              Önceki
            </button>

            {isLast ? (
              <button
                onClick={handleFinish}
                disabled={finishing}
                className="flex items-center gap-2 px-6 py-2.5 bg-green-600 hover:bg-green-500 disabled:opacity-60 text-white rounded-xl font-bold transition-colors shadow-lg shadow-green-900"
              >
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                {finishing ? 'Gönderiliyor...' : 'Sınavı Bitir'}
              </button>
            ) : (
              <button
                onClick={() => setCurrentIndex(i => Math.min(totalQ - 1, i + 1))}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-colors"
              >
                Sonraki
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            )}
          </div>
        </div>

        {/* Sağ: Gözetim Paneli */}
        <div className="space-y-4">
          {/* Kamera */}
          {examData?.isSupervised && (
            <div className={
              !isIdentityVerified 
                ? "fixed inset-0 bg-slate-950/95 z-50 flex flex-col items-center justify-center p-6 transition-all duration-1000 ease-in-out"
                : "bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-lg fixed bottom-4 right-4 w-32 sm:w-44 z-40 lg:relative lg:bottom-0 lg:right-0 lg:w-full lg:z-0 transition-all duration-1000 ease-in-out"
            }>
              {!isIdentityVerified ? (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-md p-6 text-center space-y-6">
                  <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">Kimlik Doğrulanıyor...</h2>
                    <p className="text-slate-400 text-sm max-w-sm">
                      Sınav güvenliğiniz için lütfen 3 saniye boyunca kameraya düz bir şekilde bakınız.
                    </p>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="w-64 h-2.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700 shadow-inner">
                    <div 
                      className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-150"
                      style={{ width: `${verificationProgress}%` }}
                    />
                  </div>
                  <span className="text-xs text-indigo-400 font-mono font-bold">
                    {Math.round(verificationProgress)}% Tamamlandı
                  </span>
                </div>
              ) : (
                <div className="hidden lg:flex items-center justify-between px-4 py-3 border-b border-slate-800">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-2">
                    <span className="w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
                    Canlı Gözetim
                  </span>
                </div>
              )}
              
              <div className="relative aspect-video bg-black w-full overflow-hidden">
                <Webcam
                  ref={webcamRef}
                  audio={false}
                  mirrored
                  className="w-full h-full object-cover"
                  videoConstraints={{ width: 640, height: 480 }}
                />
                <canvas
                  ref={canvasRef}
                  className="absolute inset-0 w-full h-full object-cover transform scale-x-[-1] pointer-events-none"
                />
                {!faceOk && (
                  <div className="absolute inset-0 border-2 lg:border-4 border-rose-500 animate-pulse pointer-events-none rounded-sm" />
                )}
              </div>
            </div>
          )}

          {/* Uyarılar */}
          <div className="bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-lg max-h-72 flex flex-col">
            <div className="px-4 py-3 border-b border-slate-800">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                Sistem Uyarıları ({warnings.length})
              </span>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-slate-800">
              {warnings.length === 0 ? (
                <div className="p-4 text-center text-slate-500 text-xs">
                  <span className="material-symbols-outlined block text-2xl mb-1 text-green-600">shield_check</span>
                  Herhangi bir ihlal tespit edilmedi.
                </div>
              ) : warnings.map((w, i) => (
                <div key={i} className="px-4 py-2.5 text-xs text-rose-300">
                  {w}
                </div>
              ))}
            </div>
          </div>

          {/* Yanıt özeti */}
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-4 shadow-lg">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Yanıt Durumu</div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex-1">
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-2 bg-green-500 rounded-full transition-all"
                    style={{ width: `${totalQ > 0 ? (Object.keys(answers).length / totalQ) * 100 : 0}%` }}
                  />
                </div>
              </div>
              <span className="text-slate-400 text-xs shrink-0">
                {Object.keys(answers).length}/{totalQ}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Gözetmen Canlı Uyarı Modalı */}
      {showWarningModal && latestWarning && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-rose-500 rounded-3xl p-8 max-w-md w-full text-center shadow-[0_0_50px_rgba(244,63,94,0.3)] space-y-6">
            <span className="material-symbols-outlined text-6xl text-rose-500 animate-bounce">warning</span>
            <div>
              <h2 className="text-xl font-bold text-rose-400 mb-1">GÖZETMEN UYARISI</h2>
              <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Sınav Güvenlik İhlali Bildirimi</p>
            </div>
            <div className="bg-rose-950/20 border border-rose-900/40 p-4 rounded-2xl text-rose-100 text-sm font-medium">
              {latestWarning.replace('Akademisyen uyarısı: ', '')}
            </div>
            <button
              onClick={() => setShowWarningModal(false)}
              className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-rose-900/40 text-xs"
            >
              UYARIYI OKUDUM VE ANLADIM
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
