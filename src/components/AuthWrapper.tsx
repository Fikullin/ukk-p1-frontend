"use client";

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function AuthWrapper({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      const isLoginPage = pathname === '/login';
      const isRegisterPage = pathname === '/register';

      if (token) {
        // Verify token with backend
        fetch('http://localhost:3001/api/profile', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        .then(response => {
          if (response.ok) {
            setIsAuthenticated(true);
          } else {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            if (!isLoginPage && !isRegisterPage) {
              router.push('/login');
            }
          }
        })
        .catch(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          if (!isLoginPage && !isRegisterPage) {
            router.push('/login');
          }
        })
        .finally(() => {
          setIsLoading(false);
        });
      } else {
        setIsLoading(false);
        if (!isLoginPage && !isRegisterPage) {
          router.push('/login');
        }
      }
    };

    checkAuth();
  }, [pathname, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memverifikasi autentikasi...</p>
        </div>
      </div>
    );
  }

  // Allow access to login page, register page, or authenticated pages
  if (pathname === '/login' || pathname === '/register' || isAuthenticated) {
    return <>{children}</>;
  }

  return null;
}
