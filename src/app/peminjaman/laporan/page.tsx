"use client";

import React, { useState, useEffect } from 'react';
import Sidebar from '../../../components/Sidebar';
import Toast from '../../../components/Toast';

interface LaporanData {
  bulan: string;
  total_peminjaman: number;
  dikembalikan: number;
  belum_dikembalikan: number;
}

export default function LaporanPeminjaman() {
  const [data, setData] = useState<LaporanData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    fetchLaporan();
  }, []);

  const fetchLaporan = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/peminjaman/laporan', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        setData(result);
      } else if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      } else {
        setError('Gagal memuat laporan');
      }
    } catch (err) {
      setError('Terjadi kesalahan koneksi');
    } finally {
      setLoading(false);
    }
  };

  // Pagination logic
  const totalPages = Math.ceil(data.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = data.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [data]);

  const getTotalStats = () => {
    const totals = data.reduce((acc, item) => ({
      total_peminjaman: acc.total_peminjaman + item.total_peminjaman,
      dikembalikan: acc.dikembalikan + item.dikembalikan,
      belum_dikembalikan: acc.belum_dikembalikan + item.belum_dikembalikan
    }), { total_peminjaman: 0, dikembalikan: 0, belum_dikembalikan: 0 });
    return totals;
  };

  const getPersentaseKembali = () => {
    const totals = getTotalStats();
    if (totals.total_peminjaman === 0) return 0;
    return Math.round((totals.dikembalikan / totals.total_peminjaman) * 100);
  };

  const formatDate = (bulan: string) => {
    const [tahun, bln] = bulan.split('-');
    const bulanNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    return `${bulanNames[parseInt(bln) - 1]} ${tahun}`;
  };

  const stats = getTotalStats();
  const persentase = getPersentaseKembali();

  return (
    <>
      <Sidebar />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 ml-64 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Laporan Peminjaman</h1>
          <p className="text-gray-600">Laporan statistik dan analisis peminjaman alat</p>
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-indigo-600">
                <h3 className="text-sm font-semibold text-gray-600 mb-2">Total Peminjaman</h3>
                <p className="text-3xl font-bold text-indigo-600">{stats.total_peminjaman}</p>
                <p className="text-xs text-gray-500 mt-1">Semua waktu</p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-600">
                <h3 className="text-sm font-semibold text-gray-600 mb-2">Dikembalikan</h3>
                <p className="text-3xl font-bold text-green-600">{stats.dikembalikan}</p>
                <p className="text-xs text-gray-500 mt-1">{persentase}% dari total</p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-orange-600">
                <h3 className="text-sm font-semibold text-gray-600 mb-2">Belum Dikembalikan</h3>
                <p className="text-3xl font-bold text-orange-600">{stats.belum_dikembalikan}</p>
                <p className="text-xs text-gray-500 mt-1">Dalam peminjaman</p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-600">
                <h3 className="text-sm font-semibold text-gray-600 mb-2">Tingkat Pengembalian</h3>
                <p className="text-3xl font-bold text-purple-600">{persentase}%</p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div 
                    className="bg-purple-600 h-2 rounded-full" 
                    style={{ width: `${persentase}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Detail Table */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Riwayat Peminjaman per Bulan</h2>
              </div>

              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bulan</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Peminjaman</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dikembalikan</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Belum Dikembalikan</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Persentase Kembali</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                        Tidak ada data peminjaman
                      </td>
                    </tr>
                  ) : (
                    paginatedData.map((item, idx) => {
                      const persentaseItem = item.total_peminjaman === 0 
                        ? 0 
                        : Math.round((item.dikembalikan / item.total_peminjaman) * 100);
                      
                      return (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {formatDate(item.bulan)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full font-semibold">
                              {item.total_peminjaman}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full font-semibold">
                              {item.dikembalikan}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full font-semibold">
                              {item.belum_dikembalikan}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="flex items-center gap-2">
                              <div className="w-24 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-purple-600 h-2 rounded-full" 
                                  style={{ width: `${persentaseItem}%` }}
                                ></div>
                              </div>
                              <span className="font-semibold text-purple-600">{persentaseItem}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-white rounded-lg shadow-md p-4 border-t flex items-center justify-between mt-4">
                <div className="text-sm text-gray-600">
                  Menampilkan {startIndex + 1} - {Math.min(endIndex, data.length)} dari {data.length} data
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

            {/* Footer Info */}
            {data.length > 0 && (
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <span className="font-semibold">Catatan:</span> Data menampilkan statistik peminjaman alat dari 12 bulan terakhir. 
                  Tingkat pengembalian menunjukkan persentase alat yang berhasil dikembalikan dari total peminjaman.
                </p>
              </div>
            )}
          </>
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
