'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function PricingActions() {
  const router = useRouter();
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [shippingCost, setShippingCost] = useState(25);
  const [respectOverrides, setRespectOverrides] = useState(true);
  const [result, setResult] = useState<any>(null);

  const handleRecalculate = async () => {
    if (!confirm(`This will recalculate prices for all products with a shipping cost of $${shippingCost}. Continue?`)) {
      return;
    }

    setIsRecalculating(true);
    setResult(null);

    try {
      const response = await fetch('/api/admin/pricing/recalculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shippingCost,
          respectOverrides,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Recalculation failed');
      }

      setResult(data);
      router.refresh(); // Refresh the page data
    } catch (error) {
      console.error('Recalculation error:', error);
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsRecalculating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recalculate All Prices</CardTitle>
        <CardDescription>
          Update product prices based on current tier settings
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="shipping">Shipping Cost ($)</Label>
            <Input
              id="shipping"
              type="number"
              value={shippingCost}
              onChange={(e) => setShippingCost(Number(e.target.value))}
              min={0}
              step={1}
            />
            <p className="text-xs text-gray-500 mt-1">Current DHL flat rate</p>
          </div>

          <div className="flex items-center space-x-2 pt-7">
            <input
              type="checkbox"
              id="respect-overrides"
              checked={respectOverrides}
              onChange={(e) => setRespectOverrides(e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="respect-overrides" className="cursor-pointer">
              Respect manual overrides
            </Label>
          </div>
        </div>

        <Button
          onClick={handleRecalculate}
          disabled={isRecalculating}
          className="w-full"
        >
          {isRecalculating ? 'Recalculating...' : 'Recalculate All Prices'}
        </Button>

        {result && (
          <div className={`p-4 rounded-lg border ${
            result.success
              ? 'bg-green-50 border-green-200'
              : 'bg-red-50 border-red-200'
          }`}>
            {result.success ? (
              <>
                <div className="font-medium text-green-900">
                  ✓ {result.message}
                </div>
                <div className="text-sm text-green-700 mt-1">
                  Updated: {result.updated} products | Skipped: {result.skipped}
                </div>
                {result.errors && result.errors.length > 0 && (
                  <div className="text-sm text-yellow-700 mt-2">
                    Warning: {result.errors.length} products had errors
                  </div>
                )}
              </>
            ) : (
              <div className="font-medium text-red-900">
                ✗ Error: {result.error}
              </div>
            )}
          </div>
        )}

        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="text-sm font-medium mb-2">When to recalculate:</div>
          <ul className="text-sm space-y-1 list-disc list-inside">
            <li>After updating pricing tiers</li>
            <li>When shipping costs change</li>
            <li>To apply new pricing strategy</li>
            <li>After bulk import without pricing</li>
          </ul>
          <div className="text-xs text-gray-600 mt-2">
            Note: Products with manual price overrides will be skipped by default
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
