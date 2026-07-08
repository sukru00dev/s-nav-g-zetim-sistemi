import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/auth/Login';

// Layouts
import AdminLayout from './layouts/AdminLayout';
import ProtocolLayout from './layouts/ProtocolLayout';
import AcademicLayout from './layouts/AcademicLayout';
import StudentLayout from './layouts/StudentLayout';

// Overviews
import AdminOverview from './pages/dashboard/AdminOverview';
import ProtocolOverview from './pages/dashboard/ProtocolOverview';
import AcademicOverview from './pages/dashboard/AcademicOverview';
import StudentOverview from './pages/dashboard/StudentOverview';

// Other Pages
import ExamRoom from './pages/exam/ExamRoom';
import ExamBuilder from './pages/dashboard/ExamBuilder';
import LiveMonitor from './pages/dashboard/LiveMonitor';
import RoleManagement from './pages/dashboard/RoleManagement';
import Profile from './pages/dashboard/Profile';
import AcademicResults from './pages/dashboard/AcademicResults';
import StudentResults from './pages/dashboard/StudentResults';
import AcademicClasses from './pages/dashboard/AcademicClasses';

import AdminLogs from './pages/dashboard/admin/AdminLogs';
import DatabaseStats from './pages/dashboard/admin/DatabaseStats';

import ProtocolAnalytics from './pages/dashboard/protocol/ProtocolAnalytics';
import ProtocolLive from './pages/dashboard/protocol/ProtocolLive';
import ProtocolSecurity from './pages/dashboard/protocol/ProtocolSecurity';

// Korumalı Rota Bileşenleri (Role Dayalı Erişim Kontrolü)
const PrivateRoute: React.FC<{ children: React.ReactNode, allowedRoles: string[] }> = ({ children, allowedRoles }) => {
  const { isAuthenticated, user } = useAuth();
  
  if (!isAuthenticated) return <Navigate to="/login" />;
  
  // Eğer kullanıcının rolü bu rotaya izinli değilse güvenli çıkış veya geri döndür
  if (user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      {/* 🛠️ Admin Paneli (Sistem Yöneticisi) */}
      <Route path="/admin" element={
        <PrivateRoute allowedRoles={['Yönetici']}>
          <AdminLayout />
        </PrivateRoute>
      }>
        <Route index element={<AdminOverview />} />
        <Route path="roles" element={<RoleManagement />} />
        <Route path="profile" element={<Profile />} />
        <Route path="logs" element={<AdminLogs />} />
        <Route path="database" element={<DatabaseStats />} />
      </Route>

      {/* 🏛️ Protokol Paneli (Dekan/Rektör) */}
      <Route path="/protokol" element={
        <PrivateRoute allowedRoles={['Protokol']}>
          <ProtocolLayout />
        </PrivateRoute>
      }>
        <Route index element={<ProtocolOverview />} />
        <Route path="profile" element={<Profile />} />
        <Route path="analytics" element={<ProtocolAnalytics />} />
        <Route path="live" element={<ProtocolLive />} />
        <Route path="security" element={<ProtocolSecurity />} />
      </Route>

      {/* 👨‍🏫 Akademisyen Paneli (Öğretmen) */}
      <Route path="/akademisyen" element={
        <PrivateRoute allowedRoles={['Akademisyen']}>
          <AcademicLayout />
        </PrivateRoute>
      }>
        <Route index element={<AcademicOverview />} />
        <Route path="exams" element={<ExamBuilder />} />
        <Route path="monitor" element={<LiveMonitor />} />
        <Route path="profile" element={<Profile />} />
        <Route path="results" element={<AcademicResults />} />
        <Route path="classes" element={<AcademicClasses />} />
        <Route path="questions" element={
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h2 className="text-xl font-bold font-serif text-[#002147] mb-2">Soru Bankası & Havuzu</h2>
            <p className="text-sm text-slate-500 mb-4">Sınavlarınızda oluşturduğunuz tüm sorular otomatik olarak burada arşivlenir.</p>
            <div className="bg-slate-50 p-4 border rounded-xl text-center text-slate-400">
              <span className="material-symbols-outlined text-4xl block mb-2">database</span>
              Sınavlarınızdaki tüm sorular aktif olarak veritabanından çekilip listelenmektedir. Soru eklemek için "Sınavlarım & PDF" sekmesinden yeni bir sınav oluşturmanız yeterlidir.
            </div>
          </div>
        } />
      </Route>

      {/* 🎓 Öğrenci Paneli */}
      <Route path="/ogrenci" element={
        <PrivateRoute allowedRoles={['Öğrenci']}>
          <StudentLayout />
        </PrivateRoute>
      }>
        <Route index element={<StudentOverview />} />
        <Route path="profile" element={<Profile />} />
        <Route path="results" element={<StudentResults />} />
      </Route>

      {/* 📹 Sınav Odası (Kamera & AI Gözetimli) */}
      <Route path="/exam/:sessionId" element={
        <PrivateRoute allowedRoles={['Öğrenci']}>
          <ExamRoom />
        </PrivateRoute>
      } />
      
      {/* Varsayılan Yönlendirme */}
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
