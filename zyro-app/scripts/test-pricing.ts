/**
 * Test script for pricing tier system
 *
 * Run with: npx tsx scripts/test-pricing.ts
 */

import { PricingService } from '../lib/services/pricing-service';

// Mock Supabase client for testing
const mockTiers = [
  {
    id: 'tier-1',
    tier_name: 'Budget',
    min_cost: 0,
    max_cost: 30,
    markup_multiplier: 4.0,
    display_order: 1,
    is_active: true,
  },
  {
    id: 'tier-2',
    tier_name: 'Mid-Range',
    min_cost: 30,
    max_cost: 100,
    markup_multiplier: 3.0,
    display_order: 2,
    is_active: true,
  },
  {
    id: 'tier-3',
    tier_name: 'Premium',
    min_cost: 100,
    max_cost: null,
    markup_multiplier: 2.5,
    display_order: 3,
    is_active: true,
  },
];

async function testPricingCalculations() {
  console.log('🧪 Testing Pricing Tier System\n');
  console.log('='.repeat(80));

  const pricingService = new PricingService();

  // Manually load tiers (bypass Supabase for testing)
  (pricingService as any).tiers = mockTiers;

  console.log('\n✅ Loaded', pricingService.getTiers().length, 'pricing tiers\n');

  // Test cases: [dubros_cost, expected_tier, description]
  const testCases = [
    { cost: 10, tier: 'Budget', desc: 'Low-cost product ($10)' },
    { cost: 15, tier: 'Budget', desc: 'Budget tier upper range ($15)' },
    { cost: 29.99, tier: 'Budget', desc: 'Just below mid-range ($29.99)' },
    { cost: 30, tier: 'Mid-Range', desc: 'Mid-range boundary ($30)' },
    { cost: 50, tier: 'Mid-Range', desc: 'Mid-range product ($50)' },
    { cost: 99.99, tier: 'Mid-Range', desc: 'Just below premium ($99.99)' },
    { cost: 100, tier: 'Premium', desc: 'Premium boundary ($100)' },
    { cost: 150, tier: 'Premium', desc: 'Premium product ($150)' },
    { cost: 300, tier: 'Premium', desc: 'High-end product ($300)' },

    // Dozen products (cost / 12 before tier lookup)
    { cost: 60 / 12, tier: 'Budget', desc: 'Dozen product - Budget tier ($60 / 12 = $5)' },
    { cost: 120 / 12, tier: 'Budget', desc: 'Dozen product - Budget tier ($120 / 12 = $10)' },
    { cost: 600 / 12, tier: 'Mid-Range', desc: 'Dozen product - Mid-Range tier ($600 / 12 = $50)' },
    { cost: 1200 / 12, tier: 'Premium', desc: 'Dozen product - Premium tier ($1200 / 12 = $100)' },
  ];

  const shippingCost = 25;

  console.log('📊 Test Results:\n');
  console.log('Formula: Selling Price = $25 Shipping + (Dubros Cost × Tier Markup)\n');

  let passedTests = 0;
  let failedTests = 0;

  for (const testCase of testCases) {
    const pricing = pricingService.calculatePrice(testCase.cost, shippingCost);

    if (!pricing) {
      console.error(`❌ FAILED: ${testCase.desc}`);
      console.error(`   No tier found for cost: $${testCase.cost.toFixed(2)}\n`);
      failedTests++;
      continue;
    }

    const tierMatch = pricing.tier_name === testCase.tier;
    const status = tierMatch ? '✅' : '❌';

    if (tierMatch) {
      passedTests++;
    } else {
      failedTests++;
    }

    console.log(`${status} ${testCase.desc}`);
    console.log(`   Tier: ${pricing.tier_name} (${pricing.markup_multiplier}x markup)`);
    console.log(`   Dubros Cost: $${pricing.cost_dubros.toFixed(2)}`);
    console.log(`   Shipping: $${pricing.cost_shipping.toFixed(2)}`);
    console.log(`   Total Cost: $${pricing.cost_total.toFixed(2)}`);
    console.log(`   Selling Price: $${pricing.price.toFixed(2)}`);
    console.log(`   Profit: $${pricing.profit_amount.toFixed(2)} (${pricing.profit_margin_percent.toFixed(1)}% margin)`);

    // Verify calculation
    const expectedPrice = shippingCost + (testCase.cost * pricing.markup_multiplier);
    const calculationMatch = Math.abs(pricing.price - expectedPrice) < 0.01;

    if (!calculationMatch) {
      console.log(`   ⚠️  WARNING: Price calculation mismatch!`);
      console.log(`      Expected: $${expectedPrice.toFixed(2)}`);
      console.log(`      Got: $${pricing.price.toFixed(2)}`);
    }

    console.log();
  }

  console.log('='.repeat(80));
  console.log(`\n🎯 Test Summary: ${passedTests} passed, ${failedTests} failed`);

  if (failedTests === 0) {
    console.log('\n🎉 All pricing calculations are working correctly!\n');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the results above.\n');
    process.exit(1);
  }
}

// Run tests
testPricingCalculations().catch(error => {
  console.error('❌ Test error:', error);
  process.exit(1);
});
