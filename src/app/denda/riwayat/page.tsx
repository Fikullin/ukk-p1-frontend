"use client";

import React, { useEffect, useState } from 'react';
import Sidebar from '../../../components/Sidebar';
import Toast from '../../../components/Toast';

interface DendaPaid {
  id: number;
  peminjaman_id: number;
  user_id: number;
  komoditas_nama: string;
  user_nama: string;
  total_denda: number;
  tanggal_pembayaran?: string;
}

export default function RiwayatDendaPage() {
  const [list, setList] = useState<DendaPaid[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => { fetchPaid(); }, []);

  const fetchPaid = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/denda/paid', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
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

  const printNota = async (id: number) => {
    try {
      const res = await fetch(`http://localhost:3001/api/denda/${id}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      if (!res.ok) { const e = await res.json(); setToast({ message: e.error || 'Gagal memuat nota', type: 'error' }); return; }
      const d = await res.json();

      const html = `
        <html>
        <head>
          <title>Nota Denda #${d.id}</title>
          <style>
            body{ font-family: Arial, sans-serif; padding:20px }
            .header{ text-align:center; margin-bottom:20px }
            .section{ margin-bottom:12px }
            .label{ color:#555 }
            table{ width:100%; border-collapse:collapse }
            td, th{ padding:8px; border-bottom:1px solid #eee }
          </style>
        </head>
        <body>
          <div class="header"><h2>Nota Denda</h2><div>Nomor: ${d.id}</div></div>
          <div class="section"><strong>Pengguna:</strong> ${d.user_nama} (${d.user_username || '-'})</div>
          <div class="section"><strong>Barang:</strong> ${d.komoditas_nama}</div>
          <div class="section"><strong>Tanggal Pembayaran:</strong> ${d.tanggal_pembayaran || '-'}</div>
          <div class="section"><table><tr><th class="label">Rincian</th><th class="label">Jumlah</th></tr>
            <tr><td>Denda Keterlambatan</td><td>${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(d.denda_keterlambatan || 0)}</td></tr>
            <tr><td>Denda Kerusakan</td><td>${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(d.denda_kerusakan || 0)}</td></tr>
            <tr><td>Denda Hilang</td><td>${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(d.denda_hilang || 0)}</td></tr>
            <tr><td><strong>Total</strong></td><td><strong>${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(d.total_denda || 0)}</strong></td></tr>
          </table></div>
          <div class="section">Terima kasih.</div>
        </body>
        </html>
      `;

      const win = window.open('', '_blank', 'width=800,height=600');
      if (!win) { setToast({ message: 'Pop-up diblokir', type: 'error' }); return; }
      win.document.write(html);
      win.document.close();
      win.focus();
      setTimeout(() => { win.print(); }, 500);
    } catch (err) {
      setToast({ message: 'Terjadi kesalahan', type: 'error' });
    }
  };

  return (
    <>
      <Sidebar />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 ml-64 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Riwayat Denda (Dibayar)</h1>
          <p className="text-gray-600">Daftar denda yang sudah dibayar</p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {list.length === 0 ? (
              <div className="p-8 text-center text-gray-600">Belum ada denda yang dibayar.</div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pengguna</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Barang</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal Bayar</th>
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{d.tanggal_pembayaran ? new Date(d.tanggal_pembayaran).toLocaleDateString('id-ID') : '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button onClick={() => printNota(d.id)} className="text-indigo-600 hover:text-indigo-900" title="Cetak Nota">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" />
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
      </div>
    </>
  );
}
