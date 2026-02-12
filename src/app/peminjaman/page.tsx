"use client";

import React, { useState, useEffect, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../components/Sidebar';
import ConfirmModal from '../../components/ConfirmModal';
import Toast from '../../components/Toast';
import ValidatePeminjamanModal from '../../components/ValidatePeminjamanModal';
import ReturnValidationModal from '../../components/ReturnValidationModal';

interface Peminjaman {
  id: number;
  komoditas_nama: string;
  user_nama: string;
  tanggal_pinjam: string;
  jam_pinjam: string;
  tanggal_kembali: string;
  jam_kembali: string;
  petugas_nama: string;
  status: string;
  jumlah_pinjam: number;
  return_status?: string; // pending, validated, or null
  return_date?: string;
  return_time?: string;
  deadline?: string;
  kondisi_barang?: string;
  validated_by?: number;
}

export default function PeminjamanPage() {
  const router = useRouter();
  const [peminjaman, setPeminjaman] = useState<Peminjaman[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>('');
  const canManage = ['petugas', 'administrator', 'admin'].includes(userRole);
  
  const [selectedItem, setSelectedItem] = useState<Peminjaman | null>(null);
  const [expandedRows, setExpandedRows] = useState<number[]>([]);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [selectedReturnItem, setSelectedReturnItem] = useState<Peminjaman | null>(null);

  // New state for validation modals
  const [isValidatePeminjamanOpen, setIsValidatePeminjamanOpen] = useState(false);
  const [selectedValidateItem, setSelectedValidateItem] = useState<Peminjaman | null>(null);
  const [isReturnValidationOpen, setIsReturnValidationOpen] = useState(false);
  const [selectedReturnValidationItem, setSelectedReturnValidationItem] = useState<Peminjaman | null>(null);
  const [validatingId, setValidatingId] = useState<number | null>(null);

  const [showReturnConfirm, setShowReturnConfirm] = useState(false);
  const [itemToReturn, setItemToReturn] = useState<number | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Initialize role immediately on mount
  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      try {
        const userData = JSON.parse(user);
        console.log('[MOUNT] Setting initial role:', userData.role);
        setUserRole(userData.role || '');
      } catch (e) {
        console.error('[MOUNT] Error parsing user:', e);
      }
    }
  }, []);

  // Fetch peminjaman data
  useEffect(() => {
    const fetchPeminjaman = async () => {
      try {
        const token = localStorage.getItem('token');

        const response = await fetch('http://localhost:3001/api/peminjaman', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setPeminjaman(data);
        } else if (response.status === 401 || response.status === 403) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          router.push('/login');
        } else {
          setError('Gagal memuat data peminjaman');
        }
      } catch (err) {
        console.error('[FETCH] Error:', err);
        setError('Terjadi kesalahan koneksi');
      } finally {
        setLoading(false);
      }
    };

    fetchPeminjaman();
  }, []);

  // Pagination logic
  const totalPages = Math.ceil(peminjaman.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedPeminjaman = peminjaman.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [peminjaman]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'dipinjam':
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
            Dipinjam
          </span>
        );
      case 'dikembalikan':
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
            Dikembalikan
          </span>
        );
      default:
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  const handleView = (item: Peminjaman) => {
    setSelectedItem(item);
    setIsViewModalOpen(true);
  };

  const handleEdit = (item: Peminjaman) => {
    setSelectedItem({ ...item });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedItem) return;

    try {
      const response = await fetch(`http://localhost:3001/api/peminjaman/${selectedItem.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          komoditas_nama: selectedItem.komoditas_nama
        })
      });

      if (response.ok) {
        setToast({
          message: 'Peminjaman berhasil diperbarui',
          type: 'success'
        });
        setIsEditModalOpen(false);
        const updatedPeminjaman = peminjaman.map(p =>
          p.id === selectedItem.id ? selectedItem : p
        );
        setPeminjaman(updatedPeminjaman);
      } else {
        setToast({
          message: 'Gagal memperbarui peminjaman',
          type: 'error'
        });
      }
    } catch (err) {
      setToast({
        message: 'Terjadi kesalahan koneksi',
        type: 'error'
      });
    }
  };

  const handleStudentReturnRequest = (item: Peminjaman) => {
    setSelectedReturnItem(item);
    setIsReturnModalOpen(true);
  };

  const confirmStudentReturn = async () => {
    if (!selectedReturnItem) return;

    try {
      const response = await fetch(
        `http://localhost:3001/api/peminjaman/${selectedReturnItem.id}/return-request`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.ok) {
        setToast({
          message: 'Permintaan pengembalian berhasil dikirim',
          type: 'success'
        });
        const updatedPeminjaman = peminjaman.map(p =>
          p.id === selectedReturnItem.id
            ? { ...p, status: 'dikembalikan', return_status: 'pending' }
            : p
        );
        setPeminjaman(updatedPeminjaman);
      } else {
        const errorData = await response.json();
        setToast({
          message: errorData.error || 'Gagal mengirim permintaan pengembalian',
          type: 'error'
        });
      }
    } catch (err) {
      console.error('Return request error:', err);
      setToast({ message: 'Terjadi kesalahan koneksi', type: 'error' });
    } finally {
      setIsReturnModalOpen(false);
      setSelectedReturnItem(null);
    }
  };

  const cancelStudentReturn = () => {
    setIsReturnModalOpen(false);
    setSelectedReturnItem(null);
  };

  // Handler untuk membuka modal validasi peminjaman
  const handleOpenValidatePeminjaman = (item: Peminjaman) => {
    setSelectedValidateItem(item);
    setIsValidatePeminjamanOpen(true);
  };

  // Handler submit validasi peminjaman
  const handleValidatePeminjamanSubmit = async (data: { deadline: string }) => {
    if (!selectedValidateItem) return;

    setValidatingId(selectedValidateItem.id);
    try {
      const response = await fetch(
        `http://localhost:3001/api/peminjaman/${selectedValidateItem.id}/validate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ deadline: data.deadline })
        }
      );

      if (response.ok) {
        setToast({
          message: `Peminjaman berhasil divalidasi dengan deadline ${data.deadline}`,
          type: 'success'
        });
        setIsValidatePeminjamanOpen(false);
        setSelectedValidateItem(null);
        const updatedPeminjaman = peminjaman.map(p =>
          p.id === selectedValidateItem.id
            ? { ...p, deadline: data.deadline, validated_by: 1 }
            : p
        );
        setPeminjaman(updatedPeminjaman);
      } else {
        const errorData = await response.json();
        setToast({
          message: errorData.error || 'Gagal memvalidasi peminjaman',
          type: 'error'
        });
      }
    } catch (err) {
      setToast({
        message: 'Terjadi kesalahan koneksi',
        type: 'error'
      });
    } finally {
      setValidatingId(null);
    }
  };

  return (
    <>
      <Sidebar />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 ml-64 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {userRole === 'siswa' ? 'Peminjaman Saya' : 'Data Peminjaman'}
          </h1>
          <p className="text-gray-600">
            {userRole === 'siswa'
              ? 'Daftar semua peminjaman Anda'
              : 'Daftar semua peminjaman di sistem'
            }
          </p>
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
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Detail</th>
                  {canManage && (
                    <>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Siswa</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Alat</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jam Pinjam</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jam Kembali</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status Barang</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status Validasi</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                    </>
                  )}
                  { !canManage && (
                    <>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Alat</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jam Pinjam</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jam Kembali</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status Barang</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status Validasi</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {peminjaman.length === 0 ? (
                  <tr>
                    <td colSpan={userRole === 'siswa' ? 8 : 9} className="px-6 py-4 text-center text-gray-500">
                      Tidak ada data peminjaman
                    </td>
                  </tr>
                ) : (
                  paginatedPeminjaman.map((item) => (
                    <Fragment key={item.id}>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <button
                            onClick={() => setExpandedRows(prev => prev.includes(item.id) ? prev.filter(id => id !== item.id) : [...prev, item.id])}
                            className="text-gray-500 hover:text-gray-700"
                          >
                            {expandedRows.includes(item.id) ? '▼' : '▶'}
                          </button>
                        </td>
                        {canManage && (
                          <>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {item.user_nama}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {item.komoditas_nama}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(item.tanggal_pinjam).toLocaleDateString('id-ID')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {item.jam_pinjam || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {item.status === 'dikembalikan' ? (item.jam_kembali || '-') : '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {getStatusBadge(item.status)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {item.return_status === 'pending' ? (
                                <div className="flex items-center gap-2">
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                    ⏳ Menunggu
                                  </span>
                                  <button
                                    onClick={() => handleOpenReturnValidation(item)}
                                    className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 transition duration-200"
                                    title="Validasi pengembalian dengan kondisi barang"
                                  >
                                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                  </button>
                                </div>
                              ) : item.return_status === 'validated' ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  ✓ Divalidasi
                                </span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex gap-2">
                                <button onClick={() => handleView(item)} className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 hover:bg-indigo-200 transition duration-200" title="Lihat Detail">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                </button>
                                {item.status === 'menunggu' && (
                                  <button
                                    onClick={() => handleOpenValidatePeminjaman(item)}
                                    className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-purple-100 text-purple-600 hover:bg-purple-200 transition duration-200"
                                    title="Validasi peminjaman (set deadline)"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                  </button>
                                )}
                                <button onClick={() => handleEdit(item)} className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-amber-100 text-amber-600 hover:bg-amber-200 transition duration-200" title="Edit">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                </button>
                                {item.status === 'dikembalikan' && item.return_status === 'pending' && (
                                  <button
                                    onClick={() => handleOpenReturnValidation(item)}
                                    className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 transition duration-200"
                                    title="Validasi pengembalian dengan kondisi barang"
                                  >
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                  </button>
                                )}
                              </div>
                            </td>
                          </>
                        )}
                        {!canManage && (
                          <>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {item.komoditas_nama}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(item.tanggal_pinjam).toLocaleDateString('id-ID')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {item.jam_pinjam || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {item.status === 'dikembalikan' ? (item.jam_kembali || '-') : '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {getStatusBadge(item.status)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {item.return_status === 'pending' ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                  ⏳ Menunggu
                                </span>
                              ) : item.return_status === 'validated' ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  ✓ Divalidasi
                                </span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex gap-2">
                                <button onClick={() => handleView(item)} className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 hover:bg-indigo-200 transition duration-200" title="Lihat Detail">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                </button>
                                {item.status === 'dipinjam' && (
                                  <button onClick={() => handleStudentReturnRequest(item)} className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-cyan-100 text-cyan-600 hover:bg-cyan-200 transition duration-200" title="Kembalikan barang">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                  </button>
                                )}
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                      {expandedRows.includes(item.id) && (
                        <tr>
                          <td colSpan={canManage ? 9 : 8} className="px-6 py-4 bg-gray-50">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <h4 className="text-sm font-medium text-gray-900 mb-2">Detail Peminjaman</h4>
                                <div className="space-y-1 text-sm text-gray-600">
                                  <p><strong>ID:</strong> {item.id}</p>
                                  <p><strong>Status:</strong> {getStatusBadge(item.status)}</p>
                                  <p><strong>Jumlah Pinjam:</strong> {item.jumlah_pinjam} unit</p>
                                  {item.petugas_nama && <p><strong>Petugas:</strong> {item.petugas_nama}</p>}
                                </div>
                              </div>
                              <div>
                                <h4 className="text-sm font-medium text-gray-900 mb-2">Informasi Waktu</h4>
                                <div className="space-y-1 text-sm text-gray-600">
                                  <p><strong>Tanggal Pinjam:</strong> {new Date(item.tanggal_pinjam).toLocaleDateString('id-ID')}</p>
                                  <p><strong>Jam Pinjam:</strong> {item.jam_pinjam || '-'}</p>
                                  <p><strong>Tanggal Kembali:</strong> {item.status === 'dikembalikan' ? (item.tanggal_kembali ? new Date(item.tanggal_kembali).toLocaleDateString('id-ID') : '-') : '-'}</p>
                                  <p><strong>Jam Kembali:</strong> {item.status === 'dikembalikan' ? (item.jam_kembali || '-') : '-'}</p>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))
                )}
              </tbody>
            </table>
              </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-white rounded-lg shadow-md p-4 border-t flex items-center justify-between mt-4">
                <div className="text-sm text-gray-600">
                  Menampilkan {startIndex + 1} - {Math.min(endIndex, peminjaman.length)} dari {peminjaman.length} data
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
          </div>
        )}

        {/* View Modal */}
        {isViewModalOpen && selectedItem && (
          <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center" id="my-modal">
            <div className="p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3 text-center">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Detail Peminjaman</h3>
                <div className="mt-2 px-7 py-3">
                  <p className="text-sm text-gray-500">
                    <strong>ID:</strong> {selectedItem.id}<br />
                    <strong>Alat:</strong> {selectedItem.komoditas_nama}<br />
                    <strong>Nama Siswa:</strong> {selectedItem.user_nama}<br />
                    <strong>Tanggal Pinjam:</strong> {new Date(selectedItem.tanggal_pinjam).toLocaleDateString('id-ID')}<br />
                    <strong>Jam Pinjam:</strong> {selectedItem.jam_pinjam || '-'}<br />
                    <strong>Tanggal Kembali:</strong> {selectedItem.status === 'dikembalikan' ? (selectedItem.tanggal_kembali ? new Date(selectedItem.tanggal_kembali).toLocaleDateString('id-ID') : '-') : '-'}<br />
                    <strong>Jam Kembali:</strong> {selectedItem.status === 'dikembalikan' ? (selectedItem.jam_kembali || '-') : '-'}<br />
                    <strong>Status:</strong> {selectedItem.status}<br />
                    <strong>Jumlah Pinjam:</strong> {selectedItem.jumlah_pinjam}
                  </p>
                </div>
                <div className="flex items-center px-4 py-3">
                  <button onClick={() => setIsViewModalOpen(false)} className="px-4 py-2 bg-blue-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300">
                    Tutup
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {isEditModalOpen && selectedItem && (
          <div className="fixed inset-0 left-64 backdrop-blur-sm flex items-center justify-center" id="edit-modal">
            <div className="p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
              <div className="mt-3 text-center">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Edit Peminjaman</h3>
                <div className="mt-2 px-7 py-3">
                  <div className="grid grid-cols-2 gap-6">
                    {/* Data Siswa (Read-only) */}
                    <div>
                      <h4 className="text-md font-semibold text-gray-800 mb-4">Data Siswa</h4>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-gray-700 text-sm font-bold mb-1">Nama Siswa</label>
                          <input
                            type="text"
                            value={selectedItem.user_nama}
                            disabled
                            className="bg-gray-100 border border-gray-300 rounded py-2 px-3 text-gray-700 w-full"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-700 text-sm font-bold mb-1">ID Peminjaman</label>
                          <input
                            type="text"
                            value={selectedItem.id}
                            disabled
                            className="bg-gray-100 border border-gray-300 rounded py-2 px-3 text-gray-700 w-full"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Detail Alat (Editable) */}
                    <div>
                      <h4 className="text-md font-semibold text-gray-800 mb-4">Detail Alat</h4>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-gray-700 text-sm font-bold mb-2">Nama Alat</label>
                          <input
                            type="text"
                            value={selectedItem.komoditas_nama}
                            onChange={(e) => setSelectedItem({ ...selectedItem, komoditas_nama: e.target.value })}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-700 text-sm font-bold mb-1">Tanggal Pinjam</label>
                          <input
                            type="date"
                            value={new Date(selectedItem.tanggal_pinjam).toISOString().split('T')[0]}
                            disabled
                            className="bg-gray-100 border border-gray-300 rounded py-2 px-3 text-gray-700 w-full"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-700 text-sm font-bold mb-1">Jam Pinjam</label>
                          <input
                            type="time"
                            value={selectedItem.jam_pinjam || ''}
                            disabled
                            className="bg-gray-100 border border-gray-300 rounded py-2 px-3 text-gray-700 w-full"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-700 text-sm font-bold mb-2">Jam Kembali</label>
                          <input
                            type="time"
                            value={selectedItem.status === 'dikembalikan' ? selectedItem.jam_kembali : ''}
                            disabled
                            className="bg-gray-100 border border-gray-300 rounded py-2 px-3 text-gray-700 w-full"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-700 text-sm font-bold mb-1">Status</label>
                          <input
                            type="text"
                            value={selectedItem.status}
                            disabled
                            className="bg-gray-100 border border-gray-300 rounded py-2 px-3 text-gray-700 w-full"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center px-4 py-3 space-x-2">
                  <button onClick={handleSaveEdit} className="px-4 py-2 bg-green-500 text-white text-base font-medium rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-300">
                    Simpan
                  </button>
                  <button onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 bg-gray-500 text-white text-base font-medium rounded-md shadow-sm hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300">
                    Batal
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Return Modal */}
        {isReturnModalOpen && selectedReturnItem && (
          <div className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-50" id="return-modal">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-white">Konfirmasi Pengembalian</h3>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100 mb-6">
                  <p className="text-sm text-gray-700">
                    <strong className="block text-gray-900 mb-2">Apakah Anda yakin ingin mengembalikan barang ini?</strong>
                    <span className="block text-gray-600">{selectedReturnItem.komoditas_nama} ({selectedReturnItem.jumlah_pinjam} unit)</span>
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="bg-gray-50 px-6 py-4 flex gap-3">
                <button 
                  onClick={cancelStudentReturn} 
                  className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
                >
                  Batal
                </button>
                <button 
                  onClick={confirmStudentReturn} 
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-lg hover:from-green-600 hover:to-green-700 shadow-lg hover:shadow-xl transition-all focus:outline-none focus:ring-2 focus:ring-green-300"
                >
                  Kembalikan
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Return Confirmation Modal */}
      <ConfirmModal
        isOpen={showReturnConfirm}
        title="Validasi Pengembalian"
        message="Apakah Anda yakin ingin memvalidasi pengembalian barang ini?"
        onConfirm={() => {}}
        onCancel={() => {
          setShowReturnConfirm(false);
          setItemToReturn(null);
        }}
        confirmText="Validasi"
        cancelText="Batal"
      />

      {/* Validate Peminjaman Modal */}
      <ValidatePeminjamanModal
        isOpen={isValidatePeminjamanOpen}
        peminjaman={selectedValidateItem}
        onClose={() => {
          setIsValidatePeminjamanOpen(false);
          setSelectedValidateItem(null);
        }}
        onConfirm={handleValidatePeminjamanSubmit}
        loading={validatingId === selectedValidateItem?.id}
      />

      {/* Return Validation Modal */}
      <ReturnValidationModal
        isOpen={isReturnValidationOpen}
        peminjaman={selectedReturnValidationItem}
        onClose={() => {
          setIsReturnValidationOpen(false);
          setSelectedReturnValidationItem(null);
        }}
        onConfirm={handleValidateReturnSubmit}
        loading={validatingId === selectedReturnValidationItem?.id}
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
  // Handler untuk membuka modal validasi return
  const handleOpenReturnValidation = (item: Peminjaman) => {
    setSelectedReturnValidationItem(item);
    setIsReturnValidationOpen(true);
  };

  // Handler submit validasi return
  const handleValidateReturnSubmit = async (data: {
    tanggal_kembali: string;
    jam_kembali?: string;
    kondisi_barang: 'baik' | 'rusak' | 'hilang';
  }) => {
    if (!selectedReturnValidationItem) return;

    setValidatingId(selectedReturnValidationItem.id);
    try {
      const response = await fetch(
        `http://localhost:3001/api/peminjaman/${selectedReturnValidationItem.id}/validate-return`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            tanggal_kembali: data.tanggal_kembali,
            jam_kembali: data.jam_kembali || null,
            kondisi_barang: data.kondisi_barang
          })
        }
      );

      if (response.ok) {
        const responseData = await response.json();
        const denda = responseData.denda;
        let message = `Pengembalian berhasil divalidasi - Kondisi: ${data.kondisi_barang}`;
        if (denda.totalFine > 0) {
          message += ` - Denda: Rp ${denda.totalFine.toLocaleString('id-ID')}`;
        }
        setToast({
          message,
          type: 'success'
        });
        setIsReturnValidationOpen(false);
        setSelectedReturnValidationItem(null);
        const updatedPeminjaman = peminjaman.map(p =>
          p.id === selectedReturnValidationItem.id
            ? { ...p, return_status: 'validated' }
            : p
        );
        setPeminjaman(updatedPeminjaman);
      } else {
        const errorData = await response.json();
        setToast({
          message: errorData.error || 'Gagal memvalidasi pengembalian',
          type: 'error'
        });
      }
    } catch (err) {
      setToast({
        message: 'Terjadi kesalahan koneksi',
        type: 'error'
      });
    } finally {
      setValidatingId(null);
    }
  };
