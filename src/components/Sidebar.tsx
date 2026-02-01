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
          <p className="text-xs font-bold text-slate-700 uppercase tracking-widest">Pengguna</p>
          <p className="text-sm font-bold text-slate-900 mt-2 truncate">{userName}</p>
          <div className="mt-2 inline-block px-2.5 py-1 bg-indigo-600 text-white text-xs font-semibold rounded-full">
            {getRoleLabel()}
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
