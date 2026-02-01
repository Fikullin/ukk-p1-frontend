"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Sidebar from '../../components/Sidebar';
import Toast from '../../components/Toast';

interface User {
  id: number;
  username: string;
  nama: string;
  role: string;
  created_at: string;
}

export default function ManajemenAkun() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleFilter = searchParams.get('role');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  
  // Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    nama: '',
    role: 'siswa'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      const userData = JSON.parse(user);
      setUserRole(userData.role);
      
      if (userData.role !== 'administrator') {
        router.push('/beranda');
        return;
      }
    }

    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Filter berdasarkan role jika ada parameter
        const filteredData = roleFilter 
          ? data.filter((user: User) => user.role === roleFilter)
          : data;
        setUsers(filteredData);
      } else if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
      } else {
        setError('Gagal memuat data pengguna');
      }
    } catch (err) {
      setError('Terjadi kesalahan koneksi');
    } finally {
      setLoading(false);
    }
  };

  // Pagination logic
  const totalPages = Math.ceil(users.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedUsers = users.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [users]);

  const handleAddUser = () => {
    setEditingUserId(null);
    setFormData({
      username: '',
      password: '',
      nama: '',
      role: 'siswa'
    });
    setIsModalOpen(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUserId(user.id);
    setFormData({
      username: user.username,
      password: '',
      nama: user.nama,
      role: user.role
    });
    setIsModalOpen(true);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      
      if (editingUserId) {
        // Update user
        const updateData: any = {
          nama: formData.nama,
          role: formData.role
        };
        
        // Hanya kirim password jika diisi
        if (formData.password) {
          updateData.password = formData.password;
        }

        const response = await fetch(`http://localhost:3001/api/users/${editingUserId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(updateData)
        });

        if (response.ok) {
          setToast({ message: 'Pengguna berhasil diperbarui', type: 'success' });
          setIsModalOpen(false);
          fetchUsers();
        } else {
          const data = await response.json();
          setToast({ message: data.error || 'Gagal memperbarui pengguna', type: 'error' });
        }
      } else {
        // Create user
        const response = await fetch('http://localhost:3001/api/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(formData)
        });

        if (response.ok) {
          setToast({ message: 'Pengguna berhasil ditambahkan', type: 'success' });
          setIsModalOpen(false);
          fetchUsers();
        } else {
          const data = await response.json();
          setToast({ message: data.error || 'Gagal menambahkan pengguna', type: 'error' });
        }
      }
    } catch (err) {
      setToast({ message: 'Terjadi kesalahan koneksi', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus pengguna ini?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setToast({ message: 'Pengguna berhasil dihapus', type: 'success' });
        fetchUsers();
      } else {
        const data = await response.json();
        setToast({ message: data.error || 'Gagal menghapus pengguna', type: 'error' });
      }
    } catch (err) {
      setToast({ message: 'Terjadi kesalahan koneksi', type: 'error' });
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'administrator':
        return <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">Admin</span>;
      case 'petugas':
        return <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">Petugas</span>;
      case 'siswa':
        return <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Siswa</span>;
      default:
        return <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">{role}</span>;
    }
  };

  const getRoleName = (role: string) => {
    switch (role) {
      case 'administrator':
        return 'Administrator';
      case 'petugas':
        return 'Petugas';
      case 'siswa':
        return 'Siswa';
      default:
        return role;
    }
  };

  return (
    <>
      <Sidebar />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 ml-64 p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Manajemen Akun</h1>
            <p className="text-gray-600">
              {roleFilter ? `Pengguna dengan role ${getRoleName(roleFilter)}` : 'Kelola akun pengguna sistem'}
            </p>
          </div>
          <button
            onClick={handleAddUser}
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            + Tambah Pengguna
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
          </div>
        ) : error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal Dibuat</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                      Tidak ada pengguna
                    </td>
                  </tr>
                ) : (
                  paginatedUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {user.username}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.nama}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {getRoleBadge(user.role)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.created_at).toLocaleDateString('id-ID')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditUser(user)}
                            className="text-indigo-600 hover:text-indigo-800 transition-colors"
                            title="Edit pengguna"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-red-600 hover:text-red-800 transition-colors"
                            title="Hapus pengguna"
                          >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-white rounded-lg shadow-md p-4 border-t flex items-center justify-between mt-4">
                <div className="text-sm text-gray-600">
                  Menampilkan {startIndex + 1} - {Math.min(endIndex, users.length)} dari {users.length} pengguna
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 bg-indigo-600 text-white rounded-lg disabled:bg-gray-300 hover:bg-indigo-700 transition-colors text-sm"
                  >
                    ← Sebelumnya
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-2.5 py-1 rounded text-sm font-medium transition-colors ${
                          currentPage === page
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 bg-indigo-600 text-white rounded-lg disabled:bg-gray-300 hover:bg-indigo-700 transition-colors text-sm"
                  >
                    Berikutnya →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Add/Edit User Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                {editingUserId ? 'Edit Pengguna' : 'Tambah Pengguna Baru'}
              </h3>
              <form onSubmit={handleSubmitForm} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                  <input
                    type="text"
                    required
                    disabled={!!editingUserId}
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="Masukkan username"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
                  <input
                    type="text"
                    required
                    value={formData.nama}
                    onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Masukkan nama lengkap"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input
                    type="password"
                    required={!editingUserId}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder={editingUserId ? 'Kosongkan jika tidak ingin mengubah password' : 'Masukkan password'}
                  />
                  {editingUserId && (
                    <p className="text-xs text-gray-500 mt-1">Kosongkan untuk tidak mengubah password</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="siswa">Siswa</option>
                    <option value="petugas">Petugas</option>
                    <option value="administrator">Administrator</option>
                  </select>
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:bg-indigo-400"
                  >
                    {isSubmitting ? 'Menyimpan...' : 'Simpan'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

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
