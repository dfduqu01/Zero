// ERP Integration Test Page
// Systematic testing of each component

import { Suspense } from 'react';
import ErpTestClient from './ErpTestClient';

export const metadata = {
  title: 'ERP Integration Tests | Admin',
  description: 'Test ERP sync components individually',
};

export default function ErpTestPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">ERP Integration Tests</h1>
      <p className="text-gray-600 mb-8">
        Test each component of the ERP sync workflow individually to identify issues.
      </p>

      <Suspense fallback={<div>Loading...</div>}>
        <ErpTestClient />
      </Suspense>
    </div>
  );
}
