"use client";

import React, { useState, useEffect } from 'react';

interface Props {
  isOpen: boolean;
  isEditing: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: { nama: string; deskripsi?: string };
  isSubmitting?: boolean;
}

export default function KategoriModal({ isOpen, isEditing, onClose, onSubmit, initialData, isSubmitting = false }: Props) {
  const [form, setForm] = useState({ nama: '', deskripsi: '' });

  useEffect(() => {
    if (initialData) setForm({ nama: initialData.nama || '', deskripsi: initialData.deskripsi || '' });
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">{isEditing ? 'Edit Kategori' : 'Tambah Kategori'}</h2>
          <p className="text-gray-600 text-sm mt-1">{isEditing ? 'Perbarui kategori' : 'Tambahkan kategori baru'}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Nama Kategori <span className="text-red-500">*</span></label>
            <input name="nama" value={form.nama} onChange={handleChange} required className="w-full px-4 py-3 border border-gray-300 rounded-lg" />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Deskripsi</label>
            <textarea name="deskripsi" value={form.deskripsi} onChange={handleChange} rows={3} className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none" />
          </div>

          <div className="flex gap-3 pt-6">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-3 bg-gray-200 text-gray-800 rounded-lg">Batal</button>
            <button type="submit" disabled={isSubmitting} className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-lg">{isSubmitting ? 'Menyimpan...' : isEditing ? 'Perbarui' : 'Tambah'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
