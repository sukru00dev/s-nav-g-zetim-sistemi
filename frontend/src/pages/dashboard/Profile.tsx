import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';

export default function Profile() {
  const { user, token, login } = useAuth();
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    forename: user?.forename || '',
    surname: user?.surname || '',
    photo: user?.photo || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      setError('Yeni şifreler eşleşmiyor!');
      return;
    }

    setSaving(true);
    try {
      const data = await api.put<{ message: string; user: typeof user }>(
        '/users/me',
        {
          forename: formData.forename,
          surname: formData.surname,
          photo: formData.photo,
          currentPassword: formData.currentPassword || undefined,
          newPassword: formData.newPassword || undefined,
        },
        token
      );
      setSuccess('Profil bilgileriniz başarıyla güncellendi.');
      if (data.user && token) {
        login(token, data.user as Parameters<typeof login>[1]);
      }
      setFormData(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4 bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant shadow-sm">
        <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-primary">
          <img src={formData.photo || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png'} alt="Profil" className="w-full h-full object-cover" />
        </div>
        <div>
          <h1 className="font-headline-md text-headline-md text-on-surface">Kişisel Bilgilerim</h1>
          <p className="text-body-md text-on-surface-variant">Profil fotoğrafınızı, temel bilgilerinizi ve şifrenizi buradan yönetebilirsiniz.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-outline-variant shadow-sm p-6 lg:p-8">
        {success && (
          <div className="mb-6 flex items-center gap-3 p-4 bg-green-50 border border-green-200 text-green-800 rounded-xl text-sm font-medium">
            <span className="material-symbols-outlined text-green-600">check_circle</span>
            {success}
          </div>
        )}
        {error && (
          <div className="mb-6 flex items-center gap-3 p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl text-sm font-medium">
            <span className="material-symbols-outlined text-red-600">error</span>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Fotoğraf */}
          <div>
            <h3 className="font-bold text-lg text-on-surface mb-4 border-b border-outline-variant/30 pb-2">Profil Fotoğrafı</h3>
            <div className="flex items-center gap-4">
              <input 
                type="text" name="photo" value={formData.photo} onChange={handleChange}
                placeholder="Fotoğraf URL'si (Örn: https://...)" 
                className="flex-1 px-4 py-2 bg-surface-container-low border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
          </div>

          {/* Temel Bilgiler */}
          <div>
            <h3 className="font-bold text-lg text-on-surface mb-4 border-b border-outline-variant/30 pb-2">Temel Bilgiler</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-sm font-bold text-on-surface-variant block">Ad</label>
                <input type="text" name="forename" value={formData.forename} onChange={handleChange}
                  className="w-full px-4 py-2 bg-surface-container-low border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-bold text-on-surface-variant block">Soyad</label>
                <input type="text" name="surname" value={formData.surname} onChange={handleChange}
                  className="w-full px-4 py-2 bg-surface-container-low border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-bold text-on-surface-variant block">T.C. Kimlik No</label>
                <input type="text" value={(user as { tc_kimlik?: string })?.tc_kimlik || 'Eklenmemiş'} disabled
                  className="w-full px-4 py-2 bg-surface-container-lowest border border-outline-variant/50 rounded-lg text-on-surface-variant/50 cursor-not-allowed" />
                <p className="text-[10px] text-error-alert mt-1">T.C. Kimlik numarası sonradan değiştirilemez.</p>
              </div>
            </div>
          </div>

          {/* Şifre */}
          <div>
            <h3 className="font-bold text-lg text-on-surface mb-4 border-b border-outline-variant/30 pb-2">Güvenlik ve Şifre</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1">
                <label className="text-sm font-bold text-on-surface-variant block">Mevcut Şifre</label>
                <input type="password" name="currentPassword" value={formData.currentPassword} onChange={handleChange}
                  className="w-full px-4 py-2 bg-surface-container-low border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-bold text-on-surface-variant block">Yeni Şifre</label>
                <input type="password" name="newPassword" value={formData.newPassword} onChange={handleChange}
                  className="w-full px-4 py-2 bg-surface-container-low border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-bold text-on-surface-variant block">Yeni Şifre (Tekrar)</label>
                <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange}
                  className="w-full px-4 py-2 bg-surface-container-low border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary outline-none" />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 bg-primary text-white font-bold px-8 py-3 rounded-xl shadow-lg shadow-primary/30 hover:bg-primary/90 disabled:opacity-60 transition-all"
            >
              {saving && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {saving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

