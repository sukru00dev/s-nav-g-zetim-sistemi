import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import fpPromise from '@fingerprintjs/fingerprintjs';
import { api } from '../../lib/api';

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    forename: '',
    surname: '',
    username: '',
    tc_kimlik: '',
    email: '',
    password: '',
    yearOfBirth: '',
    roleId: 4 // Default is student
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const fp = await fpPromise.load();
      const { visitorId } = await fp.get();
      await api.post('/auth/register', {
        ...formData,
        roleId: parseInt(formData.roleId.toString(), 10),
        mac_address: visitorId
      });
      setSuccess('Kayıt başarılı! Giriş sayfasına yönlendiriliyorsunuz...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Kayıt işlemi başarısız oldu.');
    }
  };

  return (
    <div className="bg-surface-background text-on-surface min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 z-0 pointer-events-none opacity-20"></div>

      <main className="w-full max-w-[480px] z-10 relative">
        <div className="bg-surface-container-lowest rounded-xl shadow-xl overflow-hidden login-card-glass transition-all duration-500">
          
          <div className="bg-sidebar-navy p-gutter text-center border-b border-outline-variant">
            <h1 className="text-headline-md font-headline-md text-surface-container-lowest mt-4">Sisteme Kayıt Ol</h1>
            <p className="text-label-md font-label-md text-secondary-fixed opacity-90 mt-1">Harran Üniversitesi Sınav Yönetimi</p>
          </div>

          <div className="p-gutter lg:p-10">
            <div className="mb-gutter text-center">
              <h2 className="text-headline-sm font-headline-sm text-primary mb-2">Yeni Kullanıcı</h2>
              <p className="text-body-md font-body-md text-on-surface-variant">Lütfen bilgilerinizi eksiksiz doldurunuz.</p>
            </div>
            
            {error && <div className="mb-4 p-3 bg-error-container text-on-error-container text-sm rounded-lg">{error}</div>}
            {success && <div className="mb-4 p-3 bg-success-safe/20 text-success-safe text-sm rounded-lg font-bold">{success}</div>}

            <form className="space-y-4" onSubmit={handleRegister}>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-label-md font-label-md text-on-surface-variant block">Ad</label>
                  <input 
                    type="text" 
                    name="forename"
                    value={formData.forename}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-surface-container-low border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-body-md font-body-md outline-none" 
                    placeholder="Adınız" 
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-label-md font-label-md text-on-surface-variant block">Soyad</label>
                  <input 
                    type="text" 
                    name="surname"
                    value={formData.surname}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-surface-container-low border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-body-md font-body-md outline-none" 
                    placeholder="Soyadınız" 
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-label-md font-label-md text-on-surface-variant block">Kullanıcı Adı</label>
                  <input 
                    type="text" 
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-surface-container-low border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-body-md font-body-md outline-none" 
                    placeholder="sistem.kullanicisi" 
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-label-md font-label-md text-on-surface-variant block">T.C. Kimlik No</label>
                  <input 
                    type="text" 
                    name="tc_kimlik"
                    value={formData.tc_kimlik}
                    onChange={handleChange}
                    maxLength={11}
                    className="w-full px-4 py-2 bg-surface-container-low border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-body-md font-body-md outline-none" 
                    placeholder="11 Haneli T.C. Numaranız" 
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-label-md font-label-md text-on-surface-variant block">E-Posta</label>
                  <input 
                    type="email" 
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-surface-container-low border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-body-md font-body-md outline-none" 
                    placeholder="ornek@harran.edu.tr" 
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-label-md font-label-md text-on-surface-variant block">Doğum Yılı</label>
                  <input 
                    type="number" 
                    name="yearOfBirth"
                    value={formData.yearOfBirth}
                    onChange={handleChange}
                    min="1930"
                    max="2010"
                    className="w-full px-4 py-2 bg-surface-container-low border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-body-md font-body-md outline-none" 
                    placeholder="Örn: 2002" 
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-label-md font-label-md text-on-surface-variant block">Rol Seçimi</label>
                <select 
                  name="roleId"
                  value={formData.roleId}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-surface-container-low border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-body-md font-body-md outline-none"
                >
                  <option value={1}>Yönetici / Admin</option>
                  <option value={3}>Eğitmen / Öğretmen</option>
                  <option value={4}>Öğrenci</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-label-md font-label-md text-on-surface-variant block">Şifre</label>
                <input 
                  type="password" 
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-surface-container-low border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-body-md font-body-md outline-none" 
                  placeholder="••••••••" 
                  required
                />
              </div>

              <div className="pt-2">
                <button type="submit" className="w-full bg-primary hover:bg-primary-container text-white py-3 rounded-lg font-headline-sm transition-all shadow-md">
                  Kayıt Ol
                </button>
              </div>
            </form>

            <div className="mt-4 text-center">
              <button 
                type="button"
                onClick={() => navigate('/login')}
                className="text-primary hover:text-primary-container font-label-md text-label-md inline-block border-b border-transparent hover:border-primary-container"
              >
                Zaten hesabınız var mı? Giriş yapın.
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
