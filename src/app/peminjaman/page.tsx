"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../../components/Sidebar";
import Toast from "../../components/Toast";

interface Peminjaman {
  id: number;
  komoditas_nama: string;
  user_nama: string;
  tanggal_pinjam?: string;
  jam_pinjam?: string;
  status?: string;
}

export default function PeminjamanPage() {
  const router = useRouter();
  const [peminjaman, setPeminjaman] = useState<Peminjaman[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("/api/peminjaman", {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            router.push("/login");
            return;
          }
          throw new Error("Gagal memuat data");
        }
        const data = await res.json();
        setPeminjaman(Array.isArray(data) ? data : []);
      } catch (e) {
        setError((e as Error).message || "Terjadi kesalahan koneksi");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  return (
    <>
      <Sidebar />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 ml-64 p-8">
        <h1 className="text-2xl font-bold mb-4">Data Peminjaman</h1>

        {loading ? (
          <div>Loading...</div>
        ) : error ? (
          <div className="text-red-600">{error}</div>
        ) : (
          <div className="bg-white rounded shadow p-4">
            <table className="w-full table-auto">
              <thead>
                <tr>
                  <th className="text-left p-2">ID</th>
                  <th className="text-left p-2">Alat</th>
                  <th className="text-left p-2">Nama</th>
                  <th className="text-left p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {peminjaman.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-4 text-center text-gray-500">Tidak ada data peminjaman</td>
                  </tr>
                ) : (
                  peminjaman.map((p) => (
                    <tr key={p.id} className="border-t">
                      <td className="p-2">{p.id}</td>
                      <td className="p-2">{p.komoditas_nama}</td>
                      <td className="p-2">{p.user_nama}</td>
                      <td className="p-2">{p.status || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </div>
    </>
  );
}
