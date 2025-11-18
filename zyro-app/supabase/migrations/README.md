# ZERO E-Commerce - Database Migrations

This directory contains Supabase database migrations for the ZERO platform.

## Migration Files

### `20251103203500_initial_schema.sql`
**Purpose**: Creates the complete database schema for ZERO MVP

**Includes**:
- ✅ 7 ENUM types (order_status, payment_status, etc.)
- ✅ 23 tables (users, products, orders, cart, inventory, etc.)
- ✅ 40+ indexes for performance optimization
- ✅ 50+ Row Level Security (RLS) policies
- ✅ Triggers for `updated_at` timestamps
- ✅ Complete foreign key relationships

**Tables Created**:
1. **Authentication & Users** (2 tables)
   - `users` - Extended user profiles
   - `addresses` - Shipping addresses with country

2. **Product Catalog** (8 tables)
   - `brands` - Product brands
   - `categories` - Product categories (Gafas de Sol, Gafas con Receta)
   - `frame_materials` - Frame material types
   - `frame_shapes` - Frame shape types
   - `products` - Main product table
   - `product_images` - Product image gallery
   - `lens_treatments` - Available lens treatments
   - `product_lens_treatments` - Many-to-many relationship

3. **Shopping Cart** (3 tables)
   - `cart_items` - Shopping cart entries
   - `cart_item_prescriptions` - Prescription data for cart
   - `cart_item_treatments` - Selected treatments for cart

4. **Orders & Transactions** (5 tables)
   - `orders` - Main order table
   - `order_items` - Order line items
   - `order_item_prescriptions` - Prescription snapshots
   - `order_item_treatments` - Treatment snapshots
   - `order_status_history` - Order status audit trail

5. **Inventory & ERP** (3 tables)
   - `inventory_movements` - Stock movement audit trail
   - `erp_sync_logs` - ERP sync history
   - `erp_sync_errors` - ERP sync error tracking

6. **Customer Engagement - P2** (2 tables)
   - `wishlists` - User wishlists
   - `product_reviews` - Product reviews and ratings

7. **Support** (1 table)
   - `contact_submissions` - Contact form submissions

### `20251103203600_seed_data.sql`
**Purpose**: Populates initial seed data for development and testing

**Includes**:
- ✅ 2 product categories (Gafas de Sol, Gafas con Receta)
- ✅ 6 frame materials (Acetato, Metal, Titanio, etc.)
- ✅ 8 frame shapes (Redondo, Cuadrado, Aviador, etc.)
- ✅ 6 lens treatments (Fotocromático, Anti-Reflejo, etc.)
- ✅ 4 sample brands (ZERO Signature, Ray-Ban, Oakley, Persol)
- ✅ 3 sample products for testing

## How to Apply Migrations

### Option 1: Using Supabase CLI (Recommended)

```bash
# Navigate to the zyro-app directory
cd /workspaces/Zyro/zyro-app

# Initialize Supabase (if not already done)
supabase init

# Link to your Supabase project
supabase link --project-ref your-project-ref

# Apply all migrations
supabase db push

# Or apply a specific migration
supabase migration up
```

### Option 2: Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the content of `20251103203500_initial_schema.sql`
4. Paste and run
5. Copy the content of `20251103203600_seed_data.sql`
6. Paste and run

### Option 3: Manual SQL Execution

```bash
# Connect to your Supabase database
psql "postgresql://postgres:[PASSWORD]@[PROJECT_REF].supabase.co:5432/postgres"

# Run migrations in order
\i 20251103203500_initial_schema.sql
\i 20251103203600_seed_data.sql
```

## Verification

After applying migrations, verify the setup:

```sql
-- Check tables were created
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Check seed data
SELECT * FROM categories;
SELECT * FROM frame_materials;
SELECT * FROM lens_treatments;
SELECT * FROM products;

-- Check RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND rowsecurity = true;
```

## Row Level Security (RLS) Overview

All tables have RLS enabled with the following policies:

### Public Access
- ✅ Product catalog (products, brands, categories, materials, shapes)
- ✅ Product images
- ✅ Active lens treatments

### User Access (Own Data Only)
- ✅ User profiles
- ✅ Addresses
- ✅ Cart items and prescriptions
- ✅ Orders and order items
- ✅ Wishlists
- ✅ Product reviews (own reviews)

### Admin Access (All Data)
- ✅ All user data
- ✅ All orders
- ✅ Inventory management
- ✅ ERP sync logs
- ✅ Product management
- ✅ Review moderation

### Guest Access
- ✅ Can create contact submissions
- ✅ Can view product catalog
- ✅ Can create orders (with guest_email)

## Important Notes

### Country Field
The `country` field is **REQUIRED** in:
- `users` table
- `addresses` table
- `orders` table (for guest orders: `guest_country`)
- `contact_submissions` table

This is **critical** for international shipping cost calculation across Latin American countries.

### Prescription Data
Prescription fields have CHECK constraints:
- `SPH (Sphere)`: -20.00 to +20.00
- `CYL (Cylinder)`: -4.00 to +4.00
- `AXIS`: 0 to 180
- `PD (Pupillary Distance)`: 20.0 to 80.0

### Guest Carts
- Guest carts use `session_id` instead of `user_id`
- Expire after 7 days (`expires_at` field)
- Consider adding a cron job to clean up expired carts

### Order Numbers
Format: `ZER-2025-00001`
- Prefix: `ZER-`
- Year: `2025`
- Sequential number: `00001`

Implement using a sequence or function to generate unique order numbers.

## Next Steps

After applying migrations:

1. **Set up Supabase Storage buckets** (see `/docs/SUPABASE-STORAGE.md`)
2. **Configure environment variables** in `.env.local`
3. **Test authentication flow**
4. **Test RLS policies** with different user roles
5. **Create admin user** (set `is_admin = true`)
6. **Add more sample products** for development

## Troubleshooting

### Error: "relation already exists"
If migrations fail due to existing tables, you can:
```sql
-- Drop all tables (BE CAREFUL - THIS DELETES DATA!)
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;

-- Then re-run migrations
```

### Error: "permission denied"
Make sure you're connected with the right credentials:
- Use `postgres` user for administrative tasks
- Use service role key for programmatic access

### RLS Issues
If you're having trouble accessing data:
```sql
-- Temporarily disable RLS for testing (NOT FOR PRODUCTION!)
ALTER TABLE products DISABLE ROW LEVEL SECURITY;

-- Re-enable when done testing
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
```

## Support

For questions or issues with migrations:
1. Check the main PRD: `/docs/PRD.md`
2. Review the database schema: `/docs/DATABASE-SCHEMA.md`
3. Check the ERD: `/docs/DATABASE-ERD.md`

---

**Migration Status**: ✅ Ready to deploy
**Last Updated**: 2025-11-03
**Version**: 1.0
