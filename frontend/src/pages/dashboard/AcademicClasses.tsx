import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';

interface Student {
  id: number;
  forename: string;
  surname: string;
  tc_kimlik: string;
  email: string;
}

interface Branch {
  id: number;
  name: string;
  users: Student[];
  _count: { users: number };
}

interface Course {
  id: number;
  name: string;
  code: string;
  branches: Branch[];
}

export default function AcademicClasses() {
  const navigate = useNavigate();
  const { token } = useAuth();
  
  // Data States
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal / Form States
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [showEnrollModal, setShowEnrollModal] = useState(false);

  const [newCourse, setNewCourse] = useState({ name: '', code: '' });
  const [newBranch, setNewBranch] = useState({ name: '', courseId: 0 });
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [coursesData, studentsData] = await Promise.all([
        api.get<Course[]>('/academic/courses', token),
        api.get<Student[]>('/academic/students', token)
      ]);
      setCourses(coursesData);
      setStudents(studentsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token]);

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourse.name || !newCourse.code) return alert('Lütfen tüm alanları doldurun');
    try {
      await api.post('/academic/courses', newCourse, token);
      alert('Ders başarıyla oluşturuldu');
      setShowCourseModal(false);
      setNewCourse({ name: '', code: '' });
      loadData();
    } catch (err: any) {
      alert(err.message || 'Ders oluşturulamadı');
    }
  };

  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBranch.name || !newBranch.courseId) return alert('Lütfen tüm alanları doldurun');
    try {
      await api.post('/academic/branches', newBranch, token);
      alert('Şube (Grup) başarıyla oluşturuldu');
      setShowBranchModal(false);
      setNewBranch({ name: '', courseId: 0 });
      loadData();
    } catch (err: any) {
      alert(err.message || 'Şube oluşturulamadı');
    }
  };

  const openEnrollModal = (branch: Branch) => {
    setSelectedBranch(branch);
    setSelectedStudents(branch.users.map(u => u.id));
    setShowEnrollModal(true);
  };

  const handleSaveEnrollment = async () => {
    if (!selectedBranch) return;
    try {
      await api.post(`/academic/branches/${selectedBranch.id}/enroll`, {
        studentIds: selectedStudents
      }, token);
      alert('Öğrenciler başarıyla atandı');
      setShowEnrollModal(false);
      setSelectedBranch(null);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Öğrenci ataması başarısız');
    }
  };

  const toggleStudentSelection = (studentId: number) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId) 
        : [...prev, studentId]
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Upper header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm gap-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/akademisyen')} 
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 font-bold bg-slate-50 hover:bg-slate-100 px-3 py-2 rounded-xl border border-slate-200 transition-colors shrink-0"
          >
            <span className="material-symbols-outlined text-[14px]">arrow_back</span>
            Geri
          </button>
          <div>
            <h1 className="text-xl font-bold font-serif text-[#002147]">Sınıf & Şube Yönetim Paneli</h1>
            <p className="text-sm text-slate-500">Derslerinizi tanımlayın, öğrenci gruplarınızı (şubelerinizi) oluşturun ve öğrencileri atayın.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowCourseModal(true)}
            className="flex items-center gap-2 bg-[#002147] hover:bg-slate-800 text-white font-bold px-4 py-2.5 rounded-xl transition-all text-xs"
          >
            <span className="material-symbols-outlined text-[16px]">add_box</span>
            Yeni Ders Ekle
          </button>
          <button 
            onClick={() => setShowBranchModal(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2.5 rounded-xl transition-all text-xs"
          >
            <span className="material-symbols-outlined text-[16px]">groups</span>
            Yeni Şube (Grup) Ekle
          </button>
        </div>
      </div>

      {/* Courses List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {courses.length === 0 ? (
          <div className="col-span-2 bg-white p-12 border rounded-2xl text-center text-slate-400">
            <span className="material-symbols-outlined text-5xl mb-2">menu_book</span>
            <p className="text-sm font-semibold">Tanımlı ders bulunmamaktadır. Sağ üstten ders ekleyerek başlayabilirsiniz.</p>
          </div>
        ) : (
          courses.map(course => (
            <div key={course.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-[10px] font-bold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded border border-indigo-100">
                      {course.code}
                    </span>
                    <h2 className="text-lg font-bold text-slate-800 mt-1">{course.name}</h2>
                  </div>
                  <span className="material-symbols-outlined text-slate-300">school</span>
                </div>

                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Şubeler & Sınıflar</h3>
                  {course.branches.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">Bu derse ait aktif şube bulunmamaktadır.</p>
                  ) : (
                    course.branches.map(branch => (
                      <div key={branch.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <div>
                          <span className="font-bold text-slate-700 text-sm">{branch.name}</span>
                          <span className="text-xs text-slate-500 ml-2">({branch.users?.length || 0} Öğrenci)</span>
                        </div>
                        <button 
                          onClick={() => openEnrollModal(branch)}
                          className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800"
                        >
                          <span className="material-symbols-outlined text-[14px]">person_add</span>
                          Öğrencileri Düzenle
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Course Modal */}
      {showCourseModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <form onSubmit={handleCreateCourse} className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4">
            <h3 className="text-base font-bold text-slate-800">Yeni Ders Oluştur</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Ders Adı</label>
                <input 
                  type="text" 
                  value={newCourse.name} 
                  onChange={e => setNewCourse(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Örn: Yapay Zeka Giriş"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Ders Kodu</label>
                <input 
                  type="text" 
                  value={newCourse.code} 
                  onChange={e => setNewCourse(prev => ({ ...prev, code: e.target.value }))}
                  placeholder="Örn: CENG401"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-indigo-500"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button 
                type="button" 
                onClick={() => setShowCourseModal(false)}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-xs font-bold"
              >
                İptal
              </button>
              <button 
                type="submit" 
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-500"
              >
                Oluştur
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Branch Modal */}
      {showBranchModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <form onSubmit={handleCreateBranch} className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4">
            <h3 className="text-base font-bold text-slate-800">Yeni Şube (Sınıf) Oluştur</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Şube Adı</label>
                <input 
                  type="text" 
                  value={newBranch.name} 
                  onChange={e => setNewBranch(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Örn: A Grubu, Sabit Program vb."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Ders Seçin</label>
                <select 
                  value={newBranch.courseId} 
                  onChange={e => setNewBranch(prev => ({ ...prev, courseId: Number(e.target.value) }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-indigo-500 bg-white"
                >
                  <option value="0">Ders Seçiniz...</option>
                  {courses.map(course => (
                    <option key={course.id} value={course.id}>{course.code} - {course.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button 
                type="button" 
                onClick={() => setShowBranchModal(false)}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-xs font-bold"
              >
                İptal
              </button>
              <button 
                type="submit" 
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-500"
              >
                Oluştur
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Enroll Modal (Öğrenci Atama) */}
      {showEnrollModal && selectedBranch && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 flex flex-col max-h-[85vh]">
            <div>
              <h3 className="text-base font-bold text-slate-800">Şubeye Öğrenci Ata</h3>
              <p className="text-xs text-slate-500 mt-0.5">Şube: {selectedBranch.name}</p>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 max-h-96 pr-2">
              {students.length === 0 ? (
                <p className="text-sm text-slate-400 py-4 text-center">Sisteme kayıtlı öğrenci bulunmamaktadır.</p>
              ) : (
                students.map(student => {
                  const isChecked = selectedStudents.includes(student.id);
                  return (
                    <div 
                      key={student.id} 
                      className="flex items-center justify-between py-2 cursor-pointer hover:bg-slate-50 px-2 rounded"
                      onClick={() => toggleStudentSelection(student.id)}
                    >
                      <div>
                        <div className="text-xs font-bold text-slate-700">{student.forename} {student.surname}</div>
                        <div className="text-[10px] text-slate-400">{student.email} | TC: {student.tc_kimlik}</div>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={isChecked}
                        onChange={() => {}} // onClick handles selection
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                      />
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex gap-2 justify-end pt-4 border-t">
              <button 
                type="button" 
                onClick={() => {
                  setShowEnrollModal(false);
                  setSelectedBranch(null);
                }}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-xs font-bold"
              >
                İptal
              </button>
              <button 
                type="button"
                onClick={handleSaveEnrollment}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-500"
              >
                Değişiklikleri Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
