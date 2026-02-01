"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../components/Sidebar';
import Toast from '../../components/Toast';

interface UserData {
  id: number;
  username: string;
  nama: string;
  role: string;
  created_at: string;
}

export default function PengaturanAkun() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditingNama, setIsEditingNama] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);

  // Form states
  const [formNama, setFormNama] = useState('');
  const [formPasswordOld, setFormPasswordOld] = useState('');
  const [formPasswordNew, setFormPasswordNew] = useState('');
  const [formPasswordConfirm, setFormPasswordConfirm] = useState('');

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      setFormNama(parsedUser.nama);
      setLoading(false);
    } else {
      router.push('/login');
    }
  }, [router]);

  const handleUpdateNama = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNama.trim()) {
      setToast({ message: 'Nama tidak boleh kosong', type: 'error' });
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/users/profile/update-nama', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ nama: formNama })
      });

      if (response.ok) {
        const updatedUser = { ...user, nama: formNama };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setToast({ message: 'Nama berhasil diperbarui', type: 'success' });
        setIsEditingNama(false);
      } else {
        const data = await response.json();
        setToast({ message: data.error || 'Gagal memperbarui nama', type: 'error' });
      }
    } catch (err) {
      setToast({ message: 'Terjadi kesalahan koneksi', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formPasswordOld || !formPasswordNew || !formPasswordConfirm) {
      setToast({ message: 'Semua field password harus diisi', type: 'error' });
      return;
    }

    if (formPasswordNew !== formPasswordConfirm) {
      setToast({ message: 'Password baru dan konfirmasi tidak cocok', type: 'error' });
      return;
    }

    if (formPasswordNew.length < 6) {
      setToast({ message: 'Password baru minimal 6 karakter', type: 'error' });
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/users/profile/update-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          passwordLama: formPasswordOld,
          passwordBaru: formPasswordNew
        })
      });

      if (response.ok) {
        setToast({ message: 'Password berhasil diperbarui', type: 'success' });
        setIsEditingPassword(false);
        setFormPasswordOld('');
        setFormPasswordNew('');
        setFormPasswordConfirm('');
      } else {
        const data = await response.json();
        setToast({ message: data.error || 'Gagal memperbarui password', type: 'error' });
      }
    } catch (err) {
      setToast({ message: 'Terjadi kesalahan koneksi', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRoleInfo = () => {
    if (!user) return null;

    const roleInfo: { [key: string]: { label: string; desc: string; color: string } } = {
      siswa: {
        label: 'Siswa',
        desc: 'Anda dapat meminjam alat dan melihat riwayat peminjaman',
        color: 'bg-green-100 text-green-800'
      },
      petugas: {
        label: 'Petugas',
        desc: 'Anda dapat mengelola peminjaman, validasi pengembalian, dan melihat laporan',
        color: 'bg-blue-100 text-blue-800'
      },
      administrator: {
        label: 'Administrator',
        desc: 'Anda memiliki akses penuh termasuk manajemen akun, alat, dan log aktivitas',
        color: 'bg-purple-100 text-purple-800'
      }
    };

    return roleInfo[user.role] || null;
  };

  if (loading) {
    return (
      <>
        <Sidebar />
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 ml-64 p-8 flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
        </div>
      </>
    );
  }

  if (!user) {
    return null;
  }

  const roleInfo = getRoleInfo();

  return (
    <>
      <Sidebar />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 ml-64 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Pengaturan Akun</h1>
          <p className="text-gray-600">Kelola informasi dan keamanan akun Anda</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Card */}
            <div className="bg-white rounded-lg shadow-md p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Informasi Profil</h2>

              {/* Username - Read Only */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Username</label>
                <div className="px-4 py-3 bg-gray-100 rounded-lg text-gray-600 font-mono">
                  {user.username}
                </div>
                <p className="text-xs text-gray-500 mt-1">Username tidak dapat diubah</p>
              </div>

              {/* Nama */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Nama Lengkap</label>
                {isEditingNama ? (
                  <form onSubmit={handleUpdateNama} className="space-y-3">
                    <input
                      type="text"
                      value={formNama}
                      onChange={(e) => setFormNama(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                      placeholder="Masukkan nama lengkap"
                      required
                    />
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-indigo-400"
                      >
                        {isSubmitting ? 'Menyimpan...' : 'Simpan'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditingNama(false);
                          setFormNama(user.nama);
                        }}
                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                      >
                        Batal
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="flex items-center justify-between bg-gray-50 px-4 py-3 rounded-lg">
                    <span className="text-gray-800">{user.nama}</span>
                    <button
                      onClick={() => setIsEditingNama(true)}
                      className="text-indigo-600 hover:text-indigo-800 font-semibold text-sm"
                    >
                      Ubah
                    </button>
                  </div>
                )}
              </div>

              {/* Email (Display from Username) */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Tanggal Dibuat</label>
                <div className="px-4 py-3 bg-gray-100 rounded-lg text-gray-600">
                  {new Date(user.created_at).toLocaleDateString('id-ID', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              </div>
            </div>

            {/* Password Card */}
            <div className="bg-white rounded-lg shadow-md p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Keamanan Akun</h2>

              {isEditingPassword ? (
                <form onSubmit={handleUpdatePassword} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Password Lama</label>
                    <input
                      type="password"
                      value={formPasswordOld}
                      onChange={(e) => setFormPasswordOld(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                      placeholder="Masukkan password lama"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Password Baru</label>
                    <input
                      type="password"
                      value={formPasswordNew}
                      onChange={(e) => setFormPasswordNew(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                      placeholder="Masukkan password baru (min. 6 karakter)"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Konfirmasi Password Baru</label>
                    <input
                      type="password"
                      value={formPasswordConfirm}
                      onChange={(e) => setFormPasswordConfirm(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                      placeholder="Konfirmasi password baru"
                      required
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-indigo-400"
                    >
                      {isSubmitting ? 'Menyimpan...' : 'Perbarui Password'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingPassword(false);
                        setFormPasswordOld('');
                        setFormPasswordNew('');
                        setFormPasswordConfirm('');
                      }}
                      className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Batal
                    </button>
                  </div>
                </form>
              ) : (
                <div className="flex items-center justify-between bg-gray-50 px-4 py-3 rounded-lg">
                  <div>
                    <p className="text-gray-800 font-semibold">Password</p>
                    <p className="text-sm text-gray-600">Terakhir diubah: tidak diketahui</p>
                  </div>
                  <button
                    onClick={() => setIsEditingPassword(true)}
                    className="text-indigo-600 hover:text-indigo-800 font-semibold text-sm"
                  >
                    Ubah Password
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-6">
            {/* Role Info Card */}
            {roleInfo && (
              <div className={`rounded-lg shadow-md p-6 ${roleInfo.color}`}>
                <h3 className="text-lg font-bold mb-2">Role Anda</h3>
                <p className="text-sm font-semibold mb-3">{roleInfo.label}</p>
                <p className="text-xs leading-relaxed">{roleInfo.desc}</p>
              </div>
            )}

            {/* Quick Stats */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Informasi Akun</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-600 font-semibold uppercase">ID Pengguna</p>
                  <p className="text-lg font-mono text-gray-900">#{user.id}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 font-semibold uppercase">Status</p>
                  <p className="text-lg text-green-600 font-semibold">Aktif</p>
                </div>
                <div className="pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-600 font-semibold uppercase">Bergabung sejak</p>
                  <p className="text-sm text-gray-700">
                    {new Date(user.created_at).toLocaleDateString('id-ID')}
                  </p>
                </div>
              </div>
            </div>

            {/* Help Card */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg shadow-md p-6">
              <h3 className="text-lg font-bold text-blue-900 mb-2">Bantuan</h3>
              <p className="text-sm text-blue-800 mb-3">
                Jika Anda memiliki pertanyaan atau mengalami masalah dengan akun Anda, hubungi administrator.
              </p>
              <button className="text-blue-600 hover:text-blue-800 font-semibold text-sm">
                Hubungi Support →
              </button>
            </div>
          </div>
        </div>

        {/* Toast */}
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </div>
    </>
  );
}
