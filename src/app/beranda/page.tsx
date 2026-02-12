"use client";

import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import ConfirmModal from '../../components/ConfirmModal';
import Toast from '../../components/Toast';
import api from '../../lib/api';

interface User {
  id: number;
  username: string;
  nama: string;
  role: string;
  created_at: string;
}

interface Peminjaman {
  id: number;
  komoditas_nama: string;
  user_nama: string;
  tanggal_pinjam: string;
  jam_pinjam: string;
  tanggal_kembali: string;
  jam_kembali: string;
  status: string;
  jumlah_pinjam: number;
  return_status?: string;
}

interface SiswaStats {
  totalPeminjaman: number;
  aktif: number;
  dikembalikan: number;
}

interface PetugasStats {
  totalPeminjaman: number;
  hariIni: number;
  pendingReturns: number;
}

interface AdminStats {
  totalUsers: number;
  siswa: number;
  petugas: number;
  administrator: number;
  totalPeminjaman: number;
  aktif: number;
  dikembalikan: number;
}

export default function Beranda() {
  const [userRole, setUserRole] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [showReturnConfirm, setShowReturnConfirm] = useState(false);
  const [returnItemId, setReturnItemId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Siswa state
  const [currentBorrowings, setCurrentBorrowings] = useState<Peminjaman[]>([]);
  const [recentActivities, setRecentActivities] = useState<Peminjaman[]>([]);
  const [siswaStats, setSiswaStats] = useState<SiswaStats>({ totalPeminjaman: 0, aktif: 0, dikembalikan: 0 });

  // Petugas state
  const [todayBorrowings, setTodayBorrowings] = useState<Peminjaman[]>([]);
  const [petugasStats, setPetugasStats] = useState<PetugasStats>({ totalPeminjaman: 0, hariIni: 0, pendingReturns: 0 });

  // Admin state
  const [adminStats, setAdminStats] = useState<AdminStats>({
    totalUsers: 0,
    siswa: 0,
    petugas: 0,
    administrator: 0,
    totalPeminjaman: 0,
    aktif: 0,
    dikembalikan: 0
  });

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      const userData = JSON.parse(user);
      setUserRole(userData.role);
    }

    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem('token');

        if (userRole === 'siswa') {
          // Fetch siswa dashboard data
          const currentResponse = await api.get('/api/peminjaman/hari-ini', {
            headers: { Authorization: `Bearer ${token}` }
          });
          const recentResponse = await api.get('/api/peminjaman/riwayat', {
            headers: { Authorization: `Bearer ${token}` }
          });

          if (currentResponse.status === 200 && recentResponse.status === 200) {
            const currentData = currentResponse.data;
            const recentData = recentResponse.data;

            setCurrentBorrowings(currentData);
            setRecentActivities(recentData.slice(0, 4));

            const totalPeminjaman = recentData.length;
            const aktif = recentData.filter((p: Peminjaman) => p.status === 'dipinjam' || p.status === 'menunggu').length;
            const dikembalikan = recentData.filter((p: Peminjaman) => p.status === 'dikembalikan').length;
            setSiswaStats({ totalPeminjaman, aktif, dikembalikan });
          }
        } else if (userRole === 'petugas') {
          // Fetch petugas dashboard data
          const todayResponse = await api.get('/api/peminjaman/hari-ini', {
            headers: { Authorization: `Bearer ${token}` }
          });
          const recentResponse = await api.get('/api/peminjaman', {
            headers: { Authorization: `Bearer ${token}` }
          });

          if (todayResponse.status === 200 && recentResponse.status === 200) {
            const todayData = todayResponse.data;
            const recentData = recentResponse.data;

            setTodayBorrowings(todayData);
            setRecentActivities(recentData.slice(0, 4));

            const totalPeminjaman = recentData.length;
            const hariIni = todayData.length;
            const pendingReturns = recentData.filter((p: Peminjaman) => p.status !== 'dikembalikan').length;
            setPetugasStats({ totalPeminjaman, hariIni, pendingReturns });
          }
        } else if (userRole === 'administrator') {
          // Fetch admin dashboard data
          const usersResponse = await api.get('/api/users', {
            headers: { Authorization: `Bearer ${token}` }
          });
          const activitiesResponse = await api.get('/api/peminjaman', {
            headers: { Authorization: `Bearer ${token}` }
          });

          if (usersResponse.status === 200 && activitiesResponse.status === 200) {
            const usersData = usersResponse.data;
            const activitiesData = activitiesResponse.data;

            setRecentActivities(activitiesData.slice(0, 4));

            const totalUsers = usersData.length;
            const siswa = usersData.filter((u: User) => u.role === 'siswa').length;
            const petugas = usersData.filter((u: User) => u.role === 'petugas').length;
            const administrator = usersData.filter((u: User) => u.role === 'administrator').length;

            const totalPeminjaman = activitiesData.length;
            const aktif = activitiesData.filter((p: Peminjaman) => p.status === 'dipinjam' || p.status === 'menunggu').length;
            const dikembalikan = activitiesData.filter((p: Peminjaman) => p.status === 'dikembalikan').length;

            setAdminStats({
              totalUsers,
              siswa,
              petugas,
              administrator,
              totalPeminjaman,
              aktif,
              dikembalikan
            });
          }
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (userRole) {
      fetchDashboardData();
      
      // Auto-refresh every 5 seconds
      const interval = setInterval(fetchDashboardData, 5000);
      return () => clearInterval(interval);
    }
  }, [userRole]);

  const handleReturn = async (id: number) => {
    setReturnItemId(id);
    setShowReturnConfirm(true);
  };

  const confirmReturn = async () => {
    if (returnItemId === null) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      const now = new Date().toTimeString().split(' ')[0];

      const response = await api.put(`/api/peminjaman/${returnItemId}/return`, {
        tanggal_kembali: today,
        jam_kembali: now
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.status === 200) {
        setToast({ message: 'Barang berhasil dikembalikan', type: 'success' });
        // Reload page to refresh data
        setTimeout(() => window.location.reload(), 1500);
      } else {
        const data = response.data;
        setToast({ message: data.error || 'Gagal mengembalikan barang', type: 'error' });
      }
    } catch (_err) {
      setToast({ message: 'Terjadi kesalahan koneksi', type: 'error' });
    } finally {
      setShowReturnConfirm(false);
      setReturnItemId(null);
    }
  };

  if (loading) {
    return (
      <>
        <Sidebar />
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 ml-64 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Memuat dashboard...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Sidebar />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 ml-64 p-8">
        {/* Dashboard Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">
            {userRole === 'siswa' && 'Ringkasan peminjaman dan aktivitas Anda'}
            {userRole === 'petugas' && 'Ringkasan peminjaman dan pengembalian alat'}
            {userRole === 'administrator' && 'Ringkasan sistem peminjaman alat sekolah'}
          </p>
        </div>

        {/* Siswa Dashboard */}
        {userRole === 'siswa' && (
          <>
            {/* Siswa Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Total Peminjaman</h3>
                    <p className="text-2xl font-bold text-blue-600">{siswaStats.totalPeminjaman}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-yellow-500 rounded-lg flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Sedang Dipinjam</h3>
                    <p className="text-2xl font-bold text-yellow-600">{siswaStats.aktif}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Sudah Dikembalikan</h3>
                    <p className="text-2xl font-bold text-green-600">{siswaStats.dikembalikan}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Current Borrowings */}
            <div className="bg-white p-6 rounded-lg shadow-md mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Peminjaman Hari Ini</h2>
              {currentBorrowings.length === 0 ? (
                <p className="text-gray-500">Tidak ada peminjaman aktif hari ini</p>
              ) : (
                <div className="space-y-4">
                  {currentBorrowings.map((item) => (
                    <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-200">
                      <div>
                        <p className="text-gray-900 font-medium">{item.komoditas_nama}</p>
                        <p className="text-gray-500 text-sm">
                          Dipinjam: {new Date(item.tanggal_pinjam).toLocaleDateString('id-ID')} {item.jam_pinjam}
                        </p>
                      </div>
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        Dipinjam ({item.jumlah_pinjam})
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* Petugas Dashboard */}
        {userRole === 'petugas' && (
          <>
            {/* Petugas Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Total Peminjaman</h3>
                    <p className="text-2xl font-bold text-blue-600">{petugasStats.totalPeminjaman}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 4v10m0 0l-2-2m2 2l2-2m6-6v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6a2 2 0 012-2h8a2 2 0 012 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Peminjaman Hari Ini</h3>
                    <p className="text-2xl font-bold text-green-600">{petugasStats.hariIni}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-yellow-500 rounded-lg flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Menunggu Pengembalian</h3>
                    <p className="text-2xl font-bold text-yellow-600">{petugasStats.pendingReturns}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Today's Borrowings */}
            <div className="bg-white p-6 rounded-lg shadow-md mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Peminjaman Hari Ini</h2>
              {todayBorrowings.length === 0 ? (
                <p className="text-gray-500">Tidak ada peminjaman hari ini</p>
              ) : (
                <div className="space-y-4">
                  {todayBorrowings.map((item) => (
                    <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-200">
                      <div>
                        <p className="text-gray-900 font-medium">{item.komoditas_nama}</p>
                        <p className="text-gray-500 text-sm">
                          Oleh: {item.user_nama} | {new Date(item.tanggal_pinjam).toLocaleDateString('id-ID')} {item.jam_pinjam}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          item.status === 'dikembalikan' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {item.status === 'dikembalikan' ? 'Dikembalikan' : item.status === 'menunggu' ? 'Menunggu' : 'Dipinjam'} ({item.jumlah_pinjam})
                        </span>
                        {item.status === 'dipinjam' && item.return_status !== 'validated' && (
                          <button
                            onClick={() => handleReturn(item.id)}
                            className="bg-green-600 hover:bg-green-700 text-white text-sm px-3 py-1 rounded"
                          >
                            Kembalikan
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* Administrator Dashboard */}
        {userRole === 'administrator' && (
          <>
            {/* User Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Total Pengguna</h3>
                    <p className="text-2xl font-bold text-blue-600">{adminStats.totalUsers}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Siswa</h3>
                    <p className="text-2xl font-bold text-green-600">{adminStats.siswa}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-yellow-500 rounded-lg flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Petugas</h3>
                    <p className="text-2xl font-bold text-yellow-600">{adminStats.petugas}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Administrator</h3>
                    <p className="text-2xl font-bold text-purple-600">{adminStats.administrator}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Borrowing Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-indigo-500 rounded-lg flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Total Peminjaman</h3>
                    <p className="text-2xl font-bold text-indigo-600">{adminStats.totalPeminjaman}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Sedang Dipinjam</h3>
                    <p className="text-2xl font-bold text-orange-600">{adminStats.aktif}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-teal-500 rounded-lg flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Sudah Dikembalikan</h3>
                    <p className="text-2xl font-bold text-teal-600">{adminStats.dikembalikan}</p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Recent Activities - Common for all roles */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Aktivitas Terbaru</h2>
          {recentActivities.length === 0 ? (
            <p className="text-gray-500">Belum ada aktivitas peminjaman</p>
          ) : (
            <div className="space-y-4">
              {recentActivities.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-200">
                  <div>
                    <p className="text-gray-900 font-medium">{item.komoditas_nama}</p>
                    <p className="text-gray-500 text-sm">
                      {userRole === 'siswa' ? (
                        new Date(item.tanggal_pinjam).toLocaleDateString('id-ID') + ' ' + item.jam_pinjam
                      ) : (
                        item.user_nama + ' | ' + new Date(item.tanggal_pinjam).toLocaleDateString('id-ID') + ' ' + item.jam_pinjam
                      )}
                    </p>
                  </div>
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    item.status === 'dikembalikan' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {item.status === 'dikembalikan' ? 'Dikembalikan' : item.status === 'menunggu' ? 'Menunggu' : 'Dipinjam'} ({item.jumlah_pinjam})
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Return Confirmation Modal */}
      <ConfirmModal
        isOpen={showReturnConfirm}
        title="Kembalikan Barang"
        message="Apakah Anda yakin ingin menandai barang ini sebagai dikembalikan?"
        onConfirm={confirmReturn}
        onCancel={() => {
          setShowReturnConfirm(false);
          setReturnItemId(null);
        }}
        confirmText="Kembalikan"
        cancelText="Batal"
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
