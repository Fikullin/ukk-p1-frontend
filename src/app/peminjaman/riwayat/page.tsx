"use client";

import React, { useState, useEffect, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../../components/Sidebar';import Toast from '../../../components/Toast';
interface RiwayatPeminjaman {
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
  return_status?: string;
}

export default function RiwayatPeminjaman() {
  const router = useRouter();
  const [riwayat, setRiwayat] = useState<RiwayatPeminjaman[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>('');
  const canManage = ['petugas', 'administrator', 'admin'].includes(userRole);
  const [selectedItem, setSelectedItem] = useState<RiwayatPeminjaman | null>(null);
  const [expandedRows, setExpandedRows] = useState<number[]>([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [returnMessage, setReturnMessage] = useState('');
  const [itemToReturn, setItemToReturn] = useState<RiwayatPeminjaman | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    const fetchRiwayat = async () => {
      try {
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('user');
        if (user) {
          const userData = JSON.parse(user);
          setUserRole(userData.role);
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/peminjaman/riwayat`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setRiwayat(data);
        } else if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          router.push('/login');
        } else {
          setError('Gagal memuat data riwayat peminjaman');
        }
      } catch (err) {
        setError('Terjadi kesalahan koneksi');
      } finally {
        setLoading(false);
      }
    };

    fetchRiwayat();
  }, []);

  // Pagination logic
  const totalPages = Math.ceil(riwayat.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedRiwayat = riwayat.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [riwayat]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'dikembalikan':
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
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

  const handleView = (id: number) => {
    setExpandedRows(prev => prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]);
  };

  const handleEdit = (item: RiwayatPeminjaman) => {
    setSelectedItem(item);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedItem) return;

    try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/peminjaman/${selectedItem.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          tanggal_kembali: selectedItem.tanggal_kembali,
          jam_kembali: selectedItem.jam_kembali
        })
      });

      if (response.ok) {
        setToast({ message: 'Data berhasil diperbarui', type: 'success' });
        setIsEditModalOpen(false);
        // Refresh data
        const fetchRiwayat = async () => {
          try {
      const token = localStorage.getItem('token');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/peminjaman/riwayat`, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });

            if (response.ok) {
              const data = await response.json();
              setRiwayat(data);
            }
          } catch (err) {
            console.error('Error refreshing data:', err);
          }
        };
        fetchRiwayat();
      } else {
        const data = await response.json();
        setToast({ message: data.error || 'Gagal memperbarui data', type: 'error' });
      }
    } catch (_error) {
      setToast({ message: 'Terjadi kesalahan koneksi', type: 'error' });
    }
  };

  const handleOpenReturnModal = (item: RiwayatPeminjaman) => {
    setItemToReturn(item);
    setReturnMessage('');
    setIsReturnModalOpen(true);
  };

  const handleConfirmReturn = async () => {
    if (!itemToReturn) return;

    try {
      const now = new Date();
      const tanggal_kembali = now.toISOString().split('T')[0];
      const jam_kembali = now.toTimeString().split(' ')[0];

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/peminjaman/${itemToReturn.id}/request-return`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          tanggal_rencana_kembali: tanggal_kembali,
          jam_rencana_kembali: jam_kembali,
          pesan: returnMessage
        })
      });

      if (response.ok) {
        setToast({ message: 'Permintaan pengembalian berhasil dikirim', type: 'success' });
        setIsReturnModalOpen(false);
        setReturnMessage('');
        setItemToReturn(null);
        // Refresh data
        const fetchRiwayat = async () => {
          try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/peminjaman/riwayat`, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });

            if (response.ok) {
              const data = await response.json();
              setRiwayat(data);
            }
          } catch (err) {
            console.error('Error refreshing data:', err);
          }
        };
        fetchRiwayat();
      } else {
        const data = await response.json();
        setToast({ message: data.error || 'Gagal mengirim permintaan pengembalian', type: 'error' });
      }
    } catch (err) {
      console.error('Return request error:', err);
      setToast({ message: 'Terjadi kesalahan koneksi', type: 'error' });
    }
  };

  const validateReturn = async (id: number) => {
    try {
      const now = new Date();
      const tanggal_kembali = now.toISOString().split('T')[0];
      const jam_kembali = now.toTimeString().split(' ')[0];

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/peminjaman/${id}/request-return`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          tanggal_kembali,
          jam_kembali
        })
      });

      if (response.ok) {
        setToast({ message: 'Pengembalian berhasil divalidasi', type: 'success' });
        // Immediately update local state
        setRiwayat(prev => prev.map(item =>
          item.id === id
            ? { ...item, status: 'dikembalikan', return_status: 'validated', tanggal_kembali, jam_kembali }
            : item
        ));
        // Refresh data
        const fetchRiwayat = async () => {
          try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/peminjaman/riwayat`, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });

            if (response.ok) {
              const data = await response.json();
              setRiwayat(data);
            } else {
              setToast({ message: 'Gagal memperbarui data, namun validasi berhasil', type: 'info' });
            }
          } catch (err) {
            console.error('Error refreshing data:', err);
            setToast({ message: 'Gagal memperbarui data, namun validasi berhasil', type: 'info' });
          }
        };
        fetchRiwayat();
      } else {
        const data = await response.json();
        setToast({ message: data.error || 'Gagal memvalidasi pengembalian', type: 'error' });
      }
    } catch (_error) {
      setToast({ message: 'Terjadi kesalahan koneksi', type: 'error' });
    }
  };

  return (
    <>
      <Sidebar />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 ml-64 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {userRole === 'siswa' ? 'Riwayat Peminjaman Saya' : 'Riwayat Peminjaman'}
          </h1>
          <p className="text-gray-600">
            {userRole === 'siswa'
              ? 'Daftar riwayat peminjaman Anda yang telah dikembalikan'
              : 'Daftar riwayat peminjaman alat sekolah'
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
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status Return</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                    </>
                  )}
                  { !canManage && (
                    <>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Alat</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jam Pinjam</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jam Kembali</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status Return</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {riwayat.length === 0 ? (
                  <tr>
                    <td colSpan={userRole === 'siswa' ? 6 : 7} className="px-6 py-4 text-center text-gray-500">
                      Tidak ada data riwayat peminjaman
                    </td>
                  </tr>
                ) : (
                  paginatedRiwayat.map((item) => (
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
                        {userRole !== 'siswa' && (
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
                                <button onClick={() => handleView(item.id)} className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 hover:bg-indigo-200 transition duration-200" title="Lihat Detail">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                </button>
                                <button onClick={() => handleEdit(item)} className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-amber-100 text-amber-600 hover:bg-amber-200 transition duration-200" title="Edit">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                </button>
                                {item.return_status === 'pending' && (
                                  <button
                                    onClick={() => validateReturn(item.id)}
                                    className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 transition duration-200"
                                    title="Validasi pengembalian"
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
                                <button onClick={() => handleView(item.id)} className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 hover:bg-indigo-200 transition duration-200" title="Lihat Detail">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                </button>
                                {(item.status === 'menunggu' || item.status === 'dipinjam') && (
                                  <button 
                                    onClick={() => item.status === 'dipinjam' ? handleOpenReturnModal(item) : setToast({ message: 'Peminjaman belum divalidasi oleh petugas', type: 'info' })}
                                    className={`inline-flex items-center justify-center w-8 h-8 rounded-lg transition duration-200 ${item.status === 'dipinjam' ? 'bg-cyan-100 text-cyan-600 hover:bg-cyan-200' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                                    disabled={item.status !== 'dipinjam'}
                                    title={item.status === 'dipinjam' ? 'Ajukan pengembalian' : 'Menunggu validasi petugas'}
                                  >
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
                          <td colSpan={userRole === 'siswa' ? 7 : 8} className="px-6 py-4 bg-gray-50">
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
                  Menampilkan {startIndex + 1} - {Math.min(endIndex, riwayat.length)} dari {riwayat.length} data
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
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full" id="my-modal">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
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
                    <strong>Petugas:</strong> {selectedItem.petugas_nama || '-'}<br />
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
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full" id="edit-modal">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3 text-center">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Edit Peminjaman</h3>
                <div className="mt-2 px-7 py-3">
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">Tanggal Kembali</label>
                    <input
                      type="date"
                      value={selectedItem.tanggal_kembali || ''}
                      onChange={(e) => setSelectedItem({ ...selectedItem, tanggal_kembali: e.target.value })}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">Jam Kembali</label>
                    <input
                      type="time"
                      value={selectedItem.jam_kembali || ''}
                      onChange={(e) => setSelectedItem({ ...selectedItem, jam_kembali: e.target.value })}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    />
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
      </div>

      {/* Return Modal */}
      {isReturnModalOpen && itemToReturn && (
        <div className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden animate-in">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white">Konfirmasi Pengembalian Barang</h3>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-5">
              {/* Item Details */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
                <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Detail Barang</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="text-sm text-gray-600">Nama Barang</span>
                    <span className="text-sm font-semibold text-gray-900">{itemToReturn.komoditas_nama}</span>
                  </div>
                  <div className="h-px bg-green-200"></div>
                  <div className="flex justify-between items-start">
                    <span className="text-sm text-gray-600">Tanggal Pinjam</span>
                    <span className="text-sm font-semibold text-gray-900">{new Date(itemToReturn.tanggal_pinjam).toLocaleDateString('id-ID')}</span>
                  </div>
                  <div className="h-px bg-green-200"></div>
                  <div className="flex justify-between items-start">
                    <span className="text-sm text-gray-600">Jumlah Unit</span>
                    <span className="text-sm font-semibold text-gray-900">{itemToReturn.jumlah_pinjam} unit</span>
                  </div>
                </div>
              </div>

              {/* Message Section */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Catatan/Pesan (Opsional)
                </label>
                <textarea
                  value={returnMessage}
                  onChange={(e) => setReturnMessage(e.target.value)}
                  placeholder="Tambahkan catatan tentang kondisi barang, kerusakan, atau informasi penting lainnya..."
                  className="w-full px-4 py-3 text-sm text-gray-700 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200 transition-all h-24 resize-none placeholder-gray-400"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 flex gap-3">
              <button
                onClick={() => {
                  setIsReturnModalOpen(false);
                  setReturnMessage('');
                  setItemToReturn(null);
                }}
                className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmReturn}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-lg hover:from-green-600 hover:to-green-700 shadow-lg hover:shadow-xl transition-all focus:outline-none focus:ring-2 focus:ring-green-300"
              >
                Kembalikan
              </button>
            </div>
          </div>
        </div>
      )}

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
