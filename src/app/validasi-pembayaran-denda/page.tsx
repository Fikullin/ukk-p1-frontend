"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../components/Sidebar';
import Toast from '../../components/Toast';

interface PembayaranPending {
  id: number;
  user_id: number;
  user_nama: string;
  peminjaman_id: number;
  komoditas_nama: string;
  total_denda: number;
  denda_keterlambatan: number;
  denda_kerusakan: number;
  denda_hilang: number;
  jumlah_hari_telat: number;
  tanggal_pembayaran: string;
  created_at: string;
  status_pembayaran: string;
}

export default function ValidasiPembayaranDenda() {
  const router = useRouter();
  const [pendingPayments, setPendingPayments] = useState<PembayaranPending[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [validatingId, setValidatingId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
  const [approvedPayments, setApprovedPayments] = useState<PembayaranPending[]>([]);

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      const userData = JSON.parse(user);
      setUserRole(userData.role);
      
      // Check if user is petugas or administrator
      if (!['petugas', 'administrator'].includes(userData.role)) {
        router.push('/');
        return;
      }

      fetchPendingPayments();
      fetchApprovedPayments();
    } else {
      router.push('/login');
    }
  }, []);

  const fetchPendingPayments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/denda/pending`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPendingPayments(data);
      }

      setLoading(false);
    } catch (err) {
      console.error('Error fetching pending payments:', err);
      setError('Gagal memuat data pembayaran');
      setLoading(false);
    }
  };

  const fetchApprovedPayments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/denda/approved`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setApprovedPayments(data);
      }
    } catch (err) {
      console.error('Error fetching approved payments:', err);
    }
  };

  const handleValidatePayment = async (payment: PembayaranPending) => {
    setValidatingId(payment.id);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/denda/${payment.id}/validasi`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setToast({ message: 'Pembayaran berhasil divalidasi!', type: 'success' });
        // Remove from pending list
        setPendingPayments(pendingPayments.filter(p => p.id !== payment.id));
        // Add to approved list
        setApprovedPayments([payment, ...approvedPayments]);
        // Show print dialog after short delay
        setTimeout(() => {
          handlePrintReceipt(payment);
        }, 500);
      } else {
        const error = await response.json();
        setToast({ message: error.error || 'Gagal memvalidasi pembayaran', type: 'error' });
      }
    } catch (err) {
      console.error('Validation error:', err);
      setToast({ message: 'Gagal memvalidasi pembayaran', type: 'error' });
    } finally {
      setValidatingId(null);
    }
  };

  const handlePrintReceipt = (payment: PembayaranPending) => {
    const printWindow = window.open('', '', 'width=800,height=600');
    if (!printWindow) return;

    const today = new Date().toLocaleDateString('id-ID', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    let detailsDenda = `
      <tr>
        <td style='width: 60%;'>Keterlambatan (${payment.jumlah_hari_telat} hari):</td>
        <td style='text-align: right;'>Rp ${payment.denda_keterlambatan?.toLocaleString('id-ID') || '0'}</td>
      </tr>`;

    if (payment.denda_kerusakan > 0) {
      detailsDenda += `
      <tr>
        <td>Kerusakan Alat:</td>
        <td style='text-align: right;'>Rp ${payment.denda_kerusakan?.toLocaleString('id-ID') || '0'}</td>
      </tr>`;
    }

    if (payment.denda_hilang > 0) {
      detailsDenda += `
      <tr>
        <td>Alat Hilang:</td>
        <td style='text-align: right;'>Rp ${payment.denda_hilang?.toLocaleString('id-ID') || '0'}</td>
      </tr>`;
    }

    const notaHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset='utf-8'>
          <title>Nota Pembayaran Denda</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 20px; }
            .header h1 { margin: 0; font-size: 24px; }
            .header p { margin: 5px 0; color: #666; }
            .content { border: 1px solid #333; padding: 20px; }
            .section { margin-bottom: 15px; }
            .label { font-weight: bold; color: #333; }
            .value { color: #666; margin: 5px 0; }
            table { width: 100%; border-collapse: collapse; margin: 15px 0; }
            table td { padding: 8px; border-bottom: 1px solid #ddd; }
            .total { font-size: 18px; font-weight: bold; color: #2563eb; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #999; }
            .status { background-color: #dcfce7; color: #15803d; padding: 8px 12px; border-radius: 4px; display: inline-block; }
          </style>
        </head>
        <body>
          <div class='header'>
            <h1>NOTA PEMBAYARAN DENDA</h1>
            <p>Sistem Manajemen Peminjaman Alat</p>
          </div>
          <div class='content'>
            <div class='section'>
              <div class='label'>Tanggal Validasi:</div>
              <div class='value'>${today}</div>
            </div>
            <div class='section'>
              <div class='label'>Data Pembayaran:</div>
              <table>
                <tr>
                  <td style='width: 40%;'>Nama Siswa:</td>
                  <td>${payment.user_nama}</td>
                </tr>
                <tr>
                  <td>Barang:</td>
                  <td>${payment.komoditas_nama}</td>
                </tr>
                <tr>
                  <td>Tanggal Pembayaran:</td>
                  <td>${new Date(payment.tanggal_pembayaran).toLocaleDateString('id-ID')}</td>
                </tr>
              </table>
            </div>
            <div class='section'>
              <div class='label'>Rincian Denda:</div>
              <table>
                ${detailsDenda}
                <tr style='border-top: 2px solid #333; border-bottom: 2px solid #333;'>
                  <td class='label'>Total Denda:</td>
                  <td style='text-align: right; font-weight: bold;'>Rp ${payment.total_denda?.toLocaleString('id-ID') || '0'}</td>
                </tr>
              </table>
            </div>
            <div class='section' style='text-align: center;'>
              <div class='status'>✓ SUDAH DIVALIDASI</div>
            </div>
            <div class='footer'>
              <p>Terima kasih atas pembayaran denda. Bukti ini menunjukkan bahwa pembayaran telah divalidasi oleh petugas.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(notaHTML);
    printWindow.document.close();
    printWindow.print();
  };

  const totalPages = Math.ceil(pendingPayments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedPayments = pendingPayments.slice(startIndex, endIndex);

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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Validasi Pembayaran Denda</h1>
          <p className="text-gray-600">Periksa dan validasi pembayaran denda yang menunggu persetujuan</p>
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
            {/* Tab Navigation */}
            <div className="bg-white rounded-lg shadow mb-8">
              <div className="flex border-b">
                <button
                  onClick={() => {
                    setCurrentPage(1);
                    setActiveTab('pending');
                  }}
                  className={`flex-1 py-4 px-6 font-medium text-center transition-colors ${
                    activeTab === 'pending'
                      ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <span>Validasi Pembayaran</span>
                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                      activeTab === 'pending' ? 'bg-indigo-600 text-white' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {pendingPayments.length}
                    </span>
                  </div>
                </button>
                <button
                  onClick={() => {
                    setCurrentPage(1);
                    setActiveTab('history');
                  }}
                  className={`flex-1 py-4 px-6 font-medium text-center transition-colors ${
                    activeTab === 'history'
                      ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <span>Riwayat Pembayaran</span>
                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                      activeTab === 'history' ? 'bg-indigo-600 text-white' : 'bg-green-100 text-green-800'
                    }`}>
                      {approvedPayments.length}
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* Tab Content */}
            {activeTab === 'pending' ? (
              <>
                {/* Summary Card for Pending */}
                <div className="bg-white rounded-lg shadow p-6 mb-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm font-medium">Pembayaran Menunggu Validasi</p>
                      <p className="text-3xl font-bold text-yellow-600 mt-2">{pendingPayments.length}</p>
                    </div>
                    <div className="bg-yellow-100 rounded-full p-4">
                      <svg className="w-8 h-8 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 100-12 6 6 0 000 12zm0-5a1 1 0 00-1 1v2a1 1 0 102 0v-2a1 1 0 00-1-1zm0-6a1 1 0 100 2 1 1 0 000-2z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Payment List for Pending */}
                {pendingPayments.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">Tidak Ada Pembayaran Menunggu</h3>
                <p className="text-gray-500">Semua pembayaran denda sudah divalidasi</p>
              </div>
            ) : (
              <>
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Siswa</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Barang</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Denda</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal Pembayaran</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {paginatedPayments.map((payment, index) => (
                          <tr key={payment.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {startIndex + index + 1}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {payment.user_nama}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {payment.komoditas_nama}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-indigo-600">
                              {formatCurrency(payment.total_denda)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(payment.tanggal_pembayaran)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                              <button
                                onClick={() => handleValidatePayment(payment)}
                                disabled={validatingId === payment.id}
                                className="px-3 py-1 bg-green-500 text-white text-xs font-medium rounded hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1"
                              >
                                {validatingId === payment.id ? (
                                  <>
                                    <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                                    Validasi...
                                  </>
                                ) : (
                                  <>
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    Validasi
                                  </>
                                )}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="bg-white rounded-lg shadow-md p-4 border-t flex items-center justify-between mt-4">
                    <div className="text-sm text-gray-600">
                      Menampilkan {startIndex + 1} - {Math.min(endIndex, pendingPayments.length)} dari {pendingPayments.length} data
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
            ) : (
              <>
                {/* Summary Card for History */}
                <div className="bg-white rounded-lg shadow p-6 mb-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm font-medium">Riwayat Pembayaran Tervalidasi</p>
                      <p className="text-3xl font-bold text-green-600 mt-2">{approvedPayments.length}</p>
                    </div>
                    <div className="bg-green-100 rounded-full p-4">
                      <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Payment List for History */}
                {approvedPayments.length === 0 ? (
                  <div className="bg-white rounded-lg shadow p-8 text-center">
                    <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">Belum Ada Riwayat Pembayaran</h3>
                    <p className="text-gray-500">Pembayaran yang telah divalidasi akan muncul di sini</p>
                  </div>
                ) : (
                  <>
                    <div className="bg-white rounded-lg shadow-md overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Siswa</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Barang</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Denda</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal Pembayaran</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {approvedPayments.map((payment, index) => (
                              <tr key={payment.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {index + 1}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {payment.user_nama}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {payment.komoditas_nama}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-indigo-600">
                                  {formatCurrency(payment.total_denda)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {formatDate(payment.tanggal_pembayaran)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    ✓ Sudah Dibayar
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                                  <button
                                    onClick={() => handlePrintReceipt(payment)}
                                    className="px-3 py-1 bg-indigo-600 text-white text-xs font-medium rounded hover:bg-indigo-700 transition-colors inline-flex items-center gap-1"
                                  >
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                      <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                                    </svg>
                                    Cetak
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
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
