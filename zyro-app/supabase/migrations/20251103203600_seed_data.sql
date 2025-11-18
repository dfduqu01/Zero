-- ============================================
-- ZERO E-COMMERCE - SEED DATA
-- ============================================
-- Migration: 20251103203600_seed_data.sql
-- Description: Initial seed data for categories, materials, shapes, treatments
-- Author: Claude
-- Date: 2025-11-03 (Updated: 2025-11-04 - Fixed UUIDs)
-- ============================================

-- ============================================
-- PRODUCT CATEGORIES (2 categories)
-- ============================================

INSERT INTO categories (id, name, slug, description, display_order) VALUES
  ('c1111111-1111-4111-8111-111111111111', 'Gafas de Sol', 'gafas-de-sol', 'Protección UV y estilo para el día a día', 1),
  ('c2222222-2222-4222-8222-222222222222', 'Gafas con Receta', 'gafas-con-receta', 'Lentes graduados para tu vista perfecta', 2);

-- ============================================
-- FRAME MATERIALS
-- ============================================

INSERT INTO frame_materials (id, name) VALUES
  ('a1111111-1111-4111-8111-111111111111', 'Acetato'),
  ('a2222222-2222-4222-8222-222222222222', 'Metal'),
  ('a3333333-3333-4333-8333-333333333333', 'Titanio'),
  ('a4444444-4444-4444-8444-444444444444', 'Plástico'),
  ('a5555555-5555-4555-8555-555555555555', 'Acero Inoxidable'),
  ('a6666666-6666-4666-8666-666666666666', 'Aluminio');

-- ============================================
-- FRAME SHAPES
-- ============================================

INSERT INTO frame_shapes (id, name) VALUES
  ('f1111111-1111-4111-8111-111111111111', 'Redondo'),
  ('f2222222-2222-4222-8222-222222222222', 'Cuadrado'),
  ('f3333333-3333-4333-8333-333333333333', 'Aviador'),
  ('f4444444-4444-4444-8444-444444444444', 'Ojo de Gato'),
  ('f5555555-5555-4555-8555-555555555555', 'Wayfarer'),
  ('f6666666-6666-4666-8666-666666666666', 'Rectangular'),
  ('f7777777-7777-4777-8777-777777777777', 'Ovalado'),
  ('f8888888-8888-4888-8888-888888888888', 'Mariposa');

-- ============================================
-- LENS TREATMENTS
-- ============================================

INSERT INTO lens_treatments (id, name, description, base_price, is_active, display_order) VALUES
  (
    '11111111-1111-4111-8111-111111111111',
    'Fotocromático',
    'Lentes que se oscurecen automáticamente con la luz solar y se aclaran en interiores',
    89.99,
    true,
    1
  ),
  (
    '22222222-2222-4222-8222-222222222222',
    'Anti-Reflejo',
    'Reduce reflejos y mejora claridad visual en pantallas y conducción nocturna',
    49.99,
    true,
    2
  ),
  (
    '33333333-3333-4333-8333-333333333333',
    'Bloqueo Luz Azul',
    'Protección contra luz azul de dispositivos digitales, reduce fatiga visual',
    39.99,
    true,
    3
  ),
  (
    '44444444-4444-4444-8444-444444444444',
    'Protección UV',
    'Protección 100% contra rayos UV dañinos del sol',
    29.99,
    true,
    4
  ),
  (
    '55555555-5555-4555-8555-555555555555',
    'Polarizado',
    'Elimina reflejos del agua, nieve y superficies brillantes',
    79.99,
    true,
    5
  ),
  (
    '66666666-6666-4666-8666-666666666666',
    'Resistente a Rayaduras',
    'Capa protectora que mantiene tus lentes como nuevos por más tiempo',
    24.99,
    true,
    6
  );

-- ============================================
-- BRANDS (Sample brands)
-- ============================================

INSERT INTO brands (id, name, slug, logo_url) VALUES
  (
    'b1111111-1111-4111-8111-111111111111',
    'ZERO Signature',
    'zero-signature',
    NULL
  ),
  (
    'b2222222-2222-4222-8222-222222222222',
    'Ray-Ban',
    'ray-ban',
    NULL
  ),
  (
    'b3333333-3333-4333-8333-333333333333',
    'Oakley',
    'oakley',
    NULL
  ),
  (
    'b4444444-4444-4444-8444-444444444444',
    'Persol',
    'persol',
    NULL
  );

-- ============================================
-- SAMPLE PRODUCTS (For testing)
-- ============================================

-- Product 1: ZERO Signature Acetato
INSERT INTO products (
  id, sku, name, description, price,
  brand_id, category_id, frame_material_id, frame_shape_id,
  lens_width, bridge_width, temple_length,
  stock_quantity, low_stock_threshold, is_active
) VALUES (
  'e1111111-1111-4111-8111-111111111111',
  'ZERO-001',
  'ZERO Signature Acetato',
  'Diseño exclusivo en acetato premium con estilo atemporal. Fabricado con los más altos estándares de calidad.',
  129.99,
  'b1111111-1111-4111-8111-111111111111',
  'c2222222-2222-4222-8222-222222222222',
  'a1111111-1111-4111-8111-111111111111',
  'f5555555-5555-4555-8555-555555555555',
  52, 18, 145,
  25, 5, true
);

-- Product 2: Ray-Ban Aviator Classic
INSERT INTO products (
  id, sku, name, description, price,
  brand_id, category_id, frame_material_id, frame_shape_id,
  lens_width, bridge_width, temple_length,
  stock_quantity, low_stock_threshold, is_active
) VALUES (
  'e2222222-2222-4222-8222-222222222222',
  'RB-3025-001',
  'Ray-Ban Aviator Classic',
  'Icónicas gafas de sol aviador con lentes de cristal. Un clásico que nunca pasa de moda.',
  159.99,
  'b2222222-2222-4222-8222-222222222222',
  'c1111111-1111-4111-8111-111111111111',
  'a2222222-2222-4222-8222-222222222222',
  'f3333333-3333-4333-8333-333333333333',
  58, 14, 135,
  50, 5, true
);

-- Product 3: Oakley Radar EV Path
INSERT INTO products (
  id, sku, name, description, price,
  brand_id, category_id, frame_material_id, frame_shape_id,
  lens_width, bridge_width, temple_length,
  stock_quantity, low_stock_threshold, is_active
) VALUES (
  'e3333333-3333-4333-8333-333333333333',
  'OAK-9208-920801',
  'Oakley Radar EV Path',
  'Gafas deportivas de alto rendimiento con tecnología Prizm. Perfectas para ciclismo y running.',
  189.99,
  'b3333333-3333-4333-8333-333333333333',
  'c1111111-1111-4111-8111-111111111111',
  'a4444444-4444-4444-8444-444444444444',
  'f6666666-6666-4666-8666-666666666666',
  138, 0, 128,
  15, 5, true
);

-- ============================================
-- PRODUCT LENS TREATMENTS (Sample associations)
-- ============================================

-- ZERO Signature can have all treatments
INSERT INTO product_lens_treatments (product_id, treatment_id, price_override) VALUES
  ('e1111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111', 79.99), -- Fotocromático (discounted)
  ('e1111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222', NULL),
  ('e1111111-1111-4111-8111-111111111111', '33333333-3333-4333-8333-333333333333', NULL),
  ('e1111111-1111-4111-8111-111111111111', '44444444-4444-4444-8444-444444444444', NULL),
  ('e1111111-1111-4111-8111-111111111111', '66666666-6666-4666-8666-666666666666', NULL);

-- Ray-Ban Aviator - sunglasses treatments
INSERT INTO product_lens_treatments (product_id, treatment_id, price_override) VALUES
  ('e2222222-2222-4222-8222-222222222222', '11111111-1111-4111-8111-111111111111', NULL),
  ('e2222222-2222-4222-8222-222222222222', '44444444-4444-4444-8444-444444444444', NULL),
  ('e2222222-2222-4222-8222-222222222222', '55555555-5555-4555-8555-555555555555', NULL);

-- Oakley Radar - sports treatments
INSERT INTO product_lens_treatments (product_id, treatment_id, price_override) VALUES
  ('e3333333-3333-4333-8333-333333333333', '33333333-3333-4333-8333-333333333333', NULL),
  ('e3333333-3333-4333-8333-333333333333', '55555555-5555-4555-8555-555555555555', NULL),
  ('e3333333-3333-4333-8333-333333333333', '66666666-6666-4666-8666-666666666666', NULL);

-- ============================================
-- MIGRATION COMPLETE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE 'Migration 20251103203600_seed_data.sql completed successfully';
  RAISE NOTICE 'Seeded: 2 categories, 6 materials, 8 shapes, 6 treatments, 4 brands, 3 sample products';
  RAISE NOTICE 'Database is ready for development!';
END $$;
