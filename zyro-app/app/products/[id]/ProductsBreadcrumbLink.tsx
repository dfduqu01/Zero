'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function ProductsBreadcrumbLink() {
  const [href, setHref] = useState('/products');

  useEffect(() => {
    try {
      const savedSearch = sessionStorage.getItem('products_url');
      if (savedSearch) {
        setHref(`/products?${savedSearch}`);
      }
    } catch {
      // Ignore sessionStorage errors
    }
  }, []);

  return (
    <Link href={href} className="hover:text-gray-900">
      Productos
    </Link>
  );
}
