"use client";

import React, { useState } from 'react';

interface BorrowModalProps {
  isOpen: boolean;
  toolName: string;
  availableQuantity: number;
  onConfirm: (quantity: number) => void;
  onCancel: () => void;
}

export default function BorrowModal({
  isOpen,
  toolName,
  availableQuantity,
  onConfirm,
  onCancel
}: BorrowModalProps) {
  const [quantity, setQuantity] = useState('1');
  const [error, setError] = useState('');

  const handleConfirm = () => {
    const qty = parseInt(quantity);
    
    if (!quantity || qty <= 0) {
      setError('Jumlah harus lebih dari 0');
      return;
    }
    
    if (qty > availableQuantity) {
      setError(`Jumlah tidak boleh melebihi ${availableQuantity}`);
      return;
    }

    onConfirm(qty);
    setQuantity('1');
    setError('');
  };

  const handleCancel = () => {
    setQuantity('1');
    setError('');
    onCancel();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-sm w-full mx-4">
        <div className="p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Peminjaman Barang</h2>
          
          <div className="mb-6">
            <p className="text-gray-700 mb-2">
              <span className="font-semibold">Barang:</span> {toolName}
            </p>
            <p className="text-gray-600 text-sm">
              Tersedia: <span className="font-semibold">{availableQuantity}</span>
            </p>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Jumlah yang ingin dipinjam
            </label>
            <input
              type="number"
              min="1"
              max={availableQuantity}
              value={quantity}
              onChange={(e) => {
                setQuantity(e.target.value);
                setError('');
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            {error && (
              <p className="text-red-500 text-sm mt-2">{error}</p>
            )}
          </div>

          <div className="flex gap-3 justify-end">
            <button
              onClick={handleCancel}
              className="px-4 py-2 bg-gray-200 text-gray-800 font-medium rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300"
            >
              Batal
            </button>
            <button
              onClick={handleConfirm}
              className="px-4 py-2 bg-blue-500 text-white font-medium rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300"
            >
              Pinjam
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
