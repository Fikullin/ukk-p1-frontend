"use client";

import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import ConfirmModal from '../../components/ConfirmModal';
import Toast from '../../components/Toast';

interface Jurusan {
  id: number;
  nama: string;
  deskripsi: string | null;
  created_at: string;
}

export default function Jurusan() {
  const [jurusan, setJurusan] = useState<Jurusan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingJurusan, setEditingJurusan] = useState<Jurusan | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [jurusanToDelete, setJurusanToDelete] = useState<number | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [formData, setFormData] = useState({
    nama: '',
    deskripsi: ''
  });

  useEffect(() => {
    fetchJurusan();
  }, []);

  const fetchJurusan = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/jurusan', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        setJurusan(data);
      }
    } catch (error) {
      console.error('Error fetching jurusan:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingJurusan
        ? `http://localhost:3001/api/jurusan/${editingJurusan.id}`
        : 'http://localhost:3001/api/jurusan';

      const method = editingJurusan ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (response.ok) {
        setToast({ message: editingJurusan ? 'Jurusan berhasil diupdate' : 'Jurusan berhasil ditambahkan', type: 'success' });
        setShowModal(false);
        setFormData({ nama: '', deskripsi: '' });
        setEditingJurusan(null);
        fetchJurusan();
      } else {
        setToast({ message: data.error || 'Terjadi kesalahan', type: 'error' });
      }
    } catch (_error) {
      setToast({ message: 'Terjadi kesalahan koneksi', type: 'error' });
    }
  };

  const handleEdit = (jurusanItem: Jurusan) => {
    setEditingJurusan(jurusanItem);
    setFormData({
      nama: jurusanItem.nama,
      deskripsi: jurusanItem.deskripsi || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    setJurusanToDelete(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (jurusanToDelete === null) return;

    try {
      const response = await fetch(`http://localhost:3001/api/jurusan/${jurusanToDelete}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        setToast({ message: 'Jurusan berhasil dihapus', type: 'success' });
        fetchJurusan();
      } else {
        const data = await response.json();
        setToast({ message: data.error || 'Gagal menghapus jurusan', type: 'error' });
      }
    } catch (_error) {
      setToast({ message: 'Terjadi kesalahan koneksi', type: 'error' });
    } finally {
      setShowDeleteConfirm(false);
      setJurusanToDelete(null);
    }
  };

  const openAddModal = () => {
    setEditingJurusan(null);
    setFormData({ nama: '', deskripsi: '' });
    setShowModal(true);
  };

  if (loading) {
    return (
      <>
        <Sidebar />
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 ml-64 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Memuat data...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Sidebar />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 ml-64">
        <div className="py-20 px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">Manajemen Jurusan</h1>
          <button
            onClick={openAddModal}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-8 rounded-lg shadow-lg transition duration-300 mb-8"
          >
            Tambah Jurusan Baru
          </button>

          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Jurusan</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deskripsi</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal Dibuat</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {jurusan.map(item => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.nama}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{item.deskripsi || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(item.created_at).toLocaleDateString('id-ID')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleEdit(item)}
                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingJurusan ? 'Edit Jurusan' : 'Tambah Jurusan'}
              </h3>
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Nama Jurusan
                  </label>
                  <input
                    type="text"
                    value={formData.nama}
                    onChange={(e) => setFormData({...formData, nama: e.target.value})}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Deskripsi
                  </label>
                  <textarea
                    value={formData.deskripsi}
                    onChange={(e) => setFormData({...formData, deskripsi: e.target.value})}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    rows={3}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                  >
                    {editingJurusan ? 'Update' : 'Tambah'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="Hapus Jurusan"
        message="Apakah Anda yakin ingin menghapus jurusan ini? Tindakan ini tidak dapat dibatalkan."
        onConfirm={confirmDelete}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setJurusanToDelete(null);
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
