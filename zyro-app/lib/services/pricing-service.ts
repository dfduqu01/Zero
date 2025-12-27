import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Pricing Tier from database
 */
export interface PricingTier {
  id: string;
  tier_name: string;
  min_cost: number;
  max_cost: number | null;
  markup_multiplier: number;
  display_order?: number;
  is_active?: boolean;
}

/**
 * Result of pricing calculation
 */
export interface PricingResult {
  cost_dubros: number;
  cost_shipping: number;
  cost_total: number;
  pricing_tier_id: string;
  tier_name: string;
  markup_multiplier: number;
  price: number;
  profit_amount: number;
  profit_margin_percent: number;
}

/**
 * PricingService handles all pricing calculations using tier-based markup system
 *
 * Formula: Selling Price = Shipping Cost + (Dubros Cost × Tier Markup)
 *
 * Example:
 *   Dubros: $60, Shipping: $25, Tier: Mid-Range (3.0x)
 *   Price = $25 + ($60 × 3.0) = $205
 *   Profit = $205 - ($60 + $25) = $120 (141% margin)
 */
export class PricingService {
  private tiers: PricingTier[] = [];

  /**
   * Load active pricing tiers from database
   */
  async loadTiers(supabase: SupabaseClient): Promise<void> {
    const { data, error } = await supabase
      .from('pricing_tiers')
      .select('*')
      .eq('is_active', true)
      .order('min_cost', { ascending: true });

    if (error) {
      console.error('[PricingService] Failed to load tiers:', error);
      throw new Error(`Failed to load pricing tiers: ${error.message}`);
    }

    this.tiers = (data || []).map(tier => ({
      ...tier,
      min_cost: Number(tier.min_cost),
      max_cost: tier.max_cost ? Number(tier.max_cost) : null,
      markup_multiplier: Number(tier.markup_multiplier),
    }));

    console.log(`[PricingService] Loaded ${this.tiers.length} active tiers:`,
      this.tiers.map(t => `${t.tier_name} (${t.min_cost}-${t.max_cost || '∞'}: ${t.markup_multiplier}x)`).join(', ')
    );
  }

  /**
   * Find the appropriate tier for a given dubros cost
   */
  findTier(dubrosCost: number): PricingTier | null {
    const tier = this.tiers.find(t => {
      const aboveMin = dubrosCost >= t.min_cost;
      const belowMax = t.max_cost === null || dubrosCost < t.max_cost;
      return aboveMin && belowMax;
    });

    if (!tier) {
      console.warn(`[PricingService] No tier found for cost $${dubrosCost}`);
    }

    return tier || null;
  }

  /**
   * Calculate complete pricing for a product with formula selection
   *
   * @param dubrosCost - Wholesale cost per unit from dubros.com (after dozen calculation)
   * @param shippingCost - Flat shipping cost per product (default: $25)
   * @param formula - Pricing formula to use (1 or 2)
   *   - Formula 1: price = shippingCost + (dubrosCost × markup) [CURRENT/DEFAULT]
   *   - Formula 2: price = dubrosCost × markup [NEW - shipping separate]
   * @returns Complete pricing breakdown or null if no tier found
   */
  calculatePriceWithFormula(
    dubrosCost: number,
    shippingCost: number = 25,
    formula: 1 | 2 = 1
  ): PricingResult | null {
    // Validate inputs
    if (dubrosCost < 0) {
      console.error('[PricingService] Invalid dubros cost:', dubrosCost);
      return null;
    }

    if (shippingCost < 0) {
      console.error('[PricingService] Invalid shipping cost:', shippingCost);
      return null;
    }

    if (formula !== 1 && formula !== 2) {
      console.error('[PricingService] Invalid formula:', formula);
      return null;
    }

    // Find matching tier
    const tier = this.findTier(dubrosCost);

    if (!tier) {
      return null;
    }

    // Calculate pricing based on selected formula
    const costTotal = dubrosCost + shippingCost;
    let sellingPrice: number;

    if (formula === 1) {
      // Formula 1 (Current): price = shipping + (cost × markup)
      // Example: $25 + ($15 × 2.5) = $62.50
      sellingPrice = shippingCost + (dubrosCost * tier.markup_multiplier);
    } else {
      // Formula 2 (New): price = cost × markup (shipping separate)
      // Example: $15 × 2.5 = $37.50 (+ $25 shipping at checkout)
      sellingPrice = dubrosCost * tier.markup_multiplier;
    }

    const profit = sellingPrice - costTotal;
    const marginPercent = costTotal > 0 ? (profit / costTotal) * 100 : 0;

    return {
      cost_dubros: Number(dubrosCost.toFixed(2)),
      cost_shipping: Number(shippingCost.toFixed(2)),
      cost_total: Number(costTotal.toFixed(2)),
      pricing_tier_id: tier.id,
      tier_name: tier.tier_name,
      markup_multiplier: tier.markup_multiplier,
      price: Number(sellingPrice.toFixed(2)),
      profit_amount: Number(profit.toFixed(2)),
      profit_margin_percent: Number(marginPercent.toFixed(2))
    };
  }

  /**
   * Calculate complete pricing for a product (backward compatible)
   *
   * @param dubrosCost - Wholesale cost per unit from dubros.com (after dozen calculation)
   * @param shippingCost - Flat shipping cost per product (default: $25)
   * @returns Complete pricing breakdown or null if no tier found
   */
  calculatePrice(
    dubrosCost: number,
    shippingCost: number = 25
  ): PricingResult | null {
    // Use Formula 1 (current/default) for backward compatibility
    return this.calculatePriceWithFormula(dubrosCost, shippingCost, 1);
  }

  /**
   * Get all loaded tiers (for display/debugging)
   */
  getTiers(): PricingTier[] {
    return [...this.tiers];
  }

  /**
   * Check if tiers are loaded
   */
  isLoaded(): boolean {
    return this.tiers.length > 0;
  }
}
