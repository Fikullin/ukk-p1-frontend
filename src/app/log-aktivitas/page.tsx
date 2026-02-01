"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../components/Sidebar';
import Toast from '../../components/Toast';

interface LogAktivitas {
  id: number;
  user_id: number;
  user_nama: string;
  aktivitas: string;
  detail: string;
  created_at: string;
}

export default function LogAktivitasPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<LogAktivitas[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch('http://localhost:3001/api/log-aktivitas', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setLogs(data);
      } else if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
      } else if (response.status === 403) {
        setError('Anda tidak memiliki akses untuk melihat log aktivitas (hanya admin)');
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.error || `Gagal memuat data log aktivitas (HTTP ${response.status})`);
      }
    } catch (err) {
      console.error('Error fetching logs:', err);
      setError('Terjadi kesalahan koneksi ke server. Pastikan backend berjalan di http://localhost:3001');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [router]);

  const handleDeletePetugasLogs = async () => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus semua log aktivitas petugas?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/log-aktivitas/petugas', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setToast({ message: data.message, type: 'success' });
        // Refresh logs
        try {
          const fetchResponse = await fetch('http://localhost:3001/api/log-aktivitas', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          if (fetchResponse.ok) {
            const newData = await fetchResponse.json();
            setLogs(newData);
          }
        } catch (err) {
          console.error('Error refreshing logs:', err);
        }
      } else {
        const data = await response.json();
        setToast({ message: data.error || 'Gagal menghapus log aktivitas', type: 'error' });
      }
    } catch (err) {
      console.error('Error deleting logs:', err);
      setToast({ message: 'Terjadi kesalahan koneksi', type: 'error' });
    }
  };

  const filteredLogs = logs.filter(log =>
    log.user_nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.aktivitas.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.detail.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedLogs = filteredLogs.slice(startIndex, endIndex);

  // Reset to first page when search changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getActivityBadge = (aktivitas: string) => {
    switch (aktivitas) {
      case 'Peminjaman Alat':
        return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">📤 Peminjaman</span>;
      case 'Pengembalian Alat':
        return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">📥 Pengembalian</span>;
      case 'Login Sistem':
        return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">🔓 Login</span>;
      case 'Logout Sistem':
        return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">🔒 Logout</span>;
      case 'Update Data':
        return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">✏️ Update</span>;
      default:
        return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">{aktivitas}</span>;
    }
  };

  return (
    <>
      <Sidebar />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 ml-64 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Log Aktivitas Sistem</h1>
          <p className="text-gray-600">Riwayat lengkap aktivitas pengguna dalam sistem peminjaman alat</p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border-2 border-red-300 rounded-lg p-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-red-800 mb-2">Gagal Memuat Data</h3>
                <p className="text-sm text-red-700 mb-4">{error}</p>
                <div className="flex gap-2">
                  <button
                    onClick={fetchLogs}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors duration-200"
                  >
                    🔄 Coba Lagi
                  </button>
                  <button
                    onClick={() => router.push('/beranda')}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-medium transition-colors duration-200"
                  >
                    Kembali ke Beranda
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Cari berdasarkan pengguna, aktivitas, atau detail..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <button
                  onClick={handleDeletePetugasLogs}
                  className="ml-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium transition-colors duration-200"
                  title="Hapus semua log aktivitas petugas"
                >
                  🗑️ Hapus Log Petugas
                </button>
              </div>
              <div className="text-sm text-gray-600">
                Total: <span className="font-semibold">{filteredLogs.length}</span> log aktivitas
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-indigo-50 to-blue-50 border-b-2 border-indigo-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Waktu</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Pengguna</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Aktivitas</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Detail</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginatedLogs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                        {searchTerm ? 'Tidak ada hasil pencarian' : 'Tidak ada log aktivitas'}
                      </td>
                    </tr>
                  ) : (
                    paginatedLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {formatDate(log.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {log.user_nama}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {getActivityBadge(log.aktivitas)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700 max-w-xs truncate">
                          {log.detail}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-white rounded-lg shadow-md p-4 border-t flex items-center justify-between mt-4">
                <div className="text-sm text-gray-600">
                  Menampilkan {startIndex + 1} - {Math.min(endIndex, filteredLogs.length)} dari {filteredLogs.length} log
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
      </div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}
