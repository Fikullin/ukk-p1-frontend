"use client";

import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import ConfirmModal from '../../components/ConfirmModal';
import Toast from '../../components/Toast';

interface Kategori {
  id: number;
  nama: string;
  deskripsi: string;
  created_at: string;
  updated_at: string;
}

export default function Kategori() {
  const [categories, setCategories] = useState<Kategori[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Kategori | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<number | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    nama: '',
    deskripsi: ''
  });

  const [userRole, setUserRole] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const user = localStorage.getItem('user');
      if (user) {
        const userData = JSON.parse(user);
        return userData.role || '';
      }
    }
    return '';
  });

  // Fetch kategori data on component mount
  useEffect(() => {
    fetchKategori();
  }, []);

  const fetchKategori = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3001/api/kategori', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCategories(data);
        setError(null);
      } else {
        setError('Gagal memuat data kategori');
      }
    } catch (error) {
      setError('Terjadi kesalahan koneksi');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingCategory(null);
    setFormData({ nama: '', deskripsi: '' });
    setShowAddModal(true);
  };

  const handleAddSubmit = async () => {
    if (!formData.nama.trim()) {
      setToast({ message: 'Nama kategori tidak boleh kosong', type: 'error' });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('http://localhost:3001/api/kategori', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const result = await response.json();
        setShowAddModal(false);
        fetchKategori();
        setToast({ message: 'Kategori berhasil ditambahkan', type: 'success' });
      } else {
        const respData = await response.json();
        setToast({ message: respData.error || 'Gagal menambah kategori', type: 'error' });
      }
    } catch (_error) {
      setToast({ message: 'Terjadi kesalahan koneksi', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (category: Kategori) => {
    setEditingCategory(category);
    setFormData({
      nama: category.nama,
      deskripsi: category.deskripsi
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async () => {
    if (!editingCategory) return;
    if (!formData.nama.trim()) {
      setToast({ message: 'Nama kategori tidak boleh kosong', type: 'error' });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`http://localhost:3001/api/kategori/${editingCategory.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setShowEditModal(false);
        fetchKategori();
        setToast({ message: 'Kategori berhasil diupdate', type: 'success' });
      } else {
        const respData = await response.json();
        setToast({ message: respData.error || 'Gagal mengupdate kategori', type: 'error' });
      }
    } catch (_error) {
      setToast({ message: 'Terjadi kesalahan koneksi', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    setCategoryToDelete(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (categoryToDelete === null) return;

    try {
      const response = await fetch(`http://localhost:3001/api/kategori/${categoryToDelete}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        setCategories(categories.filter(cat => cat.id !== categoryToDelete));
        setToast({ message: 'Kategori berhasil dihapus', type: 'success' });
      } else {
        const data = await response.json();
        setToast({ message: data.error || 'Gagal menghapus kategori', type: 'error' });
      }
    } catch (_error) {
      setToast({ message: 'Terjadi kesalahan koneksi', type: 'error' });
    } finally {
      setShowDeleteConfirm(false);
      setCategoryToDelete(null);
    }
  };

  // Check if user is authorized
  if (userRole && !['petugas', 'administrator'].includes(userRole)) {
    return (
      <>
        <Sidebar />
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 ml-64 p-8">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            Anda tidak memiliki akses ke halaman ini.
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Sidebar />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 ml-64 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Manajemen Kategori</h1>
          <p className="text-gray-600">Kelola kategori alat yang tersedia di sistem</p>
        </div>

        <div className="mb-6">
          <button
            onClick={handleAdd}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-300"
          >
            + Tambah Kategori
          </button>
        </div>

        {loading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className="mt-2 text-gray-600">Memuat data...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {!loading && !error && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {categories.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">Belum ada kategori. Silakan tambahkan kategori baru.</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Kategori</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deskripsi</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dibuat</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {categories.map((category, index) => (
                    <tr key={category.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{category.nama}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{category.deskripsi || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(category.created_at).toLocaleDateString('id-ID')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleEdit(category)}
                          className="text-indigo-600 hover:text-indigo-900 mr-4 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(category.id)}
                          className="text-red-600 hover:text-red-900 transition-colors"
                        >
                          Hapus
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {showEditModal ? 'Edit Kategori' : 'Tambah Kategori Baru'}
              </h2>
              <p className="text-gray-600 text-sm mt-1">
                {showEditModal ? 'Perbarui informasi kategori' : 'Tambahkan kategori baru ke sistem'}
              </p>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              if (showEditModal) {
                handleEditSubmit();
              } else {
                handleAddSubmit();
              }
            }} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nama Kategori <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  placeholder="Contoh: Elektronik, Perangkat Keras, Software"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Deskripsi <span className="text-gray-400 text-xs">(Opsional)</span>
                </label>
                <textarea
                  value={formData.deskripsi}
                  onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                  placeholder="Tuliskan deskripsi kategori..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition resize-none"
                />
              </div>

              <div className="flex gap-3 pt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setShowEditModal(false);
                  }}
                  className="flex-1 px-4 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold disabled:bg-indigo-400 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Menyimpan...' : showEditModal ? 'Perbarui' : 'Tambah'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="Hapus Kategori"
        message="Apakah Anda yakin ingin menghapus kategori ini? Tindakan ini tidak dapat dibatalkan."
        onConfirm={confirmDelete}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setCategoryToDelete(null);
        }}
        confirmText="Hapus"
        cancelText="Batal"
        isDangerous={true}
      />

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
}
