import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';

interface UserData {
  id: number;
  username: string;
  email: string;
  forename: string;
  surname: string;
  role: {
    name_tr: string;
  };
}

export default function RoleManagement() {
  const [activeTab, setActiveTab] = useState(3); // Default to Kullanıcı Listesi for easier access
  const { token, user: currentUser } = useAuth();
  
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    tc_kimlik: '',
    forename: '',
    surname: '',
    email: '',
    username: '',
    password: '',
    roleId: 3, // 3: Akademisyen, 2: Protokol, 1: Admin
    yearOfBirth: 1990
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await api.get<UserData[]>('/users', token);
      setUsers(data);
    } catch (err) {
      console.error('Kullanıcılar getirilemedi', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 3) {
      fetchUsers();
    }
  }, [activeTab]);

  const handleDelete = async (id: number) => {
    if (!window.confirm('Bu kullanıcıyı silmek istediğinize emin misiniz?')) return;
    try {
      await api.delete(`/users/${id}`, token);
      setSuccessMsg('Kullanıcı başarıyla silindi.');
      fetchUsers();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Silme işlemi başarısız');
    }
  };

  const handleRegisterUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await api.post('/auth/register', { ...formData, roleId: Number(formData.roleId) });
      setSuccessMsg('Kullanıcı başarıyla oluşturuldu.');
      setIsModalOpen(false);
      setFormData({ tc_kimlik: '', forename: '', surname: '', email: '', username: '', password: '', roleId: 2, yearOfBirth: 1990 });
      fetchUsers();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Kayıt başarısız');
    }
  };

  return (
    <section className="max-w-7xl mx-auto space-y-6 relative">
      <div className="flex justify-between items-center bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-sm text-white">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-500/20 text-blue-400 rounded-xl flex items-center justify-center border border-blue-500/30">
            <span className="material-symbols-outlined text-3xl">admin_panel_settings</span>
          </div>
          <div>
            <h1 className="text-xl font-bold">Birim ve Kullanıcı Yönetimi</h1>
            <p className="text-sm text-slate-400">Sistem yetkilerini ve personelleri yönetin.</p>
          </div>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-500 transition-all shadow-lg shadow-blue-900/50"
        >
          <span className="material-symbols-outlined">person_add</span>
          Yeni Personel Ekle
        </button>
      </div>

      {successMsg && (
        <div className="p-4 bg-green-900/30 border border-green-800 text-green-400 rounded-xl">
          {successMsg}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 p-2 bg-slate-900 rounded-xl border border-slate-800">
        {[
          { id: 1, title: 'Kurum Hiyerarşisi', icon: 'account_balance' },
          { id: 2, title: 'Rol ve Yetkiler', icon: 'shield_person' },
          { id: 3, title: 'Kullanıcı Listesi', icon: 'group' }
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setSuccessMsg(''); setErrorMsg(''); }}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 font-bold rounded-lg transition-all duration-300 ${
              activeTab === tab.id 
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' 
                : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            <span className="material-symbols-outlined">{tab.icon}</span>
            {tab.title}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-sm p-6 text-slate-200 min-h-[400px]">
        
        {/* TAB 1 & 2 placeholders since we want to focus on Tab 3 */}
        {activeTab === 1 && (
           <div className="flex flex-col items-center justify-center py-20 text-slate-500">
             <span className="material-symbols-outlined text-6xl mb-4 opacity-50">account_tree</span>
             <p>Kurum hiyerarşisi (Üniversite/Fakülte) statik moddadır.</p>
           </div>
        )}
        
        {activeTab === 2 && (
           <div className="flex flex-col items-center justify-center py-20 text-slate-500">
             <span className="material-symbols-outlined text-6xl mb-4 opacity-50">admin_panel_settings</span>
             <p>Sistem rolleri ve yetkileri statik moddadır.</p>
           </div>
        )}

        {/* TAB 3: Kullanıcı Listesi */}
        {activeTab === 3 && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold">Kayıtlı Sistem Kullanıcıları</h3>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">search</span>
                <input 
                  type="text" 
                  placeholder="Ara..." 
                  className="pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg outline-none focus:border-blue-500 w-64 text-sm text-slate-200"
                />
              </div>
            </div>
            
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-950 text-slate-400 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="p-4 border-b border-slate-800">Ad Soyad</th>
                    <th className="p-4 border-b border-slate-800">E-Posta / Kullanıcı Adı</th>
                    <th className="p-4 border-b border-slate-800">Rol</th>
                    <th className="p-4 border-b border-slate-800 text-right">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 text-sm">
                  {loading ? (
                    <tr><td colSpan={4} className="p-8 text-center text-slate-500">Yükleniyor...</td></tr>
                  ) : users.length === 0 ? (
                    <tr><td colSpan={4} className="p-8 text-center text-slate-500">Kayıtlı kullanıcı bulunamadı.</td></tr>
                  ) : (
                    users.map(u => (
                      <tr key={u.id} className="hover:bg-slate-800/50 transition-colors">
                        <td className="p-4 font-bold text-slate-200">{u.forename} {u.surname}</td>
                        <td className="p-4">
                           <div className="text-slate-300">{u.email}</div>
                           <div className="text-xs text-slate-500 font-mono">@{u.username}</div>
                        </td>
                        <td className="p-4">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            u.role.name_tr === 'Yönetici' || u.role.name_tr === 'Sistem Yöneticisi' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30' :
                            u.role.name_tr === 'Akademisyen' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30' :
                            u.role.name_tr === 'Protokol' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' :
                            'bg-green-500/10 text-green-400 border border-green-500/30'
                          }`}>
                            {u.role.name_tr}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          {currentUser?.id !== u.id && (
                             <button 
                               onClick={() => handleDelete(u.id)}
                               className="text-red-400 hover:text-red-300 hover:bg-red-900/30 p-2 rounded-lg transition-colors flex items-center gap-1 ml-auto"
                             >
                               <span className="material-symbols-outlined text-[18px]">delete</span>
                               <span className="text-xs font-bold">Sil</span>
                             </button>
                          )}
                          {currentUser?.id === u.id && (
                             <span className="text-xs text-slate-500 italic mr-2">Siz (Yetkili)</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Yeni Kullanıcı Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95">
             <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                <h3 className="text-lg font-bold text-white">Yeni Personel Ekle</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                  <span className="material-symbols-outlined">close</span>
                </button>
             </div>
             <form onSubmit={handleRegisterUser} className="p-6 space-y-4">
                {errorMsg && <div className="p-3 bg-red-900/30 text-red-400 text-sm rounded-lg border border-red-800">{errorMsg}</div>}
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">T.C. Kimlik No</label>
                    <input required type="text" maxLength={11} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white text-sm outline-none focus:border-blue-500"
                      value={formData.tc_kimlik} onChange={e => setFormData({...formData, tc_kimlik: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">Şifre</label>
                    <input required type="password" minLength={6} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white text-sm outline-none focus:border-blue-500"
                      value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">Ad</label>
                    <input required type="text" className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white text-sm outline-none focus:border-blue-500"
                      value={formData.forename} onChange={e => setFormData({...formData, forename: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">Soyad</label>
                    <input required type="text" className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white text-sm outline-none focus:border-blue-500"
                      value={formData.surname} onChange={e => setFormData({...formData, surname: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">Kullanıcı Adı</label>
                    <input required type="text" className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white text-sm outline-none focus:border-blue-500"
                      value={formData.username} onChange={e => setFormData({...formData, username: e.target.value.toLowerCase().replace(/\\s/g,'')})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">E-Posta</label>
                    <input required type="email" className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white text-sm outline-none focus:border-blue-500"
                      value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">Sistem Rolü</label>
                    <select className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white text-sm outline-none focus:border-blue-500"
                      value={formData.roleId} onChange={e => setFormData({...formData, roleId: Number(e.target.value)})}
                    >
                      <option value={3}>Akademisyen (Öğretmen)</option>
                      <option value={2}>Protokol (Dekan / Rektör)</option>
                      <option value={1}>Yönetici (Admin)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">Doğum Yılı</label>
                    <input required type="number" min="1940" max="2010" className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white text-sm outline-none focus:border-blue-500"
                      value={formData.yearOfBirth} onChange={e => setFormData({...formData, yearOfBirth: Number(e.target.value)})}
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-3">
                   <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-lg text-sm font-bold text-slate-300 hover:bg-slate-800">
                     İptal
                   </button>
                   <button type="submit" className="px-5 py-2.5 rounded-lg text-sm font-bold bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-900/50">
                     Hesabı Oluştur
                   </button>
                </div>
             </form>
          </div>
        </div>
      )}

    </section>
  );
}
