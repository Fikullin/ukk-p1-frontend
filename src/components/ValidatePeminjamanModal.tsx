import React, { useState } from 'react';

interface ValidatePeminjamanModalProps {
  isOpen: boolean;
  peminjaman: {
    id: number;
    komoditas_nama: string;
    user_nama: string;
    jumlah_pinjam: number;
    tanggal_pinjam: string;
  } | null;
  onClose: () => void;
  onConfirm: (data: { deadline: string }) => void;
  loading?: boolean;
}

export default function ValidatePeminjamanModal({
  isOpen,
  peminjaman,
  onClose,
  onConfirm,
  loading = false
}: ValidatePeminjamanModalProps) {
  const [deadline, setDeadline] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deadline) {
      alert('Deadline harus diisi');
      return;
    }
    onConfirm({ deadline });
  };

  const handleSetDefaultDeadline = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    setDeadline(date.toISOString().split('T')[0]);
  };

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white/95 rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold mb-4">Validasi Peminjaman</h2>
        
        {peminjaman && (
          <>
            <div className="mb-4 p-3 bg-gray-100 rounded">
              <p className="text-sm text-gray-600">Barang: <span className="font-semibold">{peminjaman.komoditas_nama}</span></p>
              <p className="text-sm text-gray-600">Peminjam: <span className="font-semibold">{peminjaman.user_nama}</span></p>
              <p className="text-sm text-gray-600">Jumlah: <span className="font-semibold">{peminjaman.jumlah_pinjam}</span></p>
              <p className="text-sm text-gray-600">Tanggal Pinjam: <span className="font-semibold">{peminjaman.tanggal_pinjam}</span></p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Deadline Pengembalian</label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full border rounded px-3 py-2 mb-3"
                  required
                />
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleSetDefaultDeadline(3)}
                    className="text-xs px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded"
                  >
                    +3 hari
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetDefaultDeadline(7)}
                    className="text-xs px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded"
                  >
                    +7 hari
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetDefaultDeadline(14)}
                    className="text-xs px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded"
                  >
                    +14 hari
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded font-medium hover:bg-gray-50 disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading || !deadline}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Memproses...' : 'Validasi'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
