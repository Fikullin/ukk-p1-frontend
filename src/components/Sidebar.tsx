"use client";

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [userRole, setUserRole] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const user = localStorage.getItem('user');
      if (user) {
        const userData = JSON.parse(user);
        return userData.role || '';
      }
    }
    return '';
  });

  const [userName, setUserName] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const user = localStorage.getItem('user');
      if (user) {
        const userData = JSON.parse(user);
        return userData.username || userData.name || '';
      }
    }
    return '';
  });

  const [isPeminjamanOpen, setIsPeminjamanOpen] = useState(() => {
    if (pathname.startsWith('/peminjaman')) {
      return true;
    }
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('isPeminjamanOpen');
      return saved ? JSON.parse(saved) : false;
    }
    return false;
  });

  const [isManajemenAkunOpen, setIsManajemenAkunOpen] = useState(() => {
    if (pathname.startsWith('/manajemen-akun')) {
      return true;
    }
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('isManajemenAkunOpen');
      return saved ? JSON.parse(saved) : false;
    }
    return false;
  });

  const togglePeminjaman = () => {
    const newState = !isPeminjamanOpen;
    setIsPeminjamanOpen(newState);
    localStorage.setItem('isPeminjamanOpen', JSON.stringify(newState));
  };

  const toggleManajemenAkun = () => {
    const newState = !isManajemenAkunOpen;
    setIsManajemenAkunOpen(newState);
    localStorage.setItem('isManajemenAkunOpen', JSON.stringify(newState));
  };

  // Notifications (for siswa)
  const [notifCount, setNotifCount] = useState<number>(0);
  const [dueSoonCount, setDueSoonCount] = useState<number>(0);
  const [newValidatedCount, setNewValidatedCount] = useState<number>(0);
  const [showNotifPanel, setShowNotifPanel] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        if (userRole !== 'siswa') return;
        const token = localStorage.getItem('token');
        
        // Apply automatic overdue fines
        try {
          await fetch('http://localhost:3001/api/peminjaman/apply-overdue-fines', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
          });
        } catch (fineErr) {
          console.log('Fine application skipped:', fineErr);
        }

        const res = await fetch('http://localhost:3001/api/peminjaman/riwayat', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) return;
        const data = await res.json();

        const today = new Date();
        const seenKeys: string[] = JSON.parse(localStorage.getItem('seenNotifKeys') || '[]');

        const notifs: any[] = [];

        data.forEach((item: any) => {
          // validated peminjaman by petugas (peminjaman approved)
          if (item.status === 'dipinjam' && item.validated_by) {
            const key = `validated-${item.id}`;
            notifs.push({
              key,
              type: 'validated',
              peminjamanId: item.id,
              message: `Peminjaman ${item.komoditas_nama} telah divalidasi. Deadline: ${item.deadline || '-'}.`,
              date: item.deadline || item.tanggal_pinjam,
              seen: seenKeys.includes(key)
            });
          }

          // return validated by petugas
          if (item.return_status === 'validated') {
            const key = `return-validated-${item.id}`;
            notifs.push({
              key,
              type: 'return_validated',
              peminjamanId: item.id,
              message: `Pengembalian ${item.komoditas_nama} telah divalidasi oleh petugas.`,
              date: item.tanggal_kembali || item.created_at,
              seen: seenKeys.includes(key)
            });
          }

          // due soon (<= 3 days)
          if (item.status === 'dipinjam' && item.deadline) {
            const dl = new Date(item.deadline + 'T00:00:00');
            const todayMid = new Date();
            todayMid.setHours(0,0,0,0);
            const diff = Math.floor((dl.getTime() - todayMid.getTime()) / (1000 * 60 * 60 * 24));
            if (diff <= 3 && diff >= 0) {
              const key = `due-${item.id}`;
              notifs.push({
                key,
                type: 'due_soon',
                peminjamanId: item.id,
                message: `Peminjaman ${item.komoditas_nama} akan jatuh tempo pada ${item.deadline}.`,
                date: item.deadline,
                seen: seenKeys.includes(key)
              });
            }

            // overdue -> possible fine
            if (diff < 0) {
              const key = `overdue-${item.id}`;
              notifs.push({
                key,
                type: 'overdue',
                peminjamanId: item.id,
                message: `Peminjaman ${item.komoditas_nama} sudah melewati tenggat (${item.deadline}) — periksa daftar denda.`,
                date: item.deadline,
                seen: seenKeys.includes(key)
              });
            }
          }
        });

        // dedupe by key
        const deduped = Array.from(new Map(notifs.map(n => [n.key, n])).values());

        setNotifications(deduped);
        const unseenCount = deduped.filter(n => !n.seen).length;
        setNotifCount(unseenCount);
        setDueSoonCount(deduped.filter(n => n.type === 'due_soon' && !n.seen).length);
        setNewValidatedCount(deduped.filter(n => (n.type === 'validated' || n.type === 'return_validated') && !n.seen).length);
      } catch (err) {
        // ignore
      }
    };

    fetchNotifications();
    const t = setInterval(fetchNotifications, 60000);
    return () => clearInterval(t);
  }, [userRole]);

  const isActive = (href: string) => {
    if (href === '/beranda') return pathname === '/beranda';
    if (href === '/komoditas') return pathname === '/komoditas';
    if (href === '/peminjaman') return pathname.startsWith('/peminjaman');
    if (href === '/log-aktivitas') return pathname === '/log-aktivitas';
    if (href === '/manajemen-akun') return pathname === '/manajemen-akun' || pathname.startsWith('/manajemen-akun');
    return pathname === href;
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('isPeminjamanOpen');
    localStorage.removeItem('isManajemenAkunOpen');
    router.push('/login');
  };

  const getRoleLabel = () => {
    switch (userRole) {
      case 'siswa':
        return 'Siswa';
      case 'petugas':
        return 'Petugas';
      case 'administrator':
        return 'Administrator';
      default:
        return '';
    }
  };

  return (
    <div className="fixed top-0 left-0 h-full w-64 bg-gradient-to-b from-slate-50 to-slate-100 shadow-lg z-50 overflow-y-auto scrollbar-hide border-r border-slate-200">
      {/* User Info Header */}
      {userRole && (
        <div className="sticky top-0 px-4 py-4 bg-gradient-to-r from-indigo-100 to-blue-100 border-b-2 border-indigo-200">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <p className="text-xs font-bold text-slate-700 uppercase tracking-widest">Pengguna</p>
              <p className="text-sm font-bold text-slate-900 mt-2 truncate">{userName}</p>
              <div className="mt-2 inline-block px-2.5 py-1 bg-indigo-600 text-white text-xs font-semibold rounded-full">
                {getRoleLabel()}
              </div>
            </div>

            {/* Notification bell for siswa */}
            {userRole === 'siswa' && (
              <div className="ml-2 flex-shrink-0 relative">
                <button
                  onClick={() => setShowNotifPanel(prev => !prev)}
                  title="Notifikasi"
                  className="relative p-2 rounded-md hover:bg-slate-200"
                >
                  <svg className="w-6 h-6 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0a3 3 0 11-6 0h6z" />
                  </svg>
                  {notifCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-xs font-bold bg-red-500 text-white">
                      {notifCount}
                    </span>
                  )}
                </button>

                {/* Notification panel */}
                {showNotifPanel && (
                  <div className="fixed left-64 top-16 w-96 bg-white rounded-xl shadow-2xl z-[9999] overflow-hidden border border-slate-200">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-5 py-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="text-lg font-bold text-white">Notifikasi</h2>
                          <p className="text-indigo-100 text-xs mt-1">{notifCount} notifikasi baru</p>
                        </div>
                        <button 
                          onClick={() => setShowNotifPanel(false)}
                          className="text-indigo-100 hover:text-white transition"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Notifications list */}
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-12 px-4">
                          <svg className="w-12 h-12 text-slate-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0a3 3 0 11-6 0h6z" />
                          </svg>
                          <p className="text-slate-500 text-sm font-medium">Tidak ada notifikasi</p>
                          <p className="text-slate-400 text-xs mt-1">Anda sudah update dengan semua informasi</p>
                        </div>
                      )}
                      {notifications.map((n) => {
                        const getNotifIcon = (type: string) => {
                          switch(type) {
                            case 'validated':
                              return <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" /></svg>;
                            case 'return_validated':
                              return <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" /></svg>;
                            case 'due_soon':
                              return <svg className="w-5 h-5 text-amber-600" fill="currentColor" viewBox="0 0 24 24"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" /></svg>;
                            case 'overdue':
                              return <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" /></svg>;
                            default:
                              return <svg className="w-5 h-5 text-slate-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" /></svg>;
                          }
                        };

                        const getNotifColor = (type: string) => {
                          switch(type) {
                            case 'validated':
                              return 'bg-green-50 border-l-4 border-green-500';
                            case 'return_validated':
                              return 'bg-blue-50 border-l-4 border-blue-500';
                            case 'due_soon':
                              return 'bg-amber-50 border-l-4 border-amber-500';
                            case 'overdue':
                              return 'bg-red-50 border-l-4 border-red-500';
                            default:
                              return 'bg-slate-50 border-l-4 border-slate-300';
                          }
                        };

                        return (
                          <button
                            key={n.key}
                            onClick={() => {
                              // mark as read
                              try {
                                const seen: string[] = JSON.parse(localStorage.getItem('seenNotifKeys') || '[]');
                                if (!seen.includes(n.key)) {
                                  seen.push(n.key);
                                  localStorage.setItem('seenNotifKeys', JSON.stringify(seen));
                                }
                              } catch (_) {}
                              // update local state
                              setNotifications(prev => prev.map(p => p.key === n.key ? { ...p, seen: true } : p));
                              setNotifCount(prev => Math.max(0, prev - (n.seen ? 0 : 1)));
                              // navigate based on type
                              if (n.type === 'overdue') router.push('/daftar-denda');
                              else router.push('/peminjaman/riwayat');
                              setShowNotifPanel(false);
                            }}
                            className={`w-full text-left px-4 py-3 hover:shadow-md transition-all duration-150 border-b border-slate-100 ${getNotifColor(n.type)} ${!n.seen ? 'font-semibold' : ''}`}
                          >
                            <div className="flex gap-3">
                              <div className="flex-shrink-0 mt-0.5">
                                {getNotifIcon(n.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm ${!n.seen ? 'text-slate-900' : 'text-slate-700'}`}>{n.message}</p>
                                <p className="text-xs text-slate-500 mt-1">{n.date}</p>
                              </div>
                              {!n.seen && (
                                <div className="flex-shrink-0 w-2 h-2 bg-indigo-600 rounded-full mt-1.5"></div>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                      <div className="border-t border-slate-200 bg-slate-50 px-4 py-3 flex items-center justify-between">
                        <button
                          onClick={() => {
                            try {
                              const keys = notifications.map(n => n.key);
                              localStorage.setItem('seenNotifKeys', JSON.stringify(keys));
                            } catch (_) {}
                            setNotifications(prev => prev.map(p => ({ ...p, seen: true })));
                            setNotifCount(0);
                          }}
                          className="text-xs font-medium text-indigo-600 hover:text-indigo-700 transition rounded px-2 py-1 hover:bg-indigo-50"
                        >
                          Tandai semua dibaca
                        </button>
                        <a
                          href="/peminjaman/riwayat"
                          className="text-xs font-medium text-slate-600 hover:text-indigo-600 transition rounded px-2 py-1 hover:bg-slate-200"
                        >
                          Lihat semua →
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-1">
        {/* Beranda */}
        <a
          href="/beranda"
          className={`flex items-center gap-3 px-4 py-2.5 rounded-lg font-medium transition-all duration-200 ${
            isActive('/beranda')
              ? 'bg-indigo-100 text-indigo-700 shadow-sm'
              : 'text-slate-700 hover:bg-slate-200'
          }`}
        >
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span>Beranda</span>
        </a>

        {/* Daftar Alat */}
        <a
          href="/komoditas"
          className={`flex items-center gap-3 px-4 py-2.5 rounded-lg font-medium transition-all duration-200 ${
            isActive('/komoditas')
              ? 'bg-indigo-100 text-indigo-700 shadow-sm'
              : 'text-slate-700 hover:bg-slate-200'
          }`}
        >
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span>Daftar Alat</span>
        </a>

        {/* Kategori - Only for admin and petugas */}
        {(userRole === 'petugas' || userRole === 'administrator') && (
          <a
            href="/kategori"
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg font-medium transition-all duration-200 ${
              isActive('/kategori')
                ? 'bg-indigo-100 text-indigo-700 shadow-sm'
                : 'text-slate-700 hover:bg-slate-200'
            }`}
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            <span>Kategori</span>
          </a>
        )}

        {/* Peminjaman Dropdown */}
        <div>
          <button
            onClick={togglePeminjaman}
            className={`flex items-center gap-3 w-full px-4 py-2.5 rounded-lg font-medium transition-all duration-200 ${
              isActive('/peminjaman')
                ? 'bg-indigo-100 text-indigo-700 shadow-sm'
                : 'text-slate-700 hover:bg-slate-200'
            }`}
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="flex-1 text-left">Peminjaman</span>
            <svg className={`w-4 h-4 flex-shrink-0 transition-transform duration-300 ${isPeminjamanOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {isPeminjamanOpen && (
            <div className="ml-8 mt-1 space-y-0.5 border-l-2 border-indigo-200 pl-3">
              <a
                href="/peminjaman/hari-ini"
                className={`flex px-3 py-2 text-sm rounded-md transition-all duration-200 ${
                  pathname === '/peminjaman/hari-ini'
                    ? 'bg-indigo-50 text-indigo-700 font-semibold'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {userRole === 'siswa' ? 'Hari Ini' : 'Peminjaman Hari Ini'}
              </a>
              <a
                href="/peminjaman/riwayat"
                className={`flex px-3 py-2 text-sm rounded-md transition-all duration-200 ${
                  pathname === '/peminjaman/riwayat'
                    ? 'bg-indigo-50 text-indigo-700 font-semibold'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Riwayat
              </a>
              {userRole === 'siswa' && (
                <a
                  href="/daftar-denda"
                  className={`flex px-3 py-2 text-sm rounded-md transition-all duration-200 ${
                    pathname === '/daftar-denda'
                      ? 'bg-indigo-50 text-indigo-700 font-semibold'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Daftar Denda
                </a>
              )}
              {(userRole === 'petugas' || userRole === 'administrator') && (
                <a
                  href="/peminjaman/laporan"
                  className={`flex px-3 py-2 text-sm rounded-md transition-all duration-200 ${
                    pathname === '/peminjaman/laporan'
                      ? 'bg-indigo-50 text-indigo-700 font-semibold'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Laporan
                </a>
              )}
              {(userRole === 'petugas' || userRole === 'administrator') && (
                <a
                  href="/validasi-pembayaran-denda"
                  className={`flex px-3 py-2 text-sm rounded-md transition-all duration-200 ${
                    pathname === '/validasi-pembayaran-denda'
                      ? 'bg-indigo-50 text-indigo-700 font-semibold'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Validasi Pembayaran Denda
                </a>
              )}
            </div>
          )}
        </div>

        {/* Admin Section */}
        {userRole === 'administrator' && (
          <>
            <div className="pt-3 mt-3 border-t border-slate-300">
              <p className="px-4 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider">Admin</p>
            </div>

            {/* Manajemen Akun */}
            <div>
              <button
                onClick={toggleManajemenAkun}
                className={`flex items-center gap-3 w-full px-4 py-2.5 rounded-lg font-medium transition-all duration-200 ${
                  isActive('/manajemen-akun')
                    ? 'bg-indigo-100 text-indigo-700 shadow-sm'
                    : 'text-slate-700 hover:bg-slate-200'
                }`}
              >
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 10H9m6 4a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <span className="flex-1 text-left">Manajemen Akun</span>
                <svg className={`w-4 h-4 flex-shrink-0 transition-transform duration-300 ${isManajemenAkunOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {isManajemenAkunOpen && (
                <div className="ml-8 mt-1 space-y-0.5 border-l-2 border-indigo-200 pl-3">
                  <a
                    href="/manajemen-akun"
                    className={`flex px-3 py-2 text-sm rounded-md transition-all duration-200 ${
                      pathname === '/manajemen-akun' && !pathname.includes('?')
                        ? 'bg-indigo-50 text-indigo-700 font-semibold'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Semua Pengguna
                  </a>
                  <a
                    href="/manajemen-akun?role=administrator"
                    className={`flex px-3 py-2 text-sm rounded-md transition-all duration-200 ${
                      pathname.includes('role=administrator')
                        ? 'bg-indigo-50 text-indigo-700 font-semibold'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Administrator
                  </a>
                  <a
                    href="/manajemen-akun?role=petugas"
                    className={`flex px-3 py-2 text-sm rounded-md transition-all duration-200 ${
                      pathname.includes('role=petugas')
                        ? 'bg-indigo-50 text-indigo-700 font-semibold'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Petugas
                  </a>
                  <a
                    href="/manajemen-akun?role=siswa"
                    className={`flex px-3 py-2 text-sm rounded-md transition-all duration-200 ${
                      pathname.includes('role=siswa')
                        ? 'bg-indigo-50 text-indigo-700 font-semibold'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Siswa
                  </a>
                </div>
              )}
            </div>

            {/* Log Aktivitas */}
            <a
              href="/log-aktivitas"
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg font-medium transition-all duration-200 ${
                isActive('/log-aktivitas')
                  ? 'bg-indigo-100 text-indigo-700 shadow-sm'
                  : 'text-slate-700 hover:bg-slate-200'
              }`}
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Log Aktivitas</span>
            </a>
          </>
        )}
      </nav>

      {/* Footer */}
      {userRole && (
        <div className="sticky bottom-0 px-3 py-4 border-t border-slate-300 bg-gradient-to-b from-slate-50 to-slate-100 space-y-2">
          <a
            href="/pengaturan-akun"
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium transition-all duration-200 text-sm"
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>Pengaturan</span>
          </a>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 text-white bg-red-500 hover:bg-red-600 rounded-lg font-medium transition-all duration-200 text-sm shadow-sm"
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Logout</span>
          </button>
        </div>
      )}
    </div>
  );
}
