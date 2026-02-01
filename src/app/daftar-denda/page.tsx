"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../components/Sidebar';
import Toast from '../../components/Toast';

interface Denda {
  id: number;
  peminjaman_id: number;
  user_id: number;
  komoditas_nama: string;
  jumlah_hari_telat: number;
  denda_keterlambatan: number;
  denda_kerusakan: number;
  denda_hilang: number;
  total_denda: number;
  status_pembayaran: string;
  tanggal_pembayaran?: string;
  tanggal_pinjam: string;
  deadline: string;
  tanggal_kembali: string;
  created_at: string;
}

interface DendaSummary {
  total_denda_outstanding: number;
  belum_dibayar: number;
  sudah_dibayar: number;
  total_denda_records: number;
  denda_pending: number;
}

export default function DaftarDenda() {
  const router = useRouter();
  const [dendaList, setDendaList] = useState<Denda[]>([]);
  const [dendaSummary, setDendaSummary] = useState<DendaSummary>({
    total_denda_outstanding: 0,
    belum_dibayar: 0,
    sudah_dibayar: 0,
    total_denda_records: 0,
    denda_pending: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [userRole, setUserRole] = useState<string>('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      const userData = JSON.parse(user);
      setUserId(userData.id);
      setUserRole(userData.role);
      fetchDendaData(userData.id);
    } else {
      router.push('/login');
    }
  }, []);

  const fetchDendaData = async (id: number) => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch denda list
      const listResponse = await fetch(`http://localhost:3001/api/users/${id}/denda`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // Fetch denda summary
      const summaryResponse = await fetch(`http://localhost:3001/api/users/${id}/denda/summary`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (listResponse.ok) {
        const data = await listResponse.json();
        setDendaList(data);
      }

      if (summaryResponse.ok) {
        const summary = await summaryResponse.json();
        setDendaSummary(summary);
      }

      setLoading(false);
    } catch (err) {
      console.error('Error fetching denda data:', err);
      setError('Gagal memuat data denda');
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(dendaList.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedDenda = dendaList.slice(startIndex, endIndex);

  const getStatusBadge = (status: string) => {
    return status === 'sudah_dibayar' ? (
      <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
        ✓ Sudah Dibayar
      </span>
    ) : (
      <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
        ⚠ Belum Dibayar
      </span>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('id-ID');
  };

  return (
    <>
      <Sidebar />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 ml-64 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Daftar Denda</h1>
          <p className="text-gray-600">Kelola dan lihat riwayat denda peminjaman Anda</p>
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
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              {/* Total Outstanding */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Total Denda Aktif</p>
                    <p className="text-2xl font-bold text-red-600 mt-2">
                      {formatCurrency(dendaSummary.belum_dibayar || 0)}
                    </p>
                  </div>
                  <div className="bg-red-100 rounded-full p-3">
                    <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Paid */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Sudah Dibayar</p>
                    <p className="text-2xl font-bold text-green-600 mt-2">
                      {formatCurrency(dendaSummary.sudah_dibayar || 0)}
                    </p>
                  </div>
                  <div className="bg-green-100 rounded-full p-3">
                    <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Pending Count */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Denda Menunggu</p>
                    <p className="text-2xl font-bold text-orange-600 mt-2">
                      {dendaSummary.denda_pending || 0}
                    </p>
                  </div>
                  <div className="bg-orange-100 rounded-full p-3">
                    <svg className="w-6 h-6 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 100-12 6 6 0 000 12zm0-5a1 1 0 00-1 1v2a1 1 0 102 0v-2a1 1 0 00-1-1zm0-6a1 1 0 100 2 1 1 0 000-2z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Total Records */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Total Riwayat Denda</p>
                    <p className="text-2xl font-bold text-blue-600 mt-2">
                      {dendaSummary.total_denda_records || 0}
                    </p>
                  </div>
                  <div className="bg-blue-100 rounded-full p-3">
                    <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                      <path fillRule="evenodd" d="M4 5a2 2 0 012-2 1 1 0 000 2H3a1 1 0 00-1 1v12a1 1 0 001 1h14a1 1 0 001-1V6a1 1 0 00-1-1h3a1 1 0 000-2 2 2 0 00-2 2v12a2 2 0 01-2-2V5a1 1 0 00-1-1H4z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Denda List */}
            {dendaList.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                  <path fillRule="evenodd" d="M4 5a2 2 0 012-2 1 1 0 000 2H3a1 1 0 00-1 1v12a1 1 0 001 1h14a1 1 0 001-1V6a1 1 0 00-1-1h3a1 1 0 000-2 2 2 0 00-2 2v12a2 2 0 01-2-2V5a1 1 0 00-1-1H4z" clipRule="evenodd" />
                </svg>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">Tidak Ada Denda</h3>
                <p className="text-gray-500">Anda tidak memiliki riwayat denda. Pertahankan barang peminjaman Anda dalam kondisi baik!</p>
              </div>
            ) : (
              <>
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Barang</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal Pinjam</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deadline</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal Kembali</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rincian Denda</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Denda</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {paginatedDenda.map((denda, index) => (
                        <tr key={denda.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {startIndex + index + 1}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {denda.komoditas_nama}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(denda.tanggal_pinjam)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(denda.deadline)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(denda.tanggal_kembali)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <div className="space-y-1 text-xs">
                              {denda.denda_keterlambatan > 0 && (
                                <div className="text-orange-600">
                                  Telat: {denda.jumlah_hari_telat} hari ({formatCurrency(denda.denda_keterlambatan)})
                                </div>
                              )}
                              {denda.denda_kerusakan > 0 && (
                                <div className="text-red-600">
                                  Rusak: {formatCurrency(denda.denda_kerusakan)}
                                </div>
                              )}
                              {denda.denda_hilang > 0 && (
                                <div className="text-red-800 font-semibold">
                                  Hilang: {formatCurrency(denda.denda_hilang)}
                                </div>
                              )}
                              {denda.total_denda === 0 && (
                                <div className="text-green-600">
                                  Tidak ada denda
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                            {formatCurrency(denda.total_denda)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {getStatusBadge(denda.status_pembayaran)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="bg-white rounded-lg shadow-md p-4 border-t flex items-center justify-between mt-4">
                    <div className="text-sm text-gray-600">
                      Menampilkan {startIndex + 1} - {Math.min(endIndex, dendaList.length)} dari {dendaList.length} data
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
              </>
            )}
          </>
        )}

        {/* Toast Notification */}
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
