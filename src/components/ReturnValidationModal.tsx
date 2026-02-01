import React, { useState } from 'react';

interface ReturnValidationModalProps {
  isOpen: boolean;
  peminjaman: {
    id: number;
    komoditas_nama: string;
    user_nama: string;
    jumlah_pinjam: number;
    deadline?: string;
  } | null;
  onClose: () => void;
  onConfirm: (data: {
    tanggal_kembali: string;
    jam_kembali?: string;
    kondisi_barang: 'baik' | 'rusak' | 'hilang';
  }) => void;
  loading?: boolean;
}

export default function ReturnValidationModal({
  isOpen,
  peminjaman,
  onClose,
  onConfirm,
  loading = false
}: ReturnValidationModalProps) {
  const [tanggalKembali, setTanggalKembali] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [jamKembali, setJamKembali] = useState(
    new Date().toTimeString().substring(0, 5)
  );
  const [kondisiBarang, setKondisiBarang] = useState<'baik' | 'rusak' | 'hilang'>('baik');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm({
      tanggal_kembali: tanggalKembali,
      jam_kembali: jamKembali,
      kondisi_barang: kondisiBarang
    });
  };

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white/95 rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold mb-4">Validasi Pengembalian</h2>
        
        {peminjaman && (
          <>
            <div className="mb-4 p-3 bg-gray-100 rounded">
              <p className="text-sm text-gray-600">Barang: <span className="font-semibold">{peminjaman.komoditas_nama}</span></p>
              <p className="text-sm text-gray-600">Peminjam: <span className="font-semibold">{peminjaman.user_nama}</span></p>
              <p className="text-sm text-gray-600">Jumlah: <span className="font-semibold">{peminjaman.jumlah_pinjam}</span></p>
              {peminjaman.deadline && (
                <p className="text-sm text-gray-600">Deadline: <span className="font-semibold">{peminjaman.deadline}</span></p>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Tanggal Kembali</label>
                <input
                  type="date"
                  value={tanggalKembali}
                  onChange={(e) => setTanggalKembali(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Jam Kembali (Opsional)</label>
                <input
                  type="time"
                  value={jamKembali}
                  onChange={(e) => setJamKembali(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Kondisi Barang</label>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="baik"
                      name="kondisi"
                      value="baik"
                      checked={kondisiBarang === 'baik'}
                      onChange={() => setKondisiBarang('baik')}
                      className="w-4 h-4"
                    />
                    <label htmlFor="baik" className="ml-2 text-sm">
                      Baik (Tidak ada denda)
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="rusak"
                      name="kondisi"
                      value="rusak"
                      checked={kondisiBarang === 'rusak'}
                      onChange={() => setKondisiBarang('rusak')}
                      className="w-4 h-4"
                    />
                    <label htmlFor="rusak" className="ml-2 text-sm">
                      Rusak (Denda: Rp 25.000)
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="hilang"
                      name="kondisi"
                      value="hilang"
                      checked={kondisiBarang === 'hilang'}
                      onChange={() => setKondisiBarang('hilang')}
                      className="w-4 h-4"
                    />
                    <label htmlFor="hilang" className="ml-2 text-sm">
                      Hilang (Denda: Rp 100.000)
                    </label>
                  </div>
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
                  disabled={loading}
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
