"use client";

import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar';
import KategoriModal from '../../components/KategoriModal';
import Toast from '../../components/Toast';
import ConfirmModal from '../../components/ConfirmModal';

interface Kategori {
  id: number;
  nama: string;
  deskripsi?: string;
}

interface KategoriData {
  nama: string;
  deskripsi?: string;
}

export default function KategoriPage() {
  const [list, setList] = useState<Kategori[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editing, setEditing] = useState<Kategori | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  useEffect(() => { fetchList(); }, []);

  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/kategori', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      if (res.ok) {
        const data = await res.json();
        setList(data || []);
      }
    } catch (err) {
      console.error(err);
    } finally { setLoading(false); }
  };

  const handleAdd = async (data: KategoriData) => {
    try {
      const res = await fetch('http://localhost:3001/api/kategori', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` }, body: JSON.stringify(data) });
      if (res.ok) {
        setShowAdd(false);
        fetchList();
        setToast({ message: 'Kategori ditambahkan', type: 'success' });
      } else {
        const d = await res.json();
        setToast({ message: d.error || 'Gagal menambah kategori', type: 'error' });
      }
    } catch (err) { setToast({ message: 'Terjadi kesalahan', type: 'error' }); }
  };

  const handleEdit = (k: Kategori) => { setEditing(k); setShowEdit(true); };

  const handleEditSubmit = async (data: KategoriData) => {
    if (!editing) return;
    try {
      const res = await fetch(`http://localhost:3001/api/kategori/${editing.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` }, body: JSON.stringify(data) });
      if (res.ok) {
        setShowEdit(false); setEditing(null); fetchList(); setToast({ message: 'Kategori diupdate', type: 'success' });
      } else {
        const d = await res.json(); setToast({ message: d.error || 'Gagal mengupdate', type: 'error' });
      }
    } catch (err) { setToast({ message: 'Terjadi kesalahan', type: 'error' }); }
  };

  const handleDeleteClick = (id: number) => {
    setDeleteId(id);
    setShowDeleteConfirm(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`http://localhost:3001/api/kategori/${deleteId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      if (res.ok) { fetchList(); setToast({ message: 'Kategori dihapus', type: 'success' }); }
      else { const d = await res.json(); setToast({ message: d.error || 'Gagal menghapus', type: 'error' }); }
    } catch (err) { setToast({ message: 'Terjadi kesalahan', type: 'error' }); } finally {
      setShowDeleteConfirm(false);
      setDeleteId(null);
    }
  };

  return (
    <>
      <Sidebar />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 ml-64 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Kategori</h1>
          <p className="text-gray-600">Kelola kategori alat</p>
        </div>

        <div className="mb-6 flex justify-end">
          <button onClick={() => setShowAdd(true)} className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition-colors">
            Tambah Kategori
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deskripsi</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {list.map(k => (
                  <tr key={k.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{k.nama}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{k.deskripsi || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button onClick={() => handleEdit(k)} className="text-indigo-600 hover:text-indigo-900" title="Edit">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                          </svg>
                        </button>
                        <button onClick={() => handleDeleteClick(k.id)} className="text-red-600 hover:text-red-900" title="Hapus">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <KategoriModal isOpen={showAdd} isEditing={false} onClose={() => setShowAdd(false)} onSubmit={handleAdd} />
        <KategoriModal isOpen={showEdit} isEditing={true} onClose={() => { setShowEdit(false); setEditing(null); }} onSubmit={handleEditSubmit} initialData={editing || undefined} />

        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

        <ConfirmModal
          isOpen={showDeleteConfirm}
          title="Konfirmasi Hapus"
          message="Apakah Anda yakin ingin menghapus kategori ini?"
          onConfirm={handleDelete}
          onCancel={() => { setShowDeleteConfirm(false); setDeleteId(null); }}
          isDangerous={true}
        />
      </div>
    </>
  );
}
