'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

/**
 * CartSync - Automatic cart transfer from localStorage to database
 *
 * This component runs on every page load and handles cart transfer when:
 * 1. User is authenticated
 * 2. localStorage has cart items
 *
 * This catches cases where users authenticate via email confirmation link
 * and never go through the login form.
 */
export default function CartSync() {
  useEffect(() => {
    const syncCart = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        // Only proceed if user is authenticated
        if (!user) return;

        // Check if localStorage has cart
        const localCart = localStorage.getItem('cart');
        if (!localCart) return;

        const cartItems = JSON.parse(localCart);
        if (cartItems.length === 0) return;

        console.log('🛒 CartSync: Detected logged-in user with localStorage cart');
        console.log('🛒 CartSync: Transferring', cartItems.length, 'items to database');

        // Get existing cart items from database to avoid duplicates
        const { data: existingCartItems } = await supabase
          .from('cart_items')
          .select('id, product_id, quantity')
          .eq('user_id', user.id);

        // Transfer each item from localStorage to database
        for (const item of cartItems) {
          // Check if product already exists in database cart
          const existingItem = existingCartItems?.find(
            (dbItem) => dbItem.product_id === item.productId
          );

          let cartItemId: string;

          if (existingItem) {
            // Update quantity (add localStorage quantity to database quantity)
            const newQuantity = existingItem.quantity + item.quantity;

            await supabase
              .from('cart_items')
              .update({ quantity: newQuantity })
              .eq('id', existingItem.id);

            cartItemId = existingItem.id;
            console.log('🛒 CartSync: Updated existing item:', item.productName);
          } else {
            // Insert new cart item
            const { data: cartItem, error: cartError } = await supabase
              .from('cart_items')
              .insert({
                user_id: user.id,
                product_id: item.productId,
                quantity: item.quantity,
              })
              .select()
              .single();

            if (cartError) {
              console.error('🛒 CartSync: Error inserting cart item:', cartError);
              continue;
            }

            cartItemId = cartItem.id;
            console.log('🛒 CartSync: Inserted new item:', item.productName);
          }

          // Add prescription if exists (NEW STRUCTURE - Nov 7, 2025)
          // This runs for BOTH new and existing items!
          if (item.prescription && cartItemId) {
            console.log('🛒 CartSync: Item has prescription data:', {
              prescription_type_id: item.prescription.prescription_type_id,
              lens_type_id: item.prescription.lens_type_id,
              lens_index_id: item.prescription.lens_index_id,
              view_area_id: item.prescription.view_area_id,
            });

            // Check if prescription already exists for this cart item
            const { data: existingPresc } = await supabase
              .from('cart_item_prescriptions')
              .select('id')
              .eq('cart_item_id', cartItemId)
              .single();

            const prescriptionData: any = {
              cart_item_id: cartItemId,
              has_prescription: true,
              prescription_type_id: item.prescription.prescription_type_id,
              lens_type_id: item.prescription.lens_type_id || null,
              lens_index_id: item.prescription.lens_index_id || null,
              view_area_id: item.prescription.view_area_id || null,
            };

            // Add formula if present
            if (item.prescription.formula) {
              const formula = item.prescription.formula;
              prescriptionData.od_sph = formula.od_sph || null;
              prescriptionData.od_cyl = formula.od_cyl || null;
              prescriptionData.od_axis = formula.od_axis || null;
              prescriptionData.os_sph = formula.os_sph || null;
              prescriptionData.os_cyl = formula.os_cyl || null;
              prescriptionData.os_axis = formula.os_axis || null;
              prescriptionData.pd = formula.pd || null;
              prescriptionData.pd_dual_od = formula.pd_dual_od || null;
              prescriptionData.pd_dual_os = formula.pd_dual_os || null;
              prescriptionData.add_value = formula.add_value || null;
              console.log('🛒 CartSync: Added formula to prescription');
            }

            // Add prescription image if present (base64 from localStorage)
            if (item.prescription.prescription_image_url) {
              // TODO: Upload to Supabase Storage and get URL
              // For now, store the base64 directly (not ideal for production)
              prescriptionData.prescription_image_url = item.prescription.prescription_image_url;
              console.log('🛒 CartSync: Added prescription image');
            }

            // Use upsert to handle both new and existing prescriptions
            console.log('🛒 CartSync: Upserting prescription data:', prescriptionData);

            if (existingPresc) {
              // Update existing prescription
              const { error: prescError } = await supabase
                .from('cart_item_prescriptions')
                .update(prescriptionData)
                .eq('cart_item_id', cartItemId);

              if (prescError) {
                console.error('🛒 CartSync: ERROR updating prescription:', prescError);
                console.error('🛒 CartSync: Failed data:', prescriptionData);
              } else {
                console.log('🛒 CartSync: Prescription updated successfully');
              }
            } else {
              // Insert new prescription
              const { error: prescError } = await supabase
                .from('cart_item_prescriptions')
                .insert(prescriptionData);

              if (prescError) {
                console.error('🛒 CartSync: ERROR inserting prescription:', prescError);
                console.error('🛒 CartSync: Failed data:', prescriptionData);
              } else {
                console.log('🛒 CartSync: Prescription inserted successfully');
              }
            }
          } else if (!item.prescription) {
            console.log('🛒 CartSync: No prescription data for item:', item.productName);
          }

          console.log('🛒 CartSync: Transferred item:', item.productName);
        }

        // Clear localStorage cart after successful transfer
        console.log('🛒 CartSync: Transfer complete, clearing localStorage cart');
        localStorage.removeItem('cart');

        // Trigger a page refresh to show the updated cart
        window.location.reload();
      } catch (error) {
        console.error('🛒 CartSync: Error during cart sync:', error);
        // Don't throw - cart sync failure shouldn't break the page
      }
    };

    // Run cart sync
    syncCart();
  }, []); // Run once on mount

  // This component doesn't render anything
  return null;
}
