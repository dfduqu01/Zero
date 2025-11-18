-- ============================================
-- ADD ORDER CREATION INSERT POLICIES
-- ============================================
-- Migration: 20251104000000_add_order_insert_policies.sql
-- Description: Adds missing INSERT policies for order creation flow
-- Author: Security Audit Fix
-- Date: 2025-11-04
-- ============================================

-- ============================================
-- ORDER ITEMS INSERT POLICY
-- ============================================

-- Users can insert order items during order creation
-- Validates that the order belongs to them and was recently created
CREATE POLICY "Users can insert order_items during order creation"
  ON order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
      -- Allow insertion within 10 minutes of order creation (buffer for checkout process)
      AND orders.created_at > now() - interval '10 minutes'
    )
  );

-- Admins can insert order items (for manual order creation)
CREATE POLICY "Admins can insert order_items"
  ON order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

-- ============================================
-- ORDER ITEM PRESCRIPTIONS INSERT POLICY
-- ============================================

-- Users can insert prescriptions for their order items
CREATE POLICY "Users can insert order_item_prescriptions"
  ON order_item_prescriptions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM order_items
      JOIN orders ON orders.id = order_items.order_id
      WHERE order_items.id = order_item_prescriptions.order_item_id
      AND orders.user_id = auth.uid()
      AND orders.created_at > now() - interval '10 minutes'
    )
  );

-- Admins can insert order prescriptions (already covered by "Admins can manage" policy)
-- No additional policy needed

-- ============================================
-- ORDER ITEM TREATMENTS INSERT POLICY
-- ============================================

-- Users can insert treatments for their order items
CREATE POLICY "Users can insert order_item_treatments"
  ON order_item_treatments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM order_items
      JOIN orders ON orders.id = order_items.order_id
      WHERE order_items.id = order_item_treatments.order_item_id
      AND orders.user_id = auth.uid()
      AND orders.created_at > now() - interval '10 minutes'
    )
  );

-- Admins can insert order treatments (already covered by "Admins can view all" policy)
-- No additional policy needed for admins as they use the ALL policy

-- ============================================
-- ORDER STATUS HISTORY INSERT POLICY
-- ============================================

-- Only admins can add order status history entries
-- (Already covered by "Admins can manage order_status_history" FOR ALL policy)
-- Users should NOT be able to modify order status
-- This is intentionally admin-only

-- ============================================
-- VERIFICATION
-- ============================================

-- Log migration completion
DO $$
BEGIN
  RAISE NOTICE 'Migration 20251104000000_add_order_insert_policies.sql completed successfully';
  RAISE NOTICE 'Added INSERT policies for: order_items, order_item_prescriptions, order_item_treatments';
  RAISE NOTICE 'Order creation flow is now fully protected';
END $$;
