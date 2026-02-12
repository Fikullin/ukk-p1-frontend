"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../components/Sidebar';
import ConfirmModal from '../../components/ConfirmModal';
import BorrowModal from '../../components/BorrowModal';
import KomoditasModal from '../../components/KomoditasModal';
import Toast from '../../components/Toast';

interface Komoditas {
  id: number;
  nama: string;
  deskripsi: string;
  jumlah_total: number;
  jumlah_tersedia: number;
  kategori_id: number | null;
  kategori_nama?: string;
  created_at: string;
}

export default function Komoditas() {
  const [tools, setTools] = useState<Komoditas[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTool, setEditingTool] = useState<Komoditas | null>(null);
  const [showBorrowModal, setShowBorrowModal] = useState(false);
  const [selectedToolForBorrow, setSelectedToolForBorrow] = useState<Komoditas | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [toolToDelete, setToolToDelete] = useState<number | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    nama: '',
    deskripsi: '',
    jumlah_total: 0,
    kategori_id: null as number | null
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

  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Fetch komoditas data on component mount
  useEffect(() => {
    fetchKomoditas();
    setCurrentPage(1);
  }, []);

  const fetchKomoditas = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3001/api/komoditas', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTools(data);
        setError(null);
      } else {
        setError('Gagal memuat data komoditas');
      }
    } catch (error) {
      setError('Terjadi kesalahan koneksi');
    } finally {
      setLoading(false);
    }
  };

  // Pagination logic
  const totalPages = Math.ceil(tools.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTools = tools.slice(startIndex, endIndex);

  const handleAdd = () => {
    setEditingTool(null);
    setFormData({ nama: '', deskripsi: '', jumlah_total: 0, kategori_id: null });
    setShowAddModal(true);
  };

  const handleAddSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('http://localhost:3001/api/komoditas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        setShowAddModal(false);
        fetchKomoditas();
        setToast({ message: 'Komoditas berhasil ditambahkan', type: 'success' });
      } else {
        const respData = await response.json();
        setToast({ message: respData.error || 'Gagal menambah komoditas', type: 'error' });
      }
    } catch (_error) {
      setToast({ message: 'Terjadi kesalahan koneksi', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (tool: Komoditas) => {
    setEditingTool(tool);
    setFormData({
      nama: tool.nama,
      deskripsi: tool.deskripsi,
      jumlah_total: tool.jumlah_total,
      kategori_id: tool.kategori_id || null
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (data: any) => {
    if (!editingTool) return;
    setIsSubmitting(true);
    try {
      const response = await fetch(`http://localhost:3001/api/komoditas/${editingTool.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        setShowEditModal(false);
        fetchKomoditas();
        setToast({ message: 'Komoditas berhasil diupdate', type: 'success' });
      } else {
        const respData = await response.json();
        setToast({ message: respData.error || 'Gagal mengupdate komoditas', type: 'error' });
      }
    } catch (_error) {
      setToast({ message: 'Terjadi kesalahan koneksi', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    setToolToDelete(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (toolToDelete === null) return;

    try {
      const response = await fetch(`http://localhost:3001/api/komoditas/${toolToDelete}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        setTools(tools.filter(tool => tool.id !== toolToDelete));
        setToast({ message: 'Komoditas berhasil dihapus', type: 'success' });
      } else {
        const data = await response.json();
        setToast({ message: data.error || 'Gagal menghapus komoditas', type: 'error' });
      }
    } catch (_error) {
      setToast({ message: 'Terjadi kesalahan koneksi', type: 'error' });
    } finally {
      setShowDeleteConfirm(false);
      setToolToDelete(null);
    }
  };

  const handlePinjam = (tool: Komoditas) => {
    setSelectedToolForBorrow(tool);
    setShowBorrowModal(true);
  };

  const confirmBorrow = async (quantity: number) => {
    if (!selectedToolForBorrow) return;

    try {
      const response = await fetch('http://localhost:3001/api/peminjaman', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          komoditas_id: selectedToolForBorrow.id,
          jumlah_pinjam: quantity,
          tanggal_pinjam: new Date().toISOString().split('T')[0]
        })
      });

      const data = await response.json();
      if (response.ok) {
        setToast({ message: `Berhasil meminjam ${selectedToolForBorrow.nama}. Status: Menunggu validasi petugas`, type: 'success' });
        // Update local state to reflect reduced availability
        setTools(tools.map(tool =>
          tool.id === selectedToolForBorrow.id
            ? { ...tool, jumlah_tersedia: tool.jumlah_tersedia - quantity }
            : tool
        ));
        // Redirect user to their peminjaman riwayat so they can see the new "Menunggu" status
        router.push('/peminjaman/riwayat');
      } else {
        setToast({ message: data.error || 'Gagal meminjam alat', type: 'error' });
      }
    } catch (_error) {
      setToast({ message: 'Terjadi kesalahan koneksi', type: 'error' });
    } finally {
      setShowBorrowModal(false);
      setSelectedToolForBorrow(null);
    }
  };

  return (
    <>
      <Sidebar />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 ml-64 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Daftar Alat</h1>
          <p className="text-gray-600">Daftar semua alat yang tersedia untuk dipinjam</p>
        </div>

        {(userRole === 'petugas' || userRole === 'administrator') && (
          <div className="mb-6">
            <button
              onClick={handleAdd}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-300"
            >
              Tambah Alat Baru
            </button>
          </div>
        )}

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
            <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Alat</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kategori</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jumlah Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tersedia</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedTools.map((tool) => (
                <tr key={tool.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{tool.nama}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tool.kategori_nama || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tool.jumlah_total}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tool.jumlah_tersedia}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {userRole === 'siswa' ? (
                      <button
                        onClick={() => handlePinjam(tool)}
                        disabled={tool.jumlah_tersedia === 0}
                        className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-1 px-3 rounded-lg shadow-md transition duration-300 text-xs"
                      >
                        Pinjam
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => handleEdit(tool)}
                          className="text-indigo-600 hover:text-indigo-900 mr-4"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(tool.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Hapus
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Menampilkan {startIndex + 1} - {Math.min(endIndex, tools.length)} dari {tools.length} data
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
      </div>

      {/* Borrow Modal */}
      <BorrowModal
        isOpen={showBorrowModal}
        toolName={selectedToolForBorrow?.nama || ''}
        availableQuantity={selectedToolForBorrow?.jumlah_tersedia || 0}
        onConfirm={confirmBorrow}
        onCancel={() => {
          setShowBorrowModal(false);
          setSelectedToolForBorrow(null);
        }}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="Hapus Komoditas"
        message="Apakah Anda yakin ingin menghapus komoditas ini? Tindakan ini tidak dapat dibatalkan."
        onConfirm={confirmDelete}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setToolToDelete(null);
        }}
        confirmText="Hapus"
        cancelText="Batal"
        isDangerous={true}
      />

      {/* Add Modal */}
      <KomoditasModal
        isOpen={showAddModal}
        isEditing={false}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddSubmit}
        initialData={{ nama: '', deskripsi: '', jumlah_total: 0, kategori_id: null }}
        isSubmitting={isSubmitting}
      />

      {/* Edit Modal */}
      <KomoditasModal
        isOpen={showEditModal}
        isEditing={true}
        onClose={() => setShowEditModal(false)}
        onSubmit={handleEditSubmit}
        initialData={editingTool ? {
          nama: editingTool.nama,
          deskripsi: editingTool.deskripsi,
          jumlah_total: editingTool.jumlah_total,
          kategori_id: editingTool.kategori_id || null
        } : undefined}
        isSubmitting={isSubmitting}
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
