'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

type TestResult = {
  status: 'idle' | 'running' | 'success' | 'error';
  message: string;
  data?: any;
  duration?: number;
};

export default function ErpTestClient() {
  const [tests, setTests] = useState<Record<string, TestResult>>({
    adminClient: { status: 'idle', message: 'Not run' },
    dubrosCategories: { status: 'idle', message: 'Not run' },
    dubrosBrands: { status: 'idle', message: 'Not run' },
    dubrosMaterials: { status: 'idle', message: 'Not run' },
    dubrosProducts: { status: 'idle', message: 'Not run' },
    fullSync: { status: 'idle', message: 'Not run' },
  });

  const [syncLimit, setSyncLimit] = useState<string>('5'); // Default to 5 products

  const updateTest = (testName: string, result: Partial<TestResult>) => {
    setTests(prev => ({
      ...prev,
      [testName]: { ...prev[testName], ...result }
    }));
  };

  const runTest = async (testName: string, endpoint: string, body?: any) => {
    updateTest(testName, { status: 'running', message: 'Running...' });
    const startTime = Date.now();

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await response.json();
      const duration = Date.now() - startTime;

      if (response.ok) {
        updateTest(testName, {
          status: 'success',
          message: data.message || 'Success',
          data,
          duration,
        });
      } else {
        updateTest(testName, {
          status: 'error',
          message: data.error || 'Unknown error',
          data,
          duration,
        });
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      updateTest(testName, {
        status: 'error',
        message: error instanceof Error ? error.message : 'Network error',
        duration,
      });
    }
  };

  const runSyncTest = () => {
    const limit = syncLimit === '' ? null : parseInt(syncLimit, 10);
    if (limit !== null && (isNaN(limit) || limit < 1)) {
      alert('Please enter a valid number (minimum 1) or leave empty for all products');
      return;
    }
    runTest('fullSync', '/api/admin/erp-test/full-sync', { testLimit: limit });
  };

  const getStatusBadge = (status: TestResult['status']) => {
    switch (status) {
      case 'idle': return <Badge variant="outline">Not Run</Badge>;
      case 'running': return <Badge className="bg-blue-500">Running...</Badge>;
      case 'success': return <Badge className="bg-green-500">Success</Badge>;
      case 'error': return <Badge variant="destructive">Error</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Test 1: Admin Client */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Test 1: Admin Client DB Write</CardTitle>
              <CardDescription>
                Test if the admin client can write to erp_sync_logs table
              </CardDescription>
            </div>
            {getStatusBadge(tests.adminClient.status)}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={() => runTest('adminClient', '/api/admin/erp-test/admin-client')}
            disabled={tests.adminClient.status === 'running'}
          >
            Run Test
          </Button>

          {tests.adminClient.status !== 'idle' && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="font-medium mb-2">Result:</p>
              <p className="text-sm text-gray-700">{tests.adminClient.message}</p>
              {tests.adminClient.duration && (
                <p className="text-xs text-gray-500 mt-2">Duration: {tests.adminClient.duration}ms</p>
              )}
              {tests.adminClient.data && (
                <details className="mt-2">
                  <summary className="text-sm font-medium cursor-pointer">View Details</summary>
                  <pre className="text-xs bg-white p-2 rounded mt-2 overflow-auto">
                    {JSON.stringify(tests.adminClient.data, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Test 2: Dubros Categories */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Test 2: Fetch Dubros Categories</CardTitle>
              <CardDescription>
                Test fetching categories from dubros.com API
              </CardDescription>
            </div>
            {getStatusBadge(tests.dubrosCategories.status)}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={() => runTest('dubrosCategories', '/api/admin/erp-test/fetch-categories')}
            disabled={tests.dubrosCategories.status === 'running'}
          >
            Run Test
          </Button>

          {tests.dubrosCategories.status !== 'idle' && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="font-medium mb-2">Result:</p>
              <p className="text-sm text-gray-700">{tests.dubrosCategories.message}</p>
              {tests.dubrosCategories.duration && (
                <p className="text-xs text-gray-500 mt-2">Duration: {tests.dubrosCategories.duration}ms</p>
              )}
              {tests.dubrosCategories.data && (
                <details className="mt-2">
                  <summary className="text-sm font-medium cursor-pointer">View Details</summary>
                  <pre className="text-xs bg-white p-2 rounded mt-2 overflow-auto max-h-60">
                    {JSON.stringify(tests.dubrosCategories.data, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Test 3: Dubros Brands */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Test 3: Fetch Dubros Brands</CardTitle>
              <CardDescription>
                Test fetching brands from dubros.com API
              </CardDescription>
            </div>
            {getStatusBadge(tests.dubrosBrands.status)}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={() => runTest('dubrosBrands', '/api/admin/erp-test/fetch-brands')}
            disabled={tests.dubrosBrands.status === 'running'}
          >
            Run Test
          </Button>

          {tests.dubrosBrands.status !== 'idle' && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="font-medium mb-2">Result:</p>
              <p className="text-sm text-gray-700">{tests.dubrosBrands.message}</p>
              {tests.dubrosBrands.duration && (
                <p className="text-xs text-gray-500 mt-2">Duration: {tests.dubrosBrands.duration}ms</p>
              )}
              {tests.dubrosBrands.data && (
                <details className="mt-2">
                  <summary className="text-sm font-medium cursor-pointer">View Details</summary>
                  <pre className="text-xs bg-white p-2 rounded mt-2 overflow-auto max-h-60">
                    {JSON.stringify(tests.dubrosBrands.data, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Test 4: Dubros Materials */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Test 4: Fetch Dubros Materials</CardTitle>
              <CardDescription>
                Test fetching materials from dubros.com API
              </CardDescription>
            </div>
            {getStatusBadge(tests.dubrosMaterials.status)}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={() => runTest('dubrosMaterials', '/api/admin/erp-test/fetch-materials')}
            disabled={tests.dubrosMaterials.status === 'running'}
          >
            Run Test
          </Button>

          {tests.dubrosMaterials.status !== 'idle' && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="font-medium mb-2">Result:</p>
              <p className="text-sm text-gray-700">{tests.dubrosMaterials.message}</p>
              {tests.dubrosMaterials.duration && (
                <p className="text-xs text-gray-500 mt-2">Duration: {tests.dubrosMaterials.duration}ms</p>
              )}
              {tests.dubrosMaterials.data && (
                <details className="mt-2">
                  <summary className="text-sm font-medium cursor-pointer">View Details</summary>
                  <pre className="text-xs bg-white p-2 rounded mt-2 overflow-auto max-h-60">
                    {JSON.stringify(tests.dubrosMaterials.data, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Test 5: Dubros Products (limited) */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Test 5: Fetch Dubros Products (5 products)</CardTitle>
              <CardDescription>
                Test fetching a small batch of products from dubros.com API
              </CardDescription>
            </div>
            {getStatusBadge(tests.dubrosProducts.status)}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={() => runTest('dubrosProducts', '/api/admin/erp-test/fetch-products')}
            disabled={tests.dubrosProducts.status === 'running'}
          >
            Run Test
          </Button>

          {tests.dubrosProducts.status !== 'idle' && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="font-medium mb-2">Result:</p>
              <p className="text-sm text-gray-700">{tests.dubrosProducts.message}</p>
              {tests.dubrosProducts.duration && (
                <p className="text-xs text-gray-500 mt-2">Duration: {tests.dubrosProducts.duration}ms</p>
              )}
              {tests.dubrosProducts.data && (
                <details className="mt-2">
                  <summary className="text-sm font-medium cursor-pointer">View Details</summary>
                  <pre className="text-xs bg-white p-2 rounded mt-2 overflow-auto max-h-60">
                    {JSON.stringify(tests.dubrosProducts.data, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Test 6: Full Sync (dynamic limit) */}
      <Card className="border-2 border-blue-500">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Test 6: Full Sync Workflow (Dynamic Limit)</CardTitle>
              <CardDescription>
                Test the complete sync workflow with any number of products
              </CardDescription>
            </div>
            {getStatusBadge(tests.fullSync.status)}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div>
              <label htmlFor="syncLimit" className="block text-sm font-medium mb-2">
                Number of products to sync
              </label>
              <div className="flex gap-2 mb-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSyncLimit('5')}
                  disabled={tests.fullSync.status === 'running'}
                >
                  5
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSyncLimit('50')}
                  disabled={tests.fullSync.status === 'running'}
                >
                  50
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSyncLimit('100')}
                  disabled={tests.fullSync.status === 'running'}
                >
                  100
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSyncLimit('')}
                  disabled={tests.fullSync.status === 'running'}
                >
                  All (~1,700+)
                </Button>
              </div>
              <input
                id="syncLimit"
                type="number"
                min="1"
                value={syncLimit}
                onChange={(e) => setSyncLimit(e.target.value)}
                placeholder="Or enter custom number (leave empty for all)"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={tests.fullSync.status === 'running'}
              />
              <p className="text-xs text-gray-500 mt-1">
                ⚠️ Note: 50+ products will take ~100+ seconds due to dubros.com API speed
              </p>
            </div>
            <Button
              onClick={runSyncTest}
              disabled={tests.fullSync.status === 'running'}
              variant="default"
              className="w-full"
            >
              {tests.fullSync.status === 'running' ? 'Syncing...' : 'Run Full Sync Test'}
            </Button>
          </div>

          {tests.fullSync.status !== 'idle' && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="font-medium mb-2">Result:</p>
              <p className="text-sm text-gray-700">{tests.fullSync.message}</p>
              {tests.fullSync.duration && (
                <p className="text-xs text-gray-500 mt-2">Duration: {tests.fullSync.duration}ms</p>
              )}
              {tests.fullSync.data && (
                <details className="mt-2">
                  <summary className="text-sm font-medium cursor-pointer">View Details</summary>
                  <pre className="text-xs bg-white p-2 rounded mt-2 overflow-auto max-h-96">
                    {JSON.stringify(tests.fullSync.data, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
