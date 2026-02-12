"use client";

import React, { useEffect, useState } from 'react';
import Sidebar from '../../../components/Sidebar';
import Toast from '../../../components/Toast';
import ConfirmModal from '../../../components/ConfirmModal';

interface PendingDenda {
  id: number;
  peminjaman_id: number;
  user_id: number;
  komoditas_nama: string;
  user_nama: string;
  total_denda: number;
  tanggal_pengajuan_pembayaran?: string;
  created_at: string;
}

export default function ValidasiDendaPage() {
  const [list, setList] = useState<PendingDenda[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmId, setConfirmId] = useState<number | null>(null);

  useEffect(() => { fetchPending(); }, []);

  const fetchPending = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/denda/pending', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      if (res.ok) {
        const data = await res.json();
        setList(data || []);
      } else {
        setToast({ message: 'Gagal memuat data', type: 'error' });
      }
    } catch (err) {
      setToast({ message: 'Terjadi kesalahan koneksi', type: 'error' });
    } finally { setLoading(false); }
  };

  const handleValidateClick = (id: number) => {
    setConfirmId(id);
    setShowConfirm(true);
  };

  const validate = async () => {
    if (!confirmId) return;
    try {
      const res = await fetch(`http://localhost:3001/api/denda/${confirmId}/validate-payment`, { method: 'PATCH', headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      const data = await res.json();
      if (res.ok) {
        setToast({ message: 'Denda berhasil divalidasi', type: 'success' });
        fetchPending();
      } else {
        setToast({ message: data.error || 'Gagal validasi denda', type: 'error' });
      }
    } catch (err) {
      setToast({ message: 'Terjadi kesalahan koneksi', type: 'error' });
    } finally {
      setShowConfirm(false);
      setConfirmId(null);
    }
  };

  return (
    <>
      <Sidebar />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 ml-64 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Validasi Denda</h1>
          <p className="text-gray-600">Daftar pembayaran denda yang menunggu validasi</p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {list.length === 0 ? (
              <div className="p-8 text-center text-gray-600">Tidak ada pembayaran yang menunggu validasi.</div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Barang</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Denda</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal Pengajuan</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {list.map((d, i) => (
                    <tr key={d.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{i+1}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{d.user_nama}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{d.komoditas_nama}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(d.total_denda)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{d.tanggal_pengajuan_pembayaran ? new Date(d.tanggal_pengajuan_pembayaran).toLocaleDateString('id-ID') : '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button onClick={() => handleValidateClick(d.id)} className="text-green-600 hover:text-green-900" title="Validasi">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

        <ConfirmModal
          isOpen={showConfirm}
          title="Konfirmasi Validasi"
          message="Apakah Anda yakin ingin memvalidasi pembayaran denda ini?"
          onConfirm={validate}
          onCancel={() => { setShowConfirm(false); setConfirmId(null); }}
        />
      </div>
    </>
  );
}
