export default function Overview() {
  const stats = {
    activeExams: 0,
    onlineUsers: 0,
    activeSessions: 0,
    securityAlerts: 0
  };

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-indigo-600 p-6 rounded-xl text-white shadow-lg">
          <h3 className="text-sm opacity-80 uppercase">Aktif Sınavlar</h3>
          <p className="text-3xl mt-1 font-mono">{stats.activeExams}</p>
        </div>
        
        <div className="bg-emerald-600 p-6 rounded-xl text-white shadow-lg">
          <h3 className="text-sm opacity-80 uppercase">Çevrimiçi Kullanıcı</h3>
          <p className="text-3xl mt-1 font-mono">{stats.onlineUsers}</p>
        </div>

        <div className="bg-amber-500 p-6 rounded-xl text-white shadow-lg">
          <h3 className="text-sm opacity-80 uppercase">Gözetim Oturumları</h3>
          <p className="text-3xl mt-1 font-mono">{stats.activeSessions}</p>
        </div>

        <div className="bg-rose-600 p-6 rounded-xl text-white shadow-lg">
          <h3 className="text-sm opacity-80 uppercase">Güvenlik İhlalleri</h3>
          <p className="text-3xl mt-1 font-mono">{stats.securityAlerts}</p>
        </div>
      </div>
    </div>
  );
}
