"use client";

import React, { useState, useEffect } from 'react';

interface Kategori {
  id: number;
  nama: string;
}

interface KomoditasModalProps {
  isOpen: boolean;
  isEditing: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: {
    nama: string;
    deskripsi: string;
    jumlah_total: number;
    kategori_id?: number | null;
  };
  isSubmitting?: boolean;
}

export default function KomoditasModal({
  isOpen,
  isEditing,
  onClose,
  onSubmit,
  initialData,
  isSubmitting = false
}: KomoditasModalProps) {
  const [formData, setFormData] = useState(
    initialData || {
      nama: '',
      deskripsi: '',
      jumlah_total: 0,
      kategori_id: null
    }
  );

  const [kategoriList, setKategoriList] = useState<Kategori[]>([]);
  const [loadingKategori, setLoadingKategori] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchKategori();
    }
  }, [isOpen]);

  const fetchKategori = async () => {
    setLoadingKategori(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/kategori`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setKategoriList(data);
      }
    } catch (error) {
      console.error('Error fetching kategori:', error);
    } finally {
      setLoadingKategori(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'jumlah_total' ? parseInt(value) || 0 : (name === 'kategori_id' ? (value === '' ? null : parseInt(value)) : value)
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Edit Alat' : 'Tambah Alat Baru'}
          </h2>
          <p className="text-gray-600 text-sm mt-1">
            {isEditing ? 'Perbarui informasi alat' : 'Tambahkan alat baru ke sistem'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Nama Alat */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Nama Alat <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="nama"
              value={formData.nama}
              onChange={handleChange}
              placeholder="Contoh: Proyektor, Mikrofon, Laptop"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
            />
          </div>

          {/* Kategori */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Kategori <span className="text-gray-400 text-xs">(Opsional)</span>
            </label>
            <select
              name="kategori_id"
              value={formData.kategori_id || ''}
              onChange={handleChange}
              disabled={loadingKategori}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition disabled:bg-gray-100"
            >
              <option value="">-- Pilih Kategori --</option>
              {kategoriList.map((kategori) => (
                <option key={kategori.id} value={kategori.id}>
                  {kategori.nama}
                </option>
              ))}
            </select>
          </div>

          {/* Deskripsi */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Deskripsi <span className="text-gray-400 text-xs">(Opsional)</span>
            </label>
            <textarea
              name="deskripsi"
              value={formData.deskripsi}
              onChange={handleChange}
              placeholder="Tuliskan deskripsi atau spesifikasi alat..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition resize-none"
            />
          </div>

          {/* Jumlah Total */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Jumlah Total <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="jumlah_total"
              value={formData.jumlah_total}
              onChange={handleChange}
              placeholder="0"
              min="1"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
            />
          </div>

          {/* Button Actions */}
          <div className="flex gap-3 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold disabled:bg-indigo-400 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Menyimpan...' : isEditing ? 'Perbarui' : 'Tambah'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
