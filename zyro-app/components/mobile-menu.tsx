'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X, Settings } from 'lucide-react';

interface MobileMenuProps {
  isAdmin: boolean;
}

export function MobileMenu({ isAdmin }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 hover:bg-gray-100 rounded-md"
        aria-label="Abrir menú"
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="fixed inset-0 top-[65px] bg-white z-40 md:hidden">
          <nav className="flex flex-col p-4 space-y-4">
            <Link
              href="/products"
              className="text-lg font-medium py-2 border-b hover:text-gray-600"
              onClick={() => setIsOpen(false)}
            >
              Productos
            </Link>
            <Link
              href="/about"
              className="text-lg font-medium py-2 border-b hover:text-gray-600"
              onClick={() => setIsOpen(false)}
            >
              Nosotros
            </Link>
            <Link
              href="/shipping"
              className="text-lg font-medium py-2 border-b hover:text-gray-600"
              onClick={() => setIsOpen(false)}
            >
              Envíos
            </Link>
            <Link
              href="/size-guide"
              className="text-lg font-medium py-2 border-b hover:text-gray-600"
              onClick={() => setIsOpen(false)}
            >
              Guía de Tallas
            </Link>
            <Link
              href="/cart"
              className="text-lg font-medium py-2 border-b hover:text-gray-600"
              onClick={() => setIsOpen(false)}
            >
              Carrito
            </Link>
            {isAdmin && (
              <Link
                href="/admin"
                className="text-lg font-medium py-2 border-b text-blue-600 hover:text-blue-800 flex items-center gap-2"
                onClick={() => setIsOpen(false)}
              >
                <Settings className="h-5 w-5" />
                Admin
              </Link>
            )}
          </nav>
        </div>
      )}
    </>
  );
}
