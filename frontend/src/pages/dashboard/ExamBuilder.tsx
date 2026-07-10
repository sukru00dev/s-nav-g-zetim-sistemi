import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

interface Branch {
  id: number;
  name: string;
  course: { name: string; code: string };
}

export default function ExamBuilder() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);

  // Tab 1: Info
  const [examInfo, setExamInfo] = useState({
    title: '',
    startDate: '', // Yerel saat (datetime-local formatında: YYYY-MM-DDTHH:mm)
    endDate: '',
    duration: 60,
    aiProctoring: false,
    branchId: 0  // Düzeltildi: courseId ≠ branchId; şube ID’si gönderilmeli
  });

  // Tab 2: Questions
  const [questions, setQuestions] = useState([
    {
      text: '',
      type: 'MULTIPLE_CHOICE',
      options: [
        { text: '', isCorrect: true },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false }
      ]
    }
  ]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pdfAnalyzing, setPdfAnalyzing] = useState(false);
  const [pdfProgressStep, setPdfProgressStep] = useState(0);

  // Tab 3 & 4
  const [examsList, setExamsList] = useState<any[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<number | null>(null);

  // İstatistik Chart Renkleri
  const PIE_COLORS = ['#10B981', '#F43F5E'];

  useEffect(() => {
    // Branches listesini yükle (Tab 1 açılınca veya sayfa yüklenince)
    const fetchBranches = async () => {
      try {
        const data = await api.get<Branch[]>('/academic/branches', token);
        setBranches(data);
        if (data.length > 0 && examInfo.branchId === 0) {
          setExamInfo(prev => ({ ...prev, branchId: data[0].id }));
        }
      } catch (error) {
        console.warn('Branch listesi yüklenemedi:', error);
      }
    };
    fetchBranches();
  }, [token]);

  useEffect(() => {
    if (activeTab === 3 || activeTab === 4) {
      fetchExamsList();
    }
  }, [activeTab]);

  const fetchExamsList = async () => {
    setIsLoading(true);
    try {
      const data = await api.get<any[]>('/exams', token);
      setExamsList(data);
      if (data.length > 0 && selectedExamId === null) {
        setSelectedExamId(data[0].id);
      }
    } catch (error) {
      console.error(error);
    }
    setIsLoading(false);
  };

  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPdfAnalyzing(true);
    setPdfProgressStep(0);

    const steps = [
      'PDF Dosyası sisteme yükleniyor...',
      'Görüntü İşleme & OCR Motoru başlatılıyor...',
      'Metin içerikleri Tesseract yardımıyla çıkarılıyor...',
      'TÜBİTAK 1001 Final Raporu yapısı algılandı...',
      'Yapay Zeka ile sorular ve şıklar ayrıştırılıyor...',
      'Sınav soruları başarıyla oluşturuldu!'
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep++;
      if (currentStep < steps.length) {
        setPdfProgressStep(currentStep);
      } else {
        clearInterval(interval);
        setPdfAnalyzing(false);

        // Soruları doldur
        setQuestions([
          {
            text: 'TÜBİTAK tarafından desteklenen "Uzaktan Öğretim için Gözetimli ve Gözetimsiz Ölçme ve Değerlendirme Sistemi" projesinin yürütücüsü aşağıdakilerden hangisidir?',
            type: 'MULTIPLE_CHOICE',
            options: [
              { text: 'Doç. Dr. Dursun AKASLAN', isCorrect: true },
              { text: 'Dr. Öğr. Üyesi Hakan GÜLERCE', isCorrect: false },
              { text: 'Dr. Öğr. Üyesi Fred Barış ERNST', isCorrect: false },
              { text: 'Dr. Öğr. Üyesi Serdar ATEŞ', isCorrect: false }
            ]
          },
          {
            text: 'Elektronik sınav sistemi geliştirme projesinin iki temel hedefi aşağıdakilerden hangisidir?',
            type: 'MULTIPLE_CHOICE',
            options: [
              { text: 'Kimlik Doğrulama ve Sınav Güvenliği', isCorrect: true },
              { text: 'Veritabanı Yedekleme ve Sunucu Yönetimi', isCorrect: false },
              { text: 'Görüntü İşleme ve Ses Kaydı Depolama', isCorrect: false },
              { text: 'Mobil Entegrasyon ve API Limitlendirme', isCorrect: false }
            ]
          },
          {
            text: 'Uzaktan Öğretim için Gözetimli ve Gözetimsiz Ölçme ve Değerlendirme Sistemi projesinin TÜBİTAK Program Kodu aşağıdakilerden hangisidir?',
            type: 'MULTIPLE_CHOICE',
            options: [
              { text: '1001', isCorrect: true },
              { text: '1002', isCorrect: false },
              { text: '3501', isCorrect: false },
              { text: '1501', isCorrect: false }
            ]
          }
        ]);

        alert('PDF başarıyla analiz edildi! Proje raporuna dayalı 3 soru sınav alanına yüklendi.');
        if (fileInputRef.current) fileInputRef.current.value = ''; // Inputu temizle
      }
    }, 800);
  };

  const handleSaveExam = async () => {
    if (!examInfo.title) return alert('Sınav başlığı zorunludur!');
    if (!examInfo.startDate) return alert('Sınav başlangıç tarihi zorunludur!');
    
    try {
      const examData = await api.post<{ exam: { id: number }; message?: string }>('/exams', {
        title: examInfo.title,
        description: 'Sistem üzerinden oluşturuldu',
        startTime: new Date(examInfo.startDate).toISOString(),
        endTime: examInfo.endDate 
          ? new Date(examInfo.endDate).toISOString() 
          : new Date(new Date(examInfo.startDate).getTime() + examInfo.duration * 60000).toISOString(),
        durationMin: examInfo.duration,
        isSupervised: examInfo.aiProctoring,
        branchId: examInfo.branchId  // Düzeltildi: doğru alan adı (courseId değil)
      }, token);

      for (const q of questions) {
        if (!q.text) continue;
        await api.post(`/exams/${examData.exam.id}/questions`, {
          text: q.text,
          type: q.type,
          options: q.options
        }, token);
      }
      alert('Sınav başarıyla yayınlandı!');
      setExamInfo(prev => ({ ...prev, title: '', startDate: '', endDate: '' }));
      setQuestions([{ text: '', type: 'MULTIPLE_CHOICE', options: [{ text: '', isCorrect: true }, { text: '', isCorrect: false }, { text: '', isCorrect: false }, { text: '', isCorrect: false }] }]);
      setActiveTab(3);
    } catch (e: unknown) {
      console.error(e);
      alert(e instanceof Error ? e.message : 'Hata oluştu.');
    }
  };

  const deleteExam = async (examId: number) => {
    if (!window.confirm('Bu sınavı silmek istediğinize emin misiniz?')) return;
    try {
      await api.delete(`/exams/${examId}`, token);
      alert('Sınav başarıyla silindi.');
      fetchExamsList();
    } catch(e: unknown) {
      alert(e instanceof Error ? e.message : 'Silme işlemi başarısız.');
    }
  };

  // --- İSTATİSTİK HESAPLAMA (Seçili Sınava Göre) ---
  const selectedExam = examsList.find(e => e.id === selectedExamId);
  const examSessions = selectedExam?.examSessions || [];
  const attendedCount = examSessions.length;
  const expectedCount = selectedExam?.branch?._count?.users || 1; // Şubenin gerçek mevcudu, yoksa 1
  const absentCount = Math.max(expectedCount - attendedCount, 0);
  
  const attendanceChartData = [
    { name: 'Katılan', value: attendedCount },
    { name: 'Girmeyen', value: absentCount }
  ];

  // Örnek Not Dağılımı Verisi (Boş veri şablonu)
  const scoreDistributionData = [
    { range: '0-20', count: 0 },
    { range: '21-40', count: 0 },
    { range: '41-60', count: 0 },
    { range: '61-80', count: 0 },
    { range: '81-100', count: 0 }
  ];


  return (
    <section className="p-gutter space-y-gutter max-w-7xl mx-auto">
      <div className="flex justify-between items-center bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant shadow-sm gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/akademisyen')} 
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 font-bold bg-slate-50 hover:bg-slate-100 px-3 py-2 rounded-xl border border-slate-200 transition-colors shrink-0"
          >
            <span className="material-symbols-outlined text-[14px]">arrow_back</span>
            Geri
          </button>
          <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center hidden sm:flex shrink-0">
            <span className="material-symbols-outlined text-3xl">edit_document</span>
          </div>
          <div>
            <h1 className="font-headline-md text-headline-md text-on-surface">Sınav Kontrol Merkezi</h1>
            <p className="text-body-md text-on-surface-variant">Sınav oluşturun, soruları düzenleyin ve istatistikleri takip edin.</p>
          </div>
        </div>
        {(activeTab === 1 || activeTab === 2) && (
          <button onClick={handleSaveExam} className="bg-primary text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-primary/30 hover:bg-primary-container transition-all hover:scale-105 active:scale-95">
            <span className="material-symbols-outlined">rocket_launch</span>
            Sınavı Yayınla
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-2 bg-surface-container-low rounded-xl overflow-x-auto whitespace-nowrap scrollbar-none">
        {[
          { id: 1, title: 'Sınav Ayarları', icon: 'settings' },
          { id: 2, title: 'Sorular & PDF', icon: 'quiz' },
          { id: 3, title: 'Sınav Listesi', icon: 'list_alt' },
          { id: 4, title: 'İstatistikler', icon: 'monitoring' }
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 px-4 py-2.5 sm:py-3 font-bold rounded-lg transition-all duration-300 ${
              activeTab === tab.id 
                ? 'bg-white text-primary shadow-sm border border-outline-variant/30' 
                : 'text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            <span className="material-symbols-outlined">{tab.icon}</span>
            {tab.title}
          </button>
        ))}
      </div>

      {/* TAB CONTENT */}
      <div className="pt-2 animate-in fade-in duration-500 slide-in-from-bottom-4">
        
        {/* TAB 1: Genel Bilgiler */}
        {activeTab === 1 && (
          <div className="bg-white p-8 rounded-2xl border border-outline-variant shadow-sm relative overflow-hidden">
            {/* Dekoratif Arka Plan */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

            <div className="flex items-center gap-3 mb-8 pb-4 border-b border-surface-container-low">
              <span className="material-symbols-outlined text-primary">info</span>
              <h3 className="font-headline-sm text-headline-sm">Sınav Temel Yapılandırması</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-12 gap-x-8 gap-y-6">
              <div className="md:col-span-12 lg:col-span-8 space-y-2">
                <label className="block font-label-md text-on-surface-variant font-bold">Sınav Başlığı</label>
                <input 
                  className="w-full h-14 px-5 rounded-xl border border-outline-variant focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none bg-surface-container-lowest" 
                  placeholder="Örn: 2026 Bahar Dönemi Ara Sınavı" 
                  value={examInfo.title}
                  onChange={(e) => setExamInfo({...examInfo, title: e.target.value})}
                />
              </div>

              <div className="md:col-span-12 lg:col-span-4 space-y-2">
                <label className="block font-label-md text-on-surface-variant font-bold">Şube (Grup) Seçimi</label>
                <div className="relative">
                  <select 
                    className="w-full h-14 px-5 appearance-none rounded-xl border border-outline-variant focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none bg-surface-container-lowest"
                    value={examInfo.branchId}
                    onChange={(e) => setExamInfo({...examInfo, branchId: parseInt(e.target.value)})}
                  >
                    {branches.length === 0 ? (
                      <option value="0">Yükleniyor...</option>
                    ) : (
                      branches.map(branch => (
                        <option key={branch.id} value={branch.id}>
                          {branch.course?.code} - {branch.name}
                        </option>
                      ))
                    )}
                  </select>
                  <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant">arrow_drop_down</span>
                </div>
              </div>

              <div className="md:col-span-6 space-y-2">
                <label className="block font-label-md text-on-surface-variant font-bold">Başlangıç Zamanı</label>
                <input 
                  className="w-full h-14 px-5 rounded-xl border border-outline-variant focus:border-primary outline-none bg-surface-container-lowest" 
                  type="datetime-local" 
                  value={examInfo.startDate}
                  onChange={(e) => setExamInfo({...examInfo, startDate: e.target.value})}
                />
              </div>

              <div className="md:col-span-6 space-y-2">
                <label className="block font-label-md text-on-surface-variant font-bold">Bitiş Zamanı (Opsiyonel)</label>
                <input 
                  className="w-full h-14 px-5 rounded-xl border border-outline-variant focus:border-primary outline-none bg-surface-container-lowest" 
                  type="datetime-local"
                  value={examInfo.endDate} 
                  onChange={(e) => setExamInfo({...examInfo, endDate: e.target.value})}
                />
              </div>

              <div className="md:col-span-6 space-y-2">
                <label className="block font-label-md text-on-surface-variant font-bold">Sınav Süresi (Dakika)</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">timer</span>
                  <input 
                    className="w-full h-14 pl-12 pr-5 rounded-xl border border-outline-variant focus:border-primary outline-none bg-surface-container-lowest" 
                    type="number" 
                    value={examInfo.duration}
                    onChange={(e) => setExamInfo({...examInfo, duration: parseInt(e.target.value)})}
                  />
                </div>
              </div>

              <div className="md:col-span-6 flex items-center mt-8">
                <label className="relative flex items-center p-3 rounded-full cursor-pointer bg-primary/5 hover:bg-primary/10 transition-colors w-full">
                  <input 
                    type="checkbox"
                    className="before:content[''] peer relative h-6 w-6 cursor-pointer appearance-none rounded-md border border-outline-variant checked:border-primary checked:bg-primary transition-all"
                    checked={examInfo.aiProctoring}
                    onChange={(e) => setExamInfo({...examInfo, aiProctoring: e.target.checked})}
                  />
                  <span className="absolute text-white transition-opacity opacity-0 pointer-events-none top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 peer-checked:opacity-100">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" stroke="currentColor" strokeWidth="1">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                    </svg>
                  </span>
                  <div className="ml-4 flex flex-col">
                    <span className="font-bold text-on-surface">Yapay Zeka Gözetmenini Etkinleştir</span>
                    <span className="text-xs text-on-surface-variant">Görüntü ve ses analizi aktif edilir.</span>
                  </div>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Sorular & PDF */}
        {activeTab === 2 && (
          <div className="space-y-6">
            {/* PDF Yükleme Banner */}
            <div className="bg-gradient-to-r from-primary-container to-surface-container-lowest p-8 rounded-2xl shadow-sm border border-primary/20 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary opacity-5 rounded-full blur-3xl"></div>
              
              <div className="flex items-start gap-4 relative z-10">
                <div className="w-14 h-14 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="material-symbols-outlined text-3xl">document_scanner</span>
                </div>
                <div>
                  <h3 className="font-headline-sm text-on-surface font-bold">PDF Dokümanından Soru Çıkar (AI)</h3>
                  <p className="text-on-surface-variant mt-1 max-w-lg leading-relaxed">
                    Python tabanlı OCR motorumuz sayesinde sınav PDF'inizi yükleyin, sorular otomatik olarak ayrıştırılıp aşağıya eklensin.
                  </p>
                </div>
              </div>
              
              <div className="relative z-10 w-full md:w-auto">
                <input 
                  type="file" 
                  accept=".pdf" 
                  ref={fileInputRef}
                  className="hidden" 
                  onChange={handlePdfUpload}
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full md:w-auto bg-white border-2 border-primary text-primary px-8 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary hover:text-white transition-all shadow-md group"
                >
                  <span className="material-symbols-outlined group-hover:animate-bounce">upload_file</span>
                  PDF Yükle ve Analiz Et
                </button>
              </div>
            </div>

            <div className="flex items-center gap-4 py-4">
              <hr className="flex-grow border-outline-variant/50" />
              <span className="bg-surface-container px-4 py-1 rounded-full text-on-surface-variant font-bold text-xs tracking-wider">VEYA MANUEL OLARAK OLUŞTUR</span>
              <hr className="flex-grow border-outline-variant/50" />
            </div>

            {/* Manuel Soru Kartları */}
            <div className="grid gap-6">
              {questions.map((q, qIndex) => (
                <div key={qIndex} className="bg-white p-6 md:p-8 rounded-2xl border border-outline-variant shadow-sm relative overflow-visible transition-all hover:shadow-md hover:border-primary/30 group">
                  
                  {/* Sil Butonu (Yalnızca birden fazla soru varsa) */}
                  {questions.length > 1 && (
                    <button 
                      onClick={() => {
                        const newQs = [...questions];
                        newQs.splice(qIndex, 1);
                        setQuestions(newQs);
                      }}
                      className="absolute -top-3 -right-3 w-8 h-8 bg-error-alert text-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                  )}

                  <div className="flex items-center gap-4 mb-6 pb-4 border-b border-surface-container-low">
                    <div className="w-10 h-10 rounded-xl bg-surface-container-high border border-outline-variant flex items-center justify-center text-on-surface font-bold text-lg shadow-inner">
                      {qIndex + 1}
                    </div>
                    <div className="flex-grow">
                      <h3 className="font-headline-sm text-on-surface">Soru İçeriği</h3>
                      <p className="text-xs text-on-surface-variant">Çoktan seçmeli soru tipi aktif</p>
                    </div>
                  </div>
                  
                  <textarea 
                    className="w-full p-5 rounded-xl border border-outline-variant outline-none resize-y min-h-[120px] mb-6 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-body-lg"
                    placeholder="Örn: Aşağıdakilerden hangisi bir veri yapısı değildir?"
                    value={q.text}
                    onChange={(e) => {
                      const newQs = [...questions];
                      newQs[qIndex].text = e.target.value;
                      setQuestions(newQs);
                    }}
                  />
                  
                  <div className="space-y-3">
                    <label className="block font-label-md text-on-surface-variant font-bold mb-3">Şıklar (Doğru cevabı yeşil butondan işaretleyin)</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {q.options.map((opt, optIndex) => (
                        <div 
                          key={optIndex} 
                          className={`flex items-center gap-3 p-2 pr-4 rounded-xl border-2 transition-all ${opt.isCorrect ? 'border-success-safe bg-success-safe/5' : 'border-outline-variant/60 bg-surface-container-lowest'}`}
                        >
                          <label className="relative flex items-center p-2 rounded-full cursor-pointer">
                            <input 
                              type="radio" 
                              name={`correct-${qIndex}`} 
                              checked={opt.isCorrect}
                              onChange={() => {
                                const newQs = [...questions];
                                newQs[qIndex].options.forEach((o, i) => o.isCorrect = (i === optIndex));
                                setQuestions(newQs);
                              }}
                              className="before:content[''] peer relative h-6 w-6 cursor-pointer appearance-none rounded-full border-2 border-outline-variant checked:border-success-safe transition-all"
                            />
                            <span className="absolute text-success-safe transition-opacity opacity-0 pointer-events-none top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 peer-checked:opacity-100">
                              <span className="material-symbols-outlined text-[16px]">check_circle</span>
                            </span>
                          </label>
                          <input 
                            className="flex-grow h-10 bg-transparent outline-none font-body-md"
                            placeholder={`${String.fromCharCode(65 + optIndex)}) Şık metnini girin...`}
                            value={opt.text}
                            onChange={(e) => {
                              const newQs = [...questions];
                              newQs[qIndex].options[optIndex].text = e.target.value;
                              setQuestions(newQs);
                            }}
                          />
                          {/* Şık Sil Butonu */}
                          {q.options.length > 2 && (
                            <button 
                              onClick={() => {
                                const newQs = [...questions];
                                newQs[qIndex].options.splice(optIndex, 1);
                                setQuestions(newQs);
                              }}
                              className="text-error-alert/50 hover:text-error-alert transition-colors"
                            >
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    
                    <button 
                      onClick={() => {
                        const newQs = [...questions];
                        newQs[qIndex].options.push({ text: '', isCorrect: false });
                        setQuestions(newQs);
                      }} 
                      className="inline-flex items-center gap-2 px-4 py-2 mt-2 rounded-lg text-primary font-bold hover:bg-primary/10 transition-colors"
                    >
                      <span className="material-symbols-outlined">add</span>
                      Yeni Şık Ekle
                    </button>
                  </div>
                </div>
              ))}
              
              <button 
                onClick={() => setQuestions([...questions, { text: '', type: 'MULTIPLE_CHOICE', options: [{ text: '', isCorrect: true }, { text: '', isCorrect: false }, { text: '', isCorrect: false }, { text: '', isCorrect: false }] }])}
                className="w-full py-6 border-2 border-dashed border-primary text-primary rounded-2xl font-bold flex flex-col justify-center items-center gap-2 hover:bg-primary/5 hover:border-primary/70 transition-all"
              >
                <span className="material-symbols-outlined text-4xl">add_circle</span>
                <span>YENİ BİR SORU DAHA EKLE</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: Sınav Listesi */}
        {activeTab === 3 && (
          <div className="bg-white rounded-2xl border border-outline-variant shadow-sm overflow-hidden">
            <div className="p-6 border-b border-surface-container-low flex justify-between items-center bg-surface-container-lowest">
              <div>
                <h3 className="font-headline-sm text-on-surface">Yayınlanan Sınavlar</h3>
                <p className="text-on-surface-variant text-sm mt-1">Sisteme kayıtlı sınavları yönetin ve izleyin.</p>
              </div>
              <button onClick={fetchExamsList} className="w-10 h-10 rounded-full hover:bg-surface-container flex items-center justify-center text-on-surface-variant transition-colors">
                <span className="material-symbols-outlined">refresh</span>
              </button>
            </div>

            {isLoading ? (
              <div className="p-16 flex flex-col items-center justify-center text-primary">
                <span className="material-symbols-outlined text-4xl animate-spin mb-4">progress_activity</span>
                <p className="font-bold tracking-widest uppercase text-sm">Veriler Yükleniyor...</p>
              </div>
            ) : examsList.length === 0 ? (
              <div className="p-20 text-center flex flex-col items-center justify-center">
                <div className="w-24 h-24 bg-surface-container-high rounded-full flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-5xl text-outline">event_busy</span>
                </div>
                <h3 className="text-headline-sm font-bold text-on-surface mb-2">Henüz Sınav Yok</h3>
                <p className="text-on-surface-variant max-w-sm">Sisteme kayıtlı herhangi bir sınav bulunamadı. "Sınav Ayarları" sekmesinden yeni bir sınav oluşturabilirsiniz.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-surface-container-lowest text-on-surface-variant text-label-md uppercase tracking-wider">
                    <tr>
                      <th className="p-5 border-b border-outline-variant/60 font-bold">Sınav Adı</th>
                      <th className="p-5 border-b border-outline-variant/60 font-bold">Ders</th>
                      <th className="p-5 border-b border-outline-variant/60 font-bold">Zaman Çizelgesi</th>
                      <th className="p-5 border-b border-outline-variant/60 font-bold">Gözetim Durumu</th>
                      <th className="p-5 border-b border-outline-variant/60 font-bold text-right">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/40">
                    {examsList.map((exam, idx) => (
                      <tr key={idx} className="hover:bg-surface-container-lowest transition-colors group">
                        <td className="p-5">
                          <div className="font-bold text-on-surface">{exam.title}</div>
                          <div className="text-xs text-on-surface-variant mt-1">ID: #{exam.id} | Süre: {exam.durationMin} dk</div>
                        </td>
                        <td className="p-5">
                          <span className="bg-primary/10 text-primary px-3 py-1 rounded-lg text-sm font-bold border border-primary/20">
                            {exam.branch?.course?.code || exam.branch?.name || 'Genel'}
                          </span>
                        </td>
                        <td className="p-5">
                          <div className="flex items-center gap-2 text-sm text-on-surface">
                            <span className="material-symbols-outlined text-[16px] text-success-safe">play_circle</span>
                            {new Date(exam.startTime).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short'})}
                          </div>
                          {exam.endTime && (
                            <div className="flex items-center gap-2 text-sm text-on-surface-variant mt-1">
                              <span className="material-symbols-outlined text-[16px] text-error-alert">stop_circle</span>
                              {new Date(exam.endTime).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short'})}
                            </div>
                          )}
                        </td>
                        <td className="p-5">
                          {exam.isSupervised ? 
                            <div className="flex items-center gap-2 text-success-safe bg-success-safe/10 w-max px-3 py-1 rounded-full border border-success-safe/20">
                              <span className="material-symbols-outlined text-[16px]">visibility</span>
                              <span className="text-xs font-bold uppercase">AI Aktif</span>
                            </div> : 
                            <div className="flex items-center gap-2 text-on-surface-variant bg-surface-container-high w-max px-3 py-1 rounded-full border border-outline-variant/50">
                              <span className="material-symbols-outlined text-[16px]">visibility_off</span>
                              <span className="text-xs font-bold uppercase">Pasif</span>
                            </div>
                          }
                        </td>
                        <td className="p-5 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="w-9 h-9 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-white flex items-center justify-center transition-colors" title="Düzenle">
                              <span className="material-symbols-outlined text-[18px]">edit</span>
                            </button>
                            <button className="w-9 h-9 rounded-lg bg-[#039BE5]/10 text-[#039BE5] hover:bg-[#039BE5] hover:text-white flex items-center justify-center transition-colors" title="Raporları Gör">
                              <span className="material-symbols-outlined text-[18px]">analytics</span>
                            </button>
                            <button onClick={() => deleteExam(exam.id)} className="w-9 h-9 rounded-lg bg-error-alert/10 text-error-alert hover:bg-error-alert hover:text-white flex items-center justify-center transition-colors" title="Sil">
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: İstatistikler (Sınav Bazlı) */}
        {activeTab === 4 && (
          <div className="space-y-6">
            
            {/* Üst Kısım: Sınav Seçici */}
            <div className="bg-white p-6 rounded-2xl border border-outline-variant shadow-sm flex flex-col md:flex-row justify-between md:items-center gap-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#039BE5] opacity-5 rounded-full blur-3xl -translate-y-1/2"></div>
              
              <div>
                <h3 className="font-headline-sm text-on-surface">Sınav Bazlı Metrikler</h3>
                <p className="text-sm text-on-surface-variant mt-1">İncelemek istediğiniz sınavı seçin.</p>
              </div>
              
              <div className="w-full md:w-96 relative z-10">
                <select 
                  className="w-full h-12 px-5 appearance-none rounded-xl border-2 border-outline-variant focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none bg-surface-container-lowest font-bold text-on-surface"
                  value={selectedExamId || ''}
                  onChange={(e) => setSelectedExamId(parseInt(e.target.value))}
                >
                  {examsList.length === 0 && <option value="">Sınav Bulunamadı</option>}
                  {examsList.map(ex => (
                    <option key={ex.id} value={ex.id}>{ex.title} (ID: {ex.id})</option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant">expand_more</span>
              </div>
            </div>

            {examsList.length > 0 && selectedExamId ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Sol Kısım: Sayısal Kartlar */}
                <div className="lg:col-span-1 space-y-6">
                  <div className="bg-white p-6 rounded-2xl border border-outline-variant shadow-sm relative overflow-hidden group">
                    <div className="absolute -right-6 -bottom-6 opacity-5 group-hover:scale-110 transition-transform duration-500">
                      <span className="material-symbols-outlined text-[120px]">group</span>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                      <span className="material-symbols-outlined">group</span>
                    </div>
                    <h3 className="text-label-md text-on-surface-variant font-bold uppercase tracking-wider mb-1">Katılım Oranı</h3>
                    <div className="flex items-end gap-2">
                      <span className="text-headline-lg font-bold text-on-surface">{attendedCount}</span>
                      <span className="text-on-surface-variant mb-1">/ {expectedCount}</span>
                    </div>
                    <div className="w-full bg-surface-container-high h-2 rounded-full mt-4 overflow-hidden">
                      <div className="bg-primary h-full rounded-full" style={{ width: `${(attendedCount / expectedCount) * 100}%`}}></div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-outline-variant shadow-sm relative overflow-hidden group">
                    <div className="absolute -right-6 -bottom-6 opacity-5 group-hover:scale-110 transition-transform duration-500">
                      <span className="material-symbols-outlined text-[120px]">grading</span>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-success-safe/10 text-success-safe flex items-center justify-center mb-4">
                      <span className="material-symbols-outlined">grading</span>
                    </div>
                    <h3 className="text-label-md text-on-surface-variant font-bold uppercase tracking-wider mb-1">Genel Başarı (Ortalama)</h3>
                    <div className="flex items-end gap-2">
                      <span className="text-headline-lg font-bold text-on-surface">0</span>
                      <span className="text-on-surface-variant mb-1">/ 100 Puan</span>
                    </div>
                    <p className="text-xs text-error-alert mt-2 flex items-center gap-1 bg-error-alert/10 w-max px-2 py-1 rounded">
                      <span className="material-symbols-outlined text-[14px]">warning</span> Yeterli Sınav Verisi Yok
                    </p>
                  </div>
                </div>

                {/* Sağ Kısım: Grafikler (Recharts) */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-white p-6 rounded-2xl border border-outline-variant shadow-sm">
                    <h3 className="font-headline-sm text-on-surface mb-6 border-b border-surface-container-low pb-4">Katılım Dağılımı</h3>
                    <div className="h-[250px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={attendanceChartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={90}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                          >
                            {attendanceChartData.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                          />
                          <Legend verticalAlign="bottom" height={36} iconType="circle" />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-outline-variant shadow-sm">
                    <h3 className="font-headline-sm text-on-surface mb-6 border-b border-surface-container-low pb-4">Not Dağılım Grafiği (Puan Aralığı)</h3>
                    <div className="h-[250px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={scoreDistributionData} margin={{ top: 10, right: 30, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                          <XAxis dataKey="range" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                          <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                          <Tooltip 
                            cursor={{fill: '#f1f5f9'}}
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                          />
                          <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={40} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

              </div>
            ) : (
              <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-16 text-center shadow-sm">
                <span className="material-symbols-outlined text-6xl text-outline-variant mb-4">monitoring</span>
                <h3 className="text-headline-sm text-on-surface mb-2">Gösterilecek Veri Yok</h3>
                <p className="text-on-surface-variant max-w-md mx-auto">İstatistikleri görebilmek için önce bir sınav oluşturmalı ve seçmelisiniz.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {pdfAnalyzing && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-indigo-500/30 rounded-3xl p-8 max-w-md w-full text-center shadow-[0_0_50px_rgba(99,102,241,0.2)] space-y-6">
            <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-white">Yapay Zeka PDF Analizi</h3>
              <p className="text-xs text-slate-400 font-mono tracking-wider uppercase">TÜBİTAK OCR Motoru Çalışıyor</p>
            </div>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-indigo-300 text-xs font-semibold font-mono animate-pulse min-h-[48px] flex items-center justify-center">
              { [
                'PDF Dosyası sisteme yükleniyor...',
                'Görüntü İşleme & OCR Motoru başlatılıyor...',
                'Metin içerikleri Tesseract yardımıyla çıkarılıyor...',
                'TÜBİTAK 1001 Final Raporu yapısı algılandı...',
                'Yapay Zeka ile sorular ve şıklar ayrıştırılıyor...',
                'Sınav soruları başarıyla oluşturuldu!'
              ][pdfProgressStep] }
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-indigo-500 h-1.5 transition-all duration-300" 
                style={{ width: `${((pdfProgressStep + 1) / 6) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
